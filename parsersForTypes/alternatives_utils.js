const { retrievePrintedReference } = require("./utils");
const deepcopy = require("deepcopy");
const { merge } = require("./merge_utils");
const _ = require("lodash");

Array.prototype.equals = function(lst) {
  const [head, ...tail] = this;
  const [head1, ...tail1] = lst;
  if (tail.length === 0 && tail1.length == 0) return head === head1;
  return head === head1 && tail.equals(tail1);
};

Array.prototype.diff = function(lst) {
  return _.difference(this, lst);
};

const areKeysPresent = (paths, obj) => {
  return paths.reduce((acc, path) => {
    const objByPath = path.split(".").reduce((acc, p) => {
      if (acc && acc.properties) return acc.properties[p];
      if (acc && !acc.properties) undefined;
      return acc;
    }, deepcopy(obj));
    if (!objByPath) {
      return [...acc, path];
    }
    return acc;
  }, []);
};

const addKeyAsRequired = (keyPath, obj) => {
  const [head, ...tail] = keyPath;
  if (tail.length == 0) {
    obj.required = [...new Set([head, ...(obj.required || [])])];
    return obj;
  }
  return {
    ...obj,
    properties: {
      ...obj.properties,
      [head]: addKeyAsRequired(tail, obj.properties[head]),
    },
  };
};

const addKeysAsRequired = (keys, obj) => {
  return keys.reduce(
    (acc, path) => addKeyAsRequired(path.split("."), acc),
    deepcopy(obj)
  );
};

const makeOptions = (peek, then, otherwise, state, convert) => {
  const [falsyOptions, falsePaths] = singleFieldObject(peek);

  const negativeOptions = falsyOptions.map((o) =>
    makeDiff(deepcopy(otherwise), o, state, convert)
  );
  const positionOption = mergeDiff(then, peek);
  const [missingKey = [], ...keys] = negativeOptions.reduce((acc, obj) => {
    return [...acc, areKeysPresent(falsePaths, obj)];
  }, []);
  const positiveMissingKeys = areKeysPresent(falsePaths, positionOption);
  const allNegativeMissingKeys = keys.reduce(_.intersection, missingKey);

  const zipNegativeAndKeys = _.zip(negativeOptions, [missingKey, ...keys]);

  return {
    oneOf: [
      addKeysAsRequired(
        allNegativeMissingKeys.diff(positiveMissingKeys),
        positionOption
      ),
      ...removeOverlapping(
        zipNegativeAndKeys.reduce((acc, [obj, keys]) => {
          return [
            ...acc,
            addKeysAsRequired(allNegativeMissingKeys.diff(keys), obj),
          ];
        }, []),
        falsePaths,
        state,
        convert
      ),
    ],
  };
};

const mergeDiff = (obj1, obj2) => {
  if ("object" === typeof obj1 && !(obj1 instanceof Array)) {
    return Object.entries(obj1).reduce((acc, [k, v]) => {
      if (k === "required") {
        return {
          ...acc,
          [k]: [...new Set([...(v || []), ...(acc[k] || [])])],
        };
      }
      if (acc[k]) {
        return { ...acc, [k]: mergeDiff(acc[k], v) };
      }
      return acc;
    }, obj2);
  } else {
    return obj1;
  }
};

const extractObjFromPath = (path, obj, store, state) => {
  const [key, ...keys] = path;
  if (!key) return obj;
  if (obj && obj["$ref"]) obj = retrievePrintedReference(obj, state.components);
  if (!obj || (!obj[key] && !obj.properties && !obj.properties[key])) return {};

  const nest = store[key] || {};

  if (obj.type === "object") {
    return {
      [key]: {
        ...nest,
        ...extractObjFromPath(keys, obj.properties[key], nest, state),
      },
    };
  }

  return { [key]: { ...nest, ...obj[key] } };
};

const removeOverlapping = (list, paths, state, convert) => {
  const [head, ...tail] = list || [];
  if (!head) return [];

  const objView = paths.reduce(
    (acc, p) => extractObjFromPath(p.split("."), head, acc, state),
    {}
  );

  const tailNoOverlap = removeOverlapping(
    tail
      .map((l) => cleanFromOverlapping(l, objView, state, convert))
      .filter(([_, keep]) => !keep)
      .map(([el, _]) => el),
    paths,
    state,
    convert
  );
  return [head, ...tailNoOverlap];
};

