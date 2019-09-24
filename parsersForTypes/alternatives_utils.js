const { retrievePrintedReference } = require("./utils");

Array.prototype.equals = function(lst) {
  const [head, ...tail] = this;
  const [head1, ...tail1] = lst;
  if (tail.length === 0 && tail1.length == 0) return head === head1;
  return head === head1 && tail.equals(tail1);
};

Array.prototype.union = function(lst) {
  const itemsVisited = this.reduce(
    (acc, item) => ((acc[item] = true), acc),
    {}
  );
  return lst.reduce((acc, item) => {
    if (!itemsVisited[item]) {
      return [...acc, item];
    }
    return acc;
  }, this);
};

Array.prototype.partition = function(fn) {
  return this.reduce(
    ([truthy, falsy], item) => {
      if (fn(item)) {
        return [[...truthy, item], falsy];
      }
      return [truthy, [...falsy, item]];
    },
    [[], []]
  );
};

Array.prototype.diff = function(lst) {
  const itemsVisited = lst.reduce((acc, item) => ((acc[item] = true), acc), {});
  return this.reduce((acc, item) => {
    if (!itemsVisited[item]) {
      return [...acc, item];
    }
    return acc;
  }, []);
};

const makeOptions = (peek, then, otherwise, state, convert) => {
  const [falsyOptions, falsePaths] = singleFieldObject(peek);
  return {
    oneOf: [
      mergeDiff(then, peek),
      ...removeOverlapping(
        falsyOptions.map(o => makeDiff(otherwise, o, state, convert)),
        falsePaths,
        state,
        convert
      )
    ]
  };
};

