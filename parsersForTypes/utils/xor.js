const {
  normaliseSeparator,
  computedNotAllowedRelation,
  allInvolvedNandKeys
} = require("./alternativeRelations");
const { insert } = require("./setUtils");

const {
  removeKeyWithPath,
  requiredFieldsFromList,
  isFieldPresent,
  maybeMarkAsRequired
} = require("./object");
const { diff } = require("./array");

const extract = joiSchema => {
  const nands = (joiSchema.$_terms.dependencies ?? [])
    .filter(dependency => dependency.rel === "xor")
    .map(normaliseSeparator);

  return [allInvolvedNandKeys(nands), nands];
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

const buildAlternatives = (alternatives, keys, parsedObject, state) => {
  const notAllawedRealations = computedNotAllowedRelation(alternatives, makeDependencies);
  const requiredKeys = requiredFieldsFromList(keys, parsedObject);

  return [...notAllawedRealations].reduce((acc, notAllowedSet) => {
    const notAllowedKeys = [...notAllowedSet];
    const reducedObject = notAllowedKeys.reduce(
      (obj, path) => removeKeyWithPath(path.split("."), obj, state),
      parsedObject
    );

    if (requiredKeys.every(key => isFieldPresent(key.split("."), reducedObject)))
      return [
        ...acc,
        diff(keys, notAllowedKeys).reduce(
          (obj, requiredKeyPath) => maybeMarkAsRequired(requiredKeyPath.split("."), obj),
          reducedObject
        )
      ];

    return acc;
  }, []);
};

module.exports = {
  buildAlternatives,
  makeDependencies,
  extract,
  computedNotAllowedRelation: xors => computedNotAllowedRelation(xors, makeDependencies)
};