const cleanFromOverlapping = (obj1, obj2, state, convert) => {
  const supportFn = {
    string: (obj1, obj2) => {
      const remainingItems = obj1.enum.diff(obj2.enum);
      if (remainingItems.length == 0) {
        return [obj1, false];
      }

      return [{ ...obj1, enum: remainingItems }, true];
    },
  };
  return diff(obj1, obj2, state, convert, supportFn);
};

const makeDiff = (obj1, obj2, state, convert) => {
  const supportFn = {
    string: (obj1, obj2) => {
      if (!obj1.enum && !obj2.enum) return [undefined, false];
      if (!obj1.enum) {
        const oldEnum = obj1.not ? obj1.not.enum || [] : [];
        return [{ ...obj1, not: { enum: [...oldEnum, ...obj2.enum] } }, false];
      }
      const remainingItems = obj1.enum.diff(obj2.enum || []);
      if (remainingItems.length == 0) {
        return [undefined, false];
      }
      return [{ ...obj1, enum: remainingItems }, false];
    },
  };
  const [dObj, _] = diff(obj1, obj2, state, convert, supportFn);
  return dObj;
};

const diffObject = (obj1, obj2, state, convert, supportFn) => {
  return Object.entries(obj2).reduce(
    ([acc, keep], [k, v]) => {
      const propertyKey = acc.properties[k];
      if (propertyKey) {
        const [child, noTotallyRemoved] = diff(
          propertyKey,
          v,
          state,
          convert,
          supportFn
        );
        delete acc.properties[k];
        return child
          ? [
              {
                ...acc,
                properties: {
                  ...acc.properties,
                  [k]: child,
                },
              },
              keep && noTotallyRemoved,
            ]
          : [acc, keep];
      }

      return [acc, keep];
    },
    [obj1, true]
  );
};

const diffReference = (r1, r2, state, convert, supportFn) => {
  const fn = (obj) =>
    convert(retrievePrintedReference(obj, state.components), state);
  return diff(
    r1.$ref ? fn(r1) : r1,
    r2.$ref ? fn(r2) : r2,
    state,
    convert,
    supportFn
  );
};

const diff = (obj1, obj2, state, convert, supportFn) => {
  const { type } = obj1;
  if (type === "object")
    return diffObject(obj1, obj2, state, convert, supportFn);
  if (obj2.$ref || obj1.$ref)
    return diffReference(obj1, obj2, state, convert, supportFn);
  if (type && supportFn[type]) return supportFn[type](obj1, obj2);

  return [obj1, true];
};

const singleFieldObject = (_obj) => {
  if (!_obj) return [[], []];
  if (_obj.type === "object") {
    return Object.entries(_obj.properties).reduce(
      ([objs, paths], [k, v]) => {
        const [os, ps] = singleFieldObject(v);
        return [
          [...objs, ...os.map((o) => ({ [k]: o }))],
          [...paths, ...ps.map((p) => `${k}${p ? "." : ""}${p}`)],
        ];
      },
      [[], []]
    );
  }
  return [[_obj], [""]];
};

const buildAlternative = (lst, originalObj, state, convert) => {
  const [opts, noOpts] = _.partition(lst, (o) => o.opt);
  const newObj = opts.reduce(
    (acc, obj) => {
      const { isRequired, ...rest } = obj.opt;
      if (isRequired) {
        acc.required = [...(acc.required || []), obj.key];
      }
      return merge(
        acc,
        {
          type: "object",
          properties: { [obj.key]: rest },
        },
        state,
        convert
      );
    },
    { ...deepcopy(originalObj) }
  );
  if (newObj.required)
    newObj.required = newObj.required.diff(noOpts.map((o) => o.key));
  return newObj;
};

const createOpenApiObject = (path, root, obj, state, convert) => {
  return merge(
    root,
    {
      type: "object",
      properties: [...path].reverse().reduce((acc, key) => {
        let container = { ...acc };
        if (!container.type) {
          container = { type: "object", properties: container };
        }
        return { [key]: container };
      }, obj),
    },
    state,
    convert
  );
};

