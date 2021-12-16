/* eslint-disable no-unused-vars */
const deepcopy = require("deepcopy");
const {
  normaliseSeparator,
  computedNotAllowedRelation,
  allInvolvedNandKeys
} = require("./alternativeRelations");
const { superset, subset, union, insert } = require("./setUtils");
const { removeKeyWithPath, requiredFieldsFromList, isFieldPresent } = require("./object");

const extract = joiSchema => {
  const nands = (joiSchema.$_terms.dependencies ?? [])
    .filter(dependency => dependency.rel === "nand")
    .map(normaliseSeparator);

  return [allInvolvedNandKeys(nands), nands];
};

const makeRelations = (peers, relation, scanHistory) => {
  const [head, ...tail] = peers;

  if (!head) return [relation, scanHistory];

  const setElement = head.key;
  const [pastScan, futureScan] = scanHistory;

  const [relations, [_, future]] = makeRelations(tail, relation, [
    [...pastScan, setElement],
    futureScan
  ]);

  if (!relations[head.key]) {
    relations[head.key] = new Set([...pastScan, ...future].map(x => new Set([x])));
  }

  [...pastScan, ...future].forEach(elm => insert(relations[head.key], new Set([elm])));

  return [relations, [pastScan, [setElement, ...future]]];
};

const join = (dep_a, dep_b) => {
  const joinedDeps = Object.entries(dep_a).reduce((accDep, [key, deps]) => {
    const dep = accDep;
    dep[key] = !dep[key]
      ? deps
      : [...dep[key]].reduce((set, setDeps) => {
          return [...deps].reduce((accSet, _deps) => {
            const depsUnion = union(_deps, setDeps);
            if (![...accSet].some(s => subset(s, depsUnion))) {
              return insert(new Set([...accSet].filter(s => !superset(s, depsUnion))), depsUnion);
            }
            return accSet;

            // return insert(accSet, depsUnion);
          }, set);
        }, new Set());

    return dep;
  }, deepcopy(dep_b));

  return joinedDeps;
};

const makeDependencies = peersContainers =>
  peersContainers.reduce((storeAcc, peersContainer) => {
    return join(makeRelations(peersContainer.peers, {}, [[], []])[0], storeAcc);
  }, {});

const buildAlternatives = (alternatives, keys, parsedObject, state) => {
  const notAllawedRealations = computedNotAllowedRelation(alternatives, makeDependencies);
  const requiredKeys = requiredFieldsFromList(keys, parsedObject);

  return [...notAllawedRealations].reduce((acc, notAllowedSet) => {
    const reducedObject = [...notAllowedSet].reduce(
      (obj, path) => removeKeyWithPath(path.split("."), obj, state),
      parsedObject
    );

    if (requiredKeys.every(key => isFieldPresent(key.split("."), reducedObject)))
      return [...acc, reducedObject];

    return acc;
  }, []);
};

module.exports = {
  buildAlternatives,
  makeDependencies,
  extract,
  join,
  computedNotAllowedRelation: nands => computedNotAllowedRelation(nands, makeDependencies)
};
