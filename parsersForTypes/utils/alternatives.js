/* eslint-disable no-extend-native */
const deepcopy = require("deepcopy");
const _ = require("lodash");
const { retrieveReferenceByName } = require("./reference");
const { merge, mergeDiff } = require("./merge");

const { overlapping } = require("./overlapping");
const { diff } = require("./difference");
const { extractObjFromPath, singleFieldObject } = require("./object");

Array.prototype.equals = function (lst) {
  const [head, ...tail] = this;
  const [head1, ...tail1] = lst;
  if (tail.length === 0 && tail1.length === 0) return head === head1;
  return head === head1 && tail.equals(tail1);
};

Array.prototype.diff = function (lst) {
  return _.difference(this, lst);
};

const missingKeys = (paths, obj) => {
  return paths.reduce((accumulator, path) => {
    const objByPath = path.split(".").reduce((acc, p) => {
      if (acc && acc.properties) return acc.properties[p];
      if (acc && !acc.properties) return undefined;
      return acc;
    }, deepcopy(obj));
    if (!objByPath) {
      return [...accumulator, path];
    }
    return accumulator;
  }, []);
};

const addKeyAsRequired = (keyPath, _obj) => {
  const obj = _obj;
  const [head, ...tail] = keyPath;
  if (tail.length === 0) {
    obj.required = [...new Set([head, ...(obj.required || [])])];
    return obj;
  }
  return {
    ...obj,
    properties: {
      ...obj.properties,
      [head]: addKeyAsRequired(tail, obj.properties[head])
    }
  };
};

const addKeysAsRequired = (keys, obj) => {
  return keys.reduce((acc, path) => addKeyAsRequired(path.split("."), acc), deepcopy(obj));
};

const makeView = (paths, obj, state, convert) =>
  paths.reduce((acc, p) => extractObjFromPath(p.split("."), obj, acc, state, convert), {});

// TODO : check whether this can be replaced with isSubset function defined in utils/object.js
const removeOverlapping = (list, paths, state, convert) => {
  const [head, ...tail] = list || [];
  if (!head) return [];
  const objView = makeView(paths, head, state, convert);

  const notCoveredObjs = tail
    .filter(obj => {
      const partialView = makeView(paths, obj, state, convert);
      const partialDiff = diff(partialView, objView, state, convert);
      const allKeysMissing = missingKeys(paths, partialDiff).length === paths.length;
      return !allKeysMissing;
    })
    .map(obj => overlapping(obj, head, state, convert));

  const tailNoOverlap = removeOverlapping(notCoveredObjs, paths, state, convert);
  return [head, ...tailNoOverlap];
};

const makeOptions = (peek, then, otherwise, state, convert) => {
  const [falsyOptions, falsePaths] = singleFieldObject(peek);

  const negativeOptions = falsyOptions.map(o => diff(otherwise, o, state, convert));
  const positionOption = mergeDiff(then, peek);

  const [missingKey = [], ...keys] = negativeOptions.reduce((acc, obj) => {
    return [...acc, missingKeys(falsePaths, obj)];
  }, []);
  const positiveMissingKeys = missingKeys(falsePaths, positionOption);
  const allNegativeMissingKeys = keys.reduce(_.intersection, missingKey);

  const zipNegativeAndKeys = _.zip(negativeOptions, [missingKey, ...keys]);
  const negativeAlternatives = zipNegativeAndKeys.reduce((acc, [obj, allKeys]) => {
    return [...acc, addKeysAsRequired(allNegativeMissingKeys.diff(allKeys), obj)];
  }, []);

  return {
    oneOf: [
      addKeysAsRequired(allNegativeMissingKeys.diff(positiveMissingKeys), positionOption),
      ...removeOverlapping(negativeAlternatives, falsePaths, state, convert)
    ]
  };
};

const buildAlternative = (lst, originalObj, state, convert) => {
  const [opts, noOpts] = _.partition(lst, o => o.opt);
  const newObj = opts.reduce((acc, obj) => {
    const { isRequired, ...rest } = obj.opt;

    const _toMerge = {
      type: "object",
      additionalProperties: false,
      properties: {
        [obj.key]: rest
      }
    };

    if (isRequired || (acc.required || []).includes(obj.key)) {
      _toMerge.required = [obj.key];
    }

    return merge(acc, _toMerge, state, convert);
  }, deepcopy(originalObj));
  if (newObj.required) newObj.required = newObj.required.diff(noOpts.map(o => o.key));
  return newObj;
};

const createOpenApiObject = (path, root, obj, state, convert) => {
  const _obj = {
    type: "object",
    properties: [...path].reverse().reduce((acc, key) => {
      const { isRequired, ...rest } = acc;

      let container = { ...rest };
      if (!container.type) {
        container = { type: "object", properties: container };
      }
      return { [key]: container };
    }, obj)
  };

  return merge(root, _obj, state, convert);
};

const createPeekAlternative = (
  is,
  thennable,
  otherwise,
  objectPath,
  fullObject,
  state,
  convert
) => {
  return {
    peek: createOpenApiObject([...objectPath], {}, is, state, convert),
    then: buildAlternative(thennable, fullObject, state, convert),
    otherwise: buildAlternative(otherwise, fullObject, state, convert)
  };
};