const createPeekAlternative = (
  is,
  thennable,
  otherwise,
  objectPath,
  fullObject,
  state,
  convert
) => ({
  peek: createOpenApiObject([...objectPath], {}, is, state, convert),
  then: buildAlternative(thennable, fullObject, state, convert),
  otherwise: buildAlternative(otherwise, fullObject, state, convert),
});

const createPeeks = (options, originalObj, state, convert) =>
  Object.entries(options).reduce((acc, [k, v]) => {
    const objectPath = k.split(".");
    const fullObject = createOpenApiObject(
      objectPath,
      originalObj,
      v.reference,
      state,
      convert
    );
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
          ),
        ]
      : [];

    const peeksAlternatives = [
      ...Object.values(v.alternatives).map((alternative) =>
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
      ...alt,
    ];

    return acc.length === 0
      ? peeksAlternatives
      : peeksAlternatives.reduce(
          (objs, alt) => objs.map((o) => merge(o, alt, state, convert)),
          acc
        );
  }, []);

const makeAlternativesFromOptions = (optOf, newObj, state, convert) => {
  const nonEmptyOptions = optOf.filter((opt) => opt.options.length !== 0);
  if (nonEmptyOptions.length === 0) {
    return newObj;
  } else {
    const grouppedOptions = groupByOptions(
      nonEmptyOptions,
      newObj,
      state,
      convert
    );
    return {
      oneOf: createPeeks(grouppedOptions, newObj, state, convert)
        .map((p) => {
          return makeOptions(p.peek, p.then, p.otherwise, state, convert);
        })
        .reduce((acc, v) => [...acc, ...v.oneOf], []),
    };
  }
};

const getProperty = (refName, properties) => {
  const refList = refName.split(".");
  return refList.reduce(
    (obj, key) => {
      let r = obj[key];
      if (r.type === "object") return r.properties;
      return r;
    },
    { ...properties }
  );
};

const retrieveReference = (nameReference, objChildren, state, convert) => {
  if (!objChildren)
    throw new Error(
      `Missing object where the reference [${nameReference}] should be`
    );

  const property = getProperty(nameReference, objChildren.properties);
  const referenceObjJoi = retrievePrintedReference(property, state.components);
  return referenceObjJoi ? convert(referenceObjJoi, state) : property;
};

const joinOption = (option, opt, key) => {
  option.thennable = [...(option.thennable || []), { key: key, opt: opt.then }];
  option.otherwise = [
    ...(option.otherwise || []),
    { key: key, opt: opt.otherwise },
  ];
  return option;
};

const getStoredKeyFromOption = (option, objChildren, state, convert) => {
  if (option.is && option.is.type === "any") {
    option.is = retrieveReference(option["ref"], objChildren, state, convert);
  }
  return option;
};

const isGlobalRepresentation = (obj) => obj.type === "string" && !obj.enum;

const groupByOptions = (opts, objChildren, state, convert) =>
  opts.reduce((store, opt) => {
    return opt.options.reduce((store, option) => {
      const maybeConvertedOption = getStoredKeyFromOption(
        option,
        objChildren,
        state,
        convert
      );
      const reference = option["ref"];
      const referenceContainer = store[reference] || {
        reference: retrieveReference(reference, objChildren, state, convert),
        alternatives: {},
      };
      if (isGlobalRepresentation(maybeConvertedOption.is)) {
        return {
          ...store,
          [reference]: {
            ...referenceContainer,
            allCases: {
              is: maybeConvertedOption.is,
              options: joinOption({}, maybeConvertedOption, opt.key),
            },
          },
        };
      } else {
        const storeKey = maybeConvertedOption.is.enum.join(".");
        const enumContainer = referenceContainer.alternatives[storeKey] || {
          is: option.is,
          options: {},
        };

        return {
          ...store,
          [reference]: {
            ...referenceContainer,
            alternatives: {
              ...referenceContainer.referenceContainer,
              [storeKey]: {
                ...enumContainer,
                options: joinOption(enumContainer.options, option, opt.key),
              },
            },
          },
        };
      }
    }, store);
  }, {});

module.exports = { makeOptions, makeAlternativesFromOptions };
