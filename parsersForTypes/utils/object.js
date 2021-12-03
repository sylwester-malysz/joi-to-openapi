/* eslint-disable no-use-before-define */
const deepcopy = require("deepcopy");
const _ = require("lodash");
const { retrievePrintedReference } = require("./reference");
const { merge } = require("./merge");
const { diff, subset } = require("./setUtils");

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

const optionalAndRequiredKeys = obj => {
  const currentRequired = new Set(obj.required ?? []);
  const allKeys = new Set(Object.keys(obj.properties ?? []));

  return [currentRequired, diff(allKeys, currentRequired)];
};

const valueOrNegInfinity = value => value ?? Number.NEGATIVE_INFINITY;
const valueOrPosInfinity = value => value ?? Number.POSITIVE_INFINITY;

const isStringSubset = (str_1, str_2) => {
  // format, length , minLength , maxLength , pattern, enum

  return (
    str_2.format === str_1.format &&
    valueOrNegInfinity(str_2.length) >= valueOrNegInfinity(str_1.length) &&
    valueOrPosInfinity(str_2.minLength) <= valueOrPosInfinity(str_1.minLength) &&
    valueOrNegInfinity(str_2.maxLength) >= valueOrNegInfinity(str_1.maxLength) &&
    str_2.pattern === str_1.pattern &&
    subset(new Set(str_2.enum), new Set(str_1.enum))
  );
};

const isIntSubset = (int_1, int_2) => {
  // format, minimum , maximum , enum

  return (
    int_2.format === int_1.format &&
    int_2.minimum <= int_1.minimum &&
    int_2.maximum >= int_1.maximum &&
    subset(new Set(int_2.enum), new Set(int_1.enum))
  );
};

const isArraySubset = (arr_1, arr_2) => {
  // minItems, maxItems , items

  return (
    valueOrPosInfinity(arr_2) <= valueOrPosInfinity(arr_1) &&
    arr_2.maxItems >= arr_1.maxItems &&
    arr_1.items.every(item_1 => arr_2.items.some(item_2 => isSubsetOf(item_1, item_2)))
  );
};

const isObjectSubset = (obj_1, obj_2) => {
  const reqRelation = (a, b) => a === b;
  const optRelation = (a, b) => a <= b;

  const check = (list_1, list_2, f, g) =>
    f(list_1.length, list_2.length) && list_1.every(opt_1 => list_2.some(opt_2 => g(opt_1, opt_2)));

  const [requiredFields_1, optionalFields_1] = optionalAndRequiredKeys(obj_1);
  const [requiredFields_2, optionalFields_2] = optionalAndRequiredKeys(obj_2);

  const reqFieldList_1 = [...requiredFields_1];
  const reqFieldList_2 = [...requiredFields_2];
  const optFieldList_1 = [...optionalFields_1];
  const optFieldList_2 = [...optionalFields_2];

  const reqFieldsObj_1 = reqFieldList_1.map(key => obj_1.properties[key]);
  const reqFieldsObj_2 = reqFieldList_2.map(key => obj_2.properties[key]);
  const optFieldsObj_1 = optFieldList_1.map(key => obj_1.properties[key]);
  const optFieldsObj_2 = optFieldList_2.map(key => obj_2.properties[key]);

  return (
    check(reqFieldList_1, reqFieldList_2, reqRelation, (a, b) => a === b) &&
    check(optFieldList_1, optFieldList_2, optRelation, (a, b) => a === b) &&
    check(reqFieldsObj_1, reqFieldsObj_2, reqRelation, isSubsetOf) &&
    check(optFieldsObj_1, optFieldsObj_2, optRelation, isSubsetOf)
  );
};

const isSubsetOf = (obj_1, obj_2) => {
  if (obj_1.type !== obj_2.type) return false;

  switch (obj_1.type) {
    case "string":
      return isStringSubset(obj_1, obj_2);
    case "integer":
    case "number":
      return isIntSubset(obj_1, obj_2);
    case "array":
      return isArraySubset(obj_1, obj_2);
    case "object":
      return isObjectSubset(obj_1, obj_2);
    case "boolean":
      return true;
    default:
      // handle here oneOf/anyOf/allOf and $ref?
      return false;
  }
};

module.exports = {
  removeKeyWithPath,
  extractObjFromPath,
  singleFieldObject,
  removeDuplicates,
  requiredFieldsFromList,
  optionalAndRequiredKeys,
  isFieldPresent,
  isSubsetOf
};