const createPeeks = (options, originalObj, state, convert) => {
  const _originalObj = deepcopy(originalObj);
  return Object.entries(options).reduce((acc, [k, v]) => {
    const objectPath = k.split(".");
    const fullObject = createOpenApiObject(objectPath, _originalObj, v.reference, state, convert);

    const alt = v.allCases
      ? [
          createPeekAlternative(
            v.allCases.is,
            v.allCases.options.thennable,
            v.allCases.options.otherwise,
            objectPath,
            fullObject,
            state,
            convert
          )
        ]
      : [];

    const peeksAlternatives = [
      ...Object.values(v.alternatives).map(alternative =>
        createPeekAlternative(
          alternative.is,
          alternative.options.thennable,
          alternative.options.otherwise,
          objectPath,
          fullObject,
          state,
          convert
        )
      ),
      ...alt
    ];

    return acc.length === 0
      ? peeksAlternatives
      : peeksAlternatives.reduce(
          (objs, alterantive) => objs.map(o => merge(o, alterantive, state, convert)),
          acc
        );
  }, []);
};

const joinOption = (_option, opt, key) => {
  const option = _option;
  option.thennable = [...(option.thennable || []), { key, opt: opt.then }];
  option.otherwise = [...(option.otherwise || []), { key, opt: opt.otherwise }];
  return option;
};

const getStoredKeyFromOption = (_option, objChildren, state, convert) => {
  const option = _option;
  if (option.is && option.is.type === "any") {
    option.is = retrieveReferenceByName(option.ref, objChildren, state, convert);
  }
  return option;
};

const isExistenceCondition = obj => obj.type === "string" && !obj.enum;

const groupByOptions = (opts, objChildren, state, convert) => {
  const _objChildren = deepcopy(objChildren);
  return opts.reduce((accumulator, opt) => {
    return opt.options.reduce((store, option) => {
      const maybeConvertedOption = getStoredKeyFromOption(option, _objChildren, state, convert);
      const reference = option.ref;
      const referenceContainer = store[reference] || {
        reference: retrieveReferenceByName(reference, _objChildren, state, convert),
        alternatives: {}
      };

      if (isExistenceCondition(maybeConvertedOption.is)) {
        return {
          ...store,
          [reference]: {
            ...referenceContainer,
            allCases: {
              is: maybeConvertedOption.is,
              options: joinOption({}, maybeConvertedOption, opt.key)
            }
          }
        };
      }

      const storeKey = maybeConvertedOption.is.enum.join(".");
      const enumContainer = referenceContainer.alternatives[storeKey] || {
        is: option.is,
        options: {}
      };

      return {
        ...store,
        [reference]: {
          ...referenceContainer,
          alternatives: {
            ...referenceContainer.referenceContainer,
            [storeKey]: {
              ...enumContainer,
              options: joinOption(enumContainer.options, option, opt.key)
            }
          }
        }
      };
    }, accumulator);
  }, {});
};

const extractPeekFromOrigin = (origin, peek) => {
  if (peek?.type === "object" && origin?.type === "object") {
    return {
      ...peek,
      ...(typeof origin.additionalProperties !== "undefined"
        ? { additionalProperties: origin.additionalProperties }
        : {}),
      properties: Object.entries(peek.properties).reduce(
        ([originObj, peekClone], [key, value]) => {
          if (originObj.properties[key]) {
            return [
              originObj,
              {
                ...peekClone,
                [key]: extractPeekFromOrigin(originObj.properties[key], value)
              }
            ];
          }
          return [originObj, { ...peekClone, [key]: value }];
        },
        [origin, {}]
      )[1]
    };
  }
  return peek;
};

const overwriteRequired = (obj1, obj2) => {
  const _obj1 = deepcopy(obj1);
  const _obj2 = deepcopy(obj2);
  let { required } = _obj1;
  if (required) {
    const allKeys = Object.keys(_obj2.properties);
    const noRequiredKeys = _.difference(allKeys, _obj2.required || []);
    const newRequired = _.difference(required, noRequiredKeys);
    if (newRequired.length > 0) required = newRequired;
  }

  return { ..._obj1, required };
};

const maybeOptionsFromWhens = (obj, joiSchema, state, convert) => {
  if (joiSchema.$_terms.whens) {
    const conditionals = joiSchema.$_terms.whens[0];
    const thennable = convert(conditionals.then, state);
    const otherwise = convert(conditionals.otherwise, state);

    return makeOptions(
      extractPeekFromOrigin(obj, convert(conditionals.is, state)),
      merge(overwriteRequired(obj, thennable), thennable, state, convert),
      merge(overwriteRequired(obj, otherwise), otherwise, state, convert),
      state,
      convert
    );
  }
  return obj;
};

const makeAlternativesFromOptions = (optOf, newObj, state, convert) => {
  const nonEmptyOptions = optOf.filter(opt => opt.options.length !== 0);
  if (nonEmptyOptions.length === 0) {
    return newObj;
  }
  const grouppedOptions = groupByOptions(nonEmptyOptions, newObj, state, convert);
  return {
    oneOf: createPeeks(grouppedOptions, newObj, state, convert)
      .map(p => {
        return makeOptions(
          extractPeekFromOrigin(newObj, p.peek),
          p.then,
          p.otherwise,
          state,
          convert
        );
      })
      .reduce((acc, v) => [...acc, ...v.oneOf], [])
  };
};

module.exports = { makeOptions, makeAlternativesFromOptions, maybeOptionsFromWhens };
