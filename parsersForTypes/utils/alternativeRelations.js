const deepcopy = require("deepcopy");

const { superset, subset, union, insert } = require("./setUtils");

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
    return [...setOfDeps].reduce((set, dep) => {
      if (![...set].some(s => subset(s, dep))) {
        return insert(new Set([...set].filter(s => !superset(s, dep))), dep);
      }

      return set;
    }, setAcc);
  }, new Set());
};

const allInvolvedNandKeys = peersContainers => {
  return [
    ...peersContainers.reduce((allPeersSet, peer) => {
      return peer.peers.reduce((set, peerItem) => {
        set.add(peerItem.key);
        return set;
      }, allPeersSet);
    }, new Set())
  ];
};

module.exports = {
  makeFullDependencies,
  normaliseSeparator,
  computedNotAllowedRelation,
  allInvolvedNandKeys
};
