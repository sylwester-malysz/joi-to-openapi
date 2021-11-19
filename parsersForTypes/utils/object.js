/* eslint-disable no-use-before-define */
const deepcopy = require("deepcopy");
const _ = require("lodash");
const { retrievePrintedReference } = require("./reference");
const { merge } = require("./merge");

const removeKeyFromObjectWithPath = (path, obj, state) => {
  if (obj.type !== "object")
    throw new Error("Cannot remove key from an object with type different from `object`");
  const [key, ...keys] = path;
  if (!key) return obj;

  let _obj = deepcopy(obj);

  if (_obj?.$ref) _obj = retrievePrintedReference(_obj, state.components);
  if (keys.length === 0 && _obj.properties[key]) {
    delete _obj.properties[key];
    return _obj;
  }

  const nesting = removeKeyWithPath(keys, _obj.properties[key], state);

  return {
    type: "object",
    properties: {
      ..._obj.properties,
      ...(nesting && { [key]: nesting })
    }
  };
};

const removeDuplicatedObjects = objs => {
  const [head, ...tail] = objs;
  if (!head) return [];

  return [head, ...removeDuplicatedObjects(tail.filter(obj => !_.isEqual(head, obj)))];
};

const removeDuplicates = obj => {
  if (obj.oneOf) {
    const oneOf = removeDuplicatedObjects(obj.oneOf);
    return oneOf.length === 1 ? oneOf[0] : { oneOf };
  }
  if (obj.anyOf) {
    const anyOf = removeDuplicatedObjects(obj.anyOf);
    return anyOf.length === 1 ? anyOf[0] : { anyOf };
  }
  if (obj.allOf) {
    const allOf = removeDuplicatedObjects(obj.allOf);
    return allOf.length === 1 ? allOf[0] : { allOf };
  }

  return obj;
};

const processListOfObjects = (objs, key, path, state) =>
  removeDuplicates({ [key]: objs.map(_obj => removeKeyWithPath(path, _obj, state)) });

const processOptions = (path, obj, state) => {
  if (obj.oneOf) {
    return processListOfObjects(obj.oneOf, "oneOf", path, state);
  }
  if (obj.anyOf) {
    return processListOfObjects(obj.anyOf, "anyOf", path, state);
  }
  if (obj.allOf) {
    return processListOfObjects(obj.allOf, "allOf", path, state);
  }
  return removeKeyFromObjectWithPath(path, obj, state);
};

const removeKeyWithPath = (path, obj, state) => {
  if (!obj) return undefined;

  return processOptions(path, obj, state);
};

const extractObjFromPath = (path, obj, store, state, convert) => {
  let _obj = deepcopy(obj);
  const [key, ...keys] = path;
  if (!key) return obj;
  if (_obj && obj.$ref) _obj = retrievePrintedReference(_obj, state.components);
  if (!_obj || (!_obj[key] && !_obj.properties && !_obj.properties[key])) return {};

  const nest = store[key] || {};
  if (_obj.type === "object") {
    return merge(
      store,
      {
        type: "object",
        properties: {
          [key]: {
            ...extractObjFromPath(keys, _obj.properties[key], nest, state, convert)
          }
        }
      },
      state,
      convert
    );
  }

  return { [key]: { ...nest, ..._obj[key] } };
};

const singleFieldObject = _obj => {
  if (!_obj) return [[], []];
  if (_obj.type === "object") {
    return Object.entries(_obj.properties).reduce(
      ([objs, paths], [k, v]) => {
        const [os, ps] = singleFieldObject(v);
        return [
          [...objs, ...os.map(o => ({ type: "object", properties: { [k]: o } }))],
          [...paths, ...ps.map(p => `${k}${p ? "." : ""}${p}`)]
        ];
      },
      [[], []]
    );
  }
  return [[_obj], [""]];
};

module.exports = { removeKeyWithPath, extractObjFromPath, singleFieldObject, removeDuplicates };
