const {
  normaliseSeparator,
  insert,
  computedNotAllowedRelation
} = require("./alternativeRelations");

const extract = joiSchema => {
  return (joiSchema.$_terms.dependencies ?? [])
    .filter(dependency => dependency.rel === "xor")
    .map(normaliseSeparator);
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

const makeDependencies = peersContainers =>
  peersContainers.reduce((storeAcc, peersContainer) => {
    return makeRelations(peersContainer.peers, storeAcc, [[], []])[0];
  }, {});

module.exports = {
  makeDependencies,
  extract,
  computedNotAllowedRelation: nands => computedNotAllowedRelation(nands, makeDependencies)
};
