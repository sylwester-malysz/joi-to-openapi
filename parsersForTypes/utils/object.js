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
    _obj.required = (_obj.required ?? []).filter(k => k !== key);

    delete _obj.properties[key];
    if (Object.keys(_obj.properties).length === 0) delete _obj.properties;

    if (_obj.required.length === 0) delete _obj.required;

    return _obj;
  }

  const nesting = removeKeyWithPath(keys, _obj.properties[key], state);

  return {
    type: "object",
    ...(typeof _obj.additionalProperties !== "undefined"
      ? { additionalProperties: _obj.additionalProperties }
      : {}),
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

const removeDuplicates = (obj, key) => {
  if (obj[key]) {
    const elms = removeDuplicatedObjects(obj[key]);
    return elms.length === 1 ? elms[0] : { [key]: elms };
  }

  return obj;
};

const isRequiredField = (path, obj) => {
  const [x, ...xs] = path;

  if (x && obj?.properties && obj?.properties[x]) {
    return (
      (xs.length === 0 && (obj.required ?? []).includes(x)) ||
      isRequiredField(xs, obj.properties[x])
    );
  }
  return false;
};

const isFieldPresent = (path, obj) => {
  const [x, ...xs] = path;

  if (x && obj?.properties && obj?.properties[x]) {
    return xs.length === 0 || isRequiredField(xs, obj.properties[x]);
  }
  return false;
};

const requiredFieldsFromList = (keys, obj) => {
  return keys.reduce((acc, key) => {
    if (isRequiredField(key.split("."), obj)) return [key, ...acc];
    return acc;
  }, []);
};

const processListOfObjects = (objs, key, path, state) =>
  removeDuplicates({ [key]: objs.map(_obj => removeKeyWithPath(path, _obj, state)) }, key);

const removeKeyWithPath = (path, obj, state) => {
  if (!obj) return undefined;

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
        ...(typeof _obj.additionalProperties !== "undefined"
          ? { additionalProperties: _obj.additionalProperties }
          : {}),
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

module.exports = {
  removeKeyWithPath,
  extractObjFromPath,
  singleFieldObject,
  removeDuplicates,
  requiredFieldsFromList,
  isFieldPresent
};
