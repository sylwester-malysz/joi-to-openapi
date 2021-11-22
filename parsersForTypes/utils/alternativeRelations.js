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

const subset = (as, bs) => {
  return [...as].every(elm => bs.has(elm));
};

const superset = (as, bs) => {
  return subset(bs, as);
};

const insert = (set, elm) => {
  if (!eqContains(set, elm)) set.add(elm);

  return set;
};

const union = (setA, setB) => {
  return [...setB].reduce((set, elm) => insert(set, elm), new Set(setA));
};

const removeProcessingKeyDependency = (key, deps) => {
  return Object.entries(deps).reduce((acc, [processingKey, processingDeps]) => {
    const dependencies = [...processingDeps].filter(set => !set.has(key));
    if (dependencies.length > 0) {
      acc[processingKey] = new Set(dependencies);
    }
    return acc;
  }, {});
};

const computeDependenciesForKey = (processingKey, globalDependecies, instanceDependencies) => {
  const allowedDependencies = removeProcessingKeyDependency(
    processingKey,
    [...instanceDependencies].reduce((acc, key) => removeKey(acc, key), globalDependecies)
  );

  const depsToProcess = Object.entries(allowedDependencies);

  if (depsToProcess.length === 0) return new Set([instanceDependencies]);

  return depsToProcess.reduce((acc, [key, deps]) => {
    const newDeps = union(instanceDependencies, [...deps][0]);
    const allDeps = computeDependenciesForKey(key, removeKey(allowedDependencies, key), newDeps);
    return [...allDeps].reduce((set, element) => insert(set, element), acc);
  }, new Set());
};

const makeFullDependencies = dependencies => {
  const computedDeps = Object.entries(dependencies).reduce((acc, [key, deps]) => {
    acc[key] = [...deps].reduce((set, dep) => {
      const depSet = computeDependenciesForKey(key, removeKey(dependencies, key), dep);
      return [...depSet].reduce((accSet, elm) => insert(accSet, elm), set);
    }, new Set());

    return acc;
  }, {});

  return computedDeps;
};

const computedNotAllowedRelation = (peersContainers, makeDependencies) => {
  const dependencies = makeFullDependencies(makeDependencies(peersContainers));
  return Object.values(dependencies).reduce((setAcc, setOfDeps) => {
    return [...setOfDeps].reduce((set, dep) => insert(set, dep), setAcc);
  }, new Set());
};

module.exports = {
  makeFullDependencies,
  eqContains,
  superset,
  subset,
  union,
  normaliseSeparator,
  setEquality,
  insert,
  computedNotAllowedRelation
};
