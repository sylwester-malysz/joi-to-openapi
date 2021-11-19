/* eslint-disable no-use-before-define */
const deepcopy = require("deepcopy");
const _ = require("lodash");
const { retrievePrintedReference } = require("./reference");

const mergeProperties = (property1, property2, state, convert) => {
  const _property1 = deepcopy(property1);
  const _property2 = deepcopy(property2);

  return Object.entries(_property2 || {}).reduce((acc, [k, v]) => {
    if (!acc[k]) return { ...acc, [k]: v };
    return { ...acc, [k]: merge(acc[k], v, state, convert) };
  }, _property1 || {});
};

const mergeString = (_str1, _str2) => {
  const str1 = _str1;
  const str2 = _str2;
  if (!str2) return str1;
  if (str1.enum || str2.enum)
    str1.enum = [...new Set([...(str1.enum || []), ...(str2.enum || [])])];

  if (str1.nullable || str2.nullable) str1.nullable = str1.nullable || str2.nullable;

  if (str1.format !== str2.format) throw new Error("cannot merge different formats");

  return str1;
};

const mergeInteger = (_int1, _int2) => {
  const int1 = _int1;
  const int2 = _int2;
  if (!int2) return int1;

  if (typeof int1.minimum !== "undefined" || typeof int2.minimum !== "undefined") {
    int1.minimum = Math.min(int1.minimum || Infinity, int2.minimum || Infinity);
  }

  if (typeof int1.maximum !== "undefined" || typeof int2.maximum !== "undefined") {
    int1.maximum = Math.min(int1.maximum || -Infinity, int2.maximum || -Infinity);
  }

  if (int1.nullable || int2.nullable) {
    int1.nullable = int1.nullable || int2.nullable;
  }

  if (int1.format !== int2.format) {
    throw new Error("cannot merge different formats");
  }

  return int1;
};

const mergeBoolean = (_bool1, _bool2) => {
  const bool1 = _bool1;
  const bool2 = _bool2;
  if (!bool2) return bool1;

  if (bool1.nullable || bool2.nullable) {
    bool1.nullable = bool1.nullable || bool2.nullable;
  }

  return bool1;
};

const mergeObject = (obj1, obj2, state, convert) => {
  if (!obj2) return obj1;
  if (!obj1) return obj2;

  const mergedObj = {
    type: "object",
    properties: mergeProperties(obj1.properties, obj2.properties, state, convert)
  };

  if (obj1.required || obj2.required) {
    mergedObj.required = [...new Set([...(obj1.required || []), ...(obj2.required || [])])];
  }
  return mergedObj;
};

const mergeAlternative = (obj1, obj2, mode = "any") => {
  if (!obj2) return obj1;
  if (!obj1) return obj2;

  const key = `${mode}Of`;

  return { [key]: [...(obj1[key] || []), ...(obj2[key] || [])] };
};

const mergeOneOf = (obj1, obj2) => mergeAlternative(obj1, obj2, "one");

const mergeAnyOf = (obj1, obj2) => mergeAlternative(obj1, obj2);

const mergeAllOf = (obj1, obj2) => mergeAlternative(obj1, obj2, "all");

const mergeRef = (obj1, obj2) => {
  if (!obj2) return obj1;
  if (!obj1) return obj2;
  if (obj1.$ref !== obj2.$ref) throw new Error("different $ref - cannot merge");

  return obj1;
};

const wrapAlternative = (obj, mode = "any") => {
  const key = `${mode}Of`;
  return {
    [key]: obj[key] ? obj[key] : [obj]
  };
};

const merge = (obj1, obj2, state, convert = a => a) => {
  if (_.isEmpty(obj1)) return obj2;
  if (_.isEmpty(obj2)) return obj1;

  let object1 = deepcopy(obj1);
  let object2 = deepcopy(obj2);

  if (object1.oneOf || object2.oneOf) {
    object1 = wrapAlternative(object1, "one");
    object2 = wrapAlternative(object2, "one");
  }
  if (object1.anyOf || object2.anyOf) {
    object1 = wrapAlternative(object1);
    object2 = wrapAlternative(object2);
  }
  if (object1.allOf || object2.allOf) {
    object1 = wrapAlternative(object1, "all");
    object2 = wrapAlternative(object2, "all");
  }
  if (object1.$ref) {
    object1 = convert(retrievePrintedReference(object1, state.components), state);
  }
  if (object2.$ref) {
    object2 = convert(retrievePrintedReference(object2, state.components), state);
  }

  if (object1.type !== object2.type)
    throw new Error(
      `cannot merge different types;\n${JSON.stringify(object1)};\n${JSON.stringify(object2)}`
    );
  switch (object1.type) {
    case "object":
      return mergeObject(object1, object2, state, convert);
    case "string":
      return mergeString(object1, object2);
    case "number":
      return mergeInteger(object1, object2);
    case "integer":
      return mergeInteger(object1, object2);
    case "boolean":
      return mergeBoolean(object1, object2);
    default:
      if (object1.oneOf && object2.oneOf) {
        return mergeOneOf(object1, object2);
      }
      if (object1.anyOf && object2.anyOf) {
        return mergeAnyOf(object1, object2);
      }
      if (object1.allOf && object2.allOf) {
        return mergeAllOf(object1, object2);
      }
      if (object1.$ref && object2.$ref) {
        return mergeRef(object1, object2);
      }
      throw new Error("type not supported");
  }
};

const mergeDiff = (obj1, obj2) => {
  if (typeof obj1 === "object" && !(obj1 instanceof Array)) {
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
  }
  return obj1;
};

module.exports = { merge, mergeDiff };