const mergeDiff = (obj1, obj2) => {
  if ("object" === typeof obj1 && !(obj1 instanceof Array)) {
    return Object.entries(obj1).reduce((acc, [k, v]) => {
      if (k === "required") {
        return {
          ...acc,
          [k]: [...new Set([...(v || []), ...(acc[k] || [])])]
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

const extractObjFromPath = (path, obj, store) => {
  const [key, ...keys] = path;
  if (!key) return obj;
  if (!obj || (!obj[key] && !obj.properties && !obj.properties[key])) return {};

  const nest = store[key] || {};

  if (obj.type === "object") {
    return {
      [key]: { ...nest, ...extractObjFromPath(keys, obj.properties[key], nest) }
    };
  }

  return { [key]: { ...nest, ...obj[key] } };
};

const removeOverlapping = (list, paths, state, convert) => {
  const [head, ...tail] = list || [];
  if (!head) return [];

  const objView = paths.reduce(
    (acc, p) => extractObjFromPath(p.split("."), head, acc),
    {}
  );

  const tailNoOverlap = removeOverlapping(
    tail
      .map(l => cleanFromOverlapping(l, objView, state, convert))
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
    }
  };
  return diff(obj1, obj2, state, convert, supportFn);
};

const makeDiff = (obj1, obj2, state, convert) => {
  const supportFn = {
    string: (obj1, obj2) => {
      const remainingItems = obj1.enum.diff(obj2.enum);
      if (remainingItems.length == 0) {
        return [{}, false];
      }
      return [{ ...obj1, enum: remainingItems }, false];
    }
  };
  const [dObj, _] = diff(obj1, obj2, state, convert, supportFn);
  return dObj;
};

const diff = (obj1, obj2, state, convert, supportFn) => {
  const tmp = { ...obj1 };
  const { type } = tmp;
  if (type === "object") {
    return Object.entries(obj2).reduce(
      ([acc, keep], [k, v]) => {
        if (acc.properties[k]) {
          const [child, noTotallyRemoved] = diff(
            acc.properties[k],
            v,
            state,
            convert,
            supportFn
          );
          return [
            {
              ...acc,
              properties: {
                ...acc.properties,
                [k]: child
              }
            },
            keep && noTotallyRemoved
          ];
        }

        return [acc, keep];
      },
      [tmp, true]
    );
  }

  if (obj2.$ref) {
    return diff(
      obj1,
      convert(retrievePrintedReference(obj2, state.components), state),
      state,
      convert,
      supportFn
    );
  }
  if (obj1.$ref) {
    return diff(
      convert(retrievePrintedReference(obj1, state.components), state),
      obj2,
      state,
      convert,
      supportFn
    );
  }
  if (type && supportFn[type]) return supportFn[type](obj1, obj2);

  return [obj1, true];
};

const singleFieldObject = _obj => {
  if (!_obj) return [[], []];
  const { type } = _obj;
  if (type === "object") {
    return Object.entries(_obj.properties).reduce(
      ([objs, paths], [k, v]) => {
        const [os, ps] = singleFieldObject(v);
        return [
          [...objs, ...os.map(o => ({ [k]: { type: "object", ...o } }))],
          [...paths, ...ps.map(p => `${k}${p ? "." : ""}${p}`)]
        ];
      },
      [[], []]
    );
  }
  return [[_obj], [""]];
};

/*
const deepEqual = (obj1, obj2) => {
  const type = obj1.type;
  if (type === "object" && obj2.type === "object")
    return Object.entries(obj1).reduce((isEqual, [k, v]) => {
      if (!isEqual || !obj2) return false;
      return isEqual && deepEqual(v, obj2[k]);
    }, Object.entries(obj2).length == 0);
  if (type === "string") {
    return type === obj2.type && obj1.enum.equals(obj2.enum);
  }
  if (type === "number") {
    return type === obj2.type && obj1.format === obj2.format;
  }
  return false;
};
*/
const addObject = (obj1, obj2) =>
  Object.entries(obj2).reduce((acc, [k, v]) => {
    const child = acc[k] || {};
    let computedChild = v;
    if (typeof v === "Object" && !(v instanceof Array))
      computedChild = addObject(child, v);
    if (v instanceof Array) return { ...acc, [k]: computedChild };
    return { ...acc, [k]: { ...child, ...computedChild } };
  }, obj1);

const buildAlternative = (lst, originalObj) => {
  const [opts, noOpts] = lst.partition(o => o.opt);
  const newObj = opts.reduce(
    (acc, obj) => {
      const { required, ...rest } = obj.opt;
      if (required) {
        acc.required = [...(acc.required || []), obj.key];
      }
      const newObj = {
        ...acc,
        properties: addObject(acc.properties, { [obj.key]: rest })
      };
      return newObj;
    },
    { ...originalObj }
  );
  if (newObj.required)
    newObj.required = newObj.required.diff(noOpts.map(o => o.key));
  return newObj;
};

const createPeeks = (options, originalObj) =>
  Object.entries(options).reduce((acc, [k, v]) => {
    const objectPath = k.split(".");

    const fullObject = addObject(originalObj, {
      properties: [...objectPath]
        .reverse()
        .reduce((acc, key) => ({ [key]: acc }), v.reference)
    });
    const peeksAlternatives = Object.values(v.alternatives)
      .map(alternative =>
        [...objectPath]
          .reverse()
          .reduce((acc, key) => ({ ...acc, peek: { [key]: acc.peek } }), {
            peek: alternative.is,
            then: buildAlternative(alternative.options.thennable, fullObject),
            otherwise: buildAlternative(
              alternative.options.otherwise,
              fullObject
            )
          })
      )
      .map(o => ({ ...o, peek: { type: "object", properties: o.peek } }));
    if (acc.length === 0) return peeksAlternatives;

    return peeksAlternatives.reduce(
      (objs, alt) => objs.map(o => addObject(o, alt)),
      acc
    );
  }, []);

const makeAlternativesFromOptions = (optOf, newObj, state, convert) => ({
  type: "object",
  oneOf: createPeeks(groupByOptions(optOf, newObj, state, convert), newObj)
    .map(p => makeOptions(p.peek, p.then, p.otherwise, state, convert))
    .reduce((acc, v) => [...acc, ...v.oneOf], [])
});

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
  const referenceObjJoi = retrievePrintedReference(
    getProperty(nameReference, objChildren.properties),
    state.components
  );
  return referenceObjJoi
    ? convert(referenceObjJoi, state)
    : objChildren.properties[nameReference];
};

const joinOption = (option, opt, key) => {
  option.thennable = [...(option.thennable || []), { key: key, opt: opt.then }];
  option.otherwise = [
    ...(option.otherwise || []),
    { key: key, opt: opt.otherwise }
  ];
  return option;
};

const groupByOptions = (opts, objChildren, state, convert) =>
  opts.reduce((store, opt) => {
    return opt.options.reduce((store, option) => {
      const storeKey = option.is.enum.join(".");
      const reference = option["ref"];
      const referenceContainer = store[reference] || {
        reference: retrieveReference(reference, objChildren, state, convert),
        alternatives: {}
      };
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
    }, store);
  }, {});

module.exports = { makeOptions, makeAlternativesFromOptions };
