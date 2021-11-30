const deepcopy = require("deepcopy");

const escapeSepToRegExp = sep => {
  if (sep === ".") return "\\.";

  return sep;
};

const normaliseSeparator = _nand => {
  const nand = _nand;
  nand.peers = nand.peers.map(_peer => {
    const peer = _peer;
    peer.key = peer.key.replace(new RegExp(escapeSepToRegExp(peer.separator), "g"), ".");
    return peer;
  });
  return nand;
};

const extractNands = joiSchema => {
  return (joiSchema.$_terms.dependencies ?? [])
    .filter(dependency => dependency.rel === "nand")
    .map(normaliseSeparator);
};

const removeKey = (obj, key) => {
  const copy = deepcopy(obj);
  delete copy[key];
  return copy;
};

const setEquality = (as, bs) => {
  if (as.size !== bs.size) return false;
  return [...as].every(elm => {
    if (elm instanceof Set) {
      return [...bs].some(setElm => setEquality(elm, setElm));
    }

    return bs.has(elm);
  });
};

const eqContains = (as, bs) => {
  if (bs instanceof Set) {
    return [...as].some(elm => setEquality(bs, elm));
  }

  return as.has(bs);
};

const insert = (set, elm) => {
  if (!eqContains(set, elm)) set.add(elm);

  return set;
};

const union = (setA, setB) => {
  return [...setB].reduce((set, elm) => insert(set, elm), new Set(setA));
};

const makeRelations = (peers, relation, mem) => {
  const [head, ...tail] = peers;

  if (!head) return [relation, mem];

  const setElement = head.path.join(".");

  const [relations, future] = makeRelations(tail, relation, [[...mem[0], setElement], mem[1]]);

  if (!relations[head.key]) {
    relations[head.key] = new Set([new Set([...mem[0], ...future[1]])]);
  }

  [...mem[0], ...future[1]].forEach(
    elm => new Set([...relations[head.key]].map(set => insert(set, elm)))
  );

  return [relations, [mem[0], [setElement, ...future[1]]]];
};

const makeDependencies = nands =>
  nands.reduce((storeAcc, nand) => {
    return makeRelations(nand.peers, storeAcc, [[], []])[0];
  }, {});

const computeDependenciesForKey = (globalDependecies, instanceDependencies) => {
  const allowedDependencies = [...instanceDependencies].reduce(
    (acc, key) => removeKey(acc, key),
    globalDependecies
  );

  const depsToProcess = Object.entries(allowedDependencies);

  if (depsToProcess.length === 0) return new Set([instanceDependencies]);

  return depsToProcess.reduce((acc, [key, deps]) => {
    const newDeps = union(instanceDependencies, [...deps][0]);
    const allDeps = computeDependenciesForKey(removeKey(allowedDependencies, key), newDeps);
    return [...allDeps].reduce((set, element) => insert(set, element), acc);
  }, new Set());
};

const makeFullDependencies = dependencies => {
  const computedDeps = Object.entries(dependencies).reduce((acc, [key, deps]) => {
    acc[key] = [...deps].reduce((set, dep) => {
      const depSet = computeDependenciesForKey(removeKey(dependencies, key), dep);
      return [...depSet].reduce((accSet, elm) => insert(accSet, elm), set);
    }, new Set());

    return acc;
  }, {});

  return computedDeps;
};

const computedNotAllowedRelation = nands => {
  const dependencies = makeFullDependencies(makeDependencies(nands));
  return Object.values(dependencies).reduce((setAcc, setOfDeps) => {
    return [...setOfDeps].reduce((set, dep) => insert(set, dep), setAcc);
  }, new Set());
};

module.exports = {
  makeDependencies,
  makeFullDependencies,
  extractNands,
  setEquality,
  insert,
  computedNotAllowedRelation
};
