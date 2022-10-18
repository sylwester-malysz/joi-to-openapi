const _ = require("lodash");
const {
  makeOptions,
  makeAlternativesFromOptions,
  maybeOptionsFromWhens
} = require("./alternatives");
const { merge, mergeDiff } = require("./merge");
const { retrieveReference, retrievePrintedReference } = require("./reference");
const { isJoi } = require("./joi");
const {
  removeKeyWithPath,
  removeDuplicates,
  requiredFieldsFromList,
  isFieldPresent,
  removeSubsets
} = require("./object");
const { extract: extractNands, buildAlternatives: buildNandAlternatives } = require("./nand");
const { extract: extractXors, buildAlternatives: buildXorAlternatives } = require("./xor");

const getBodyObjKey = condition => {
  if ("oneOf" in condition) return { oneOf: condition.oneOf };
  if ("anyOf" in condition) return { anyOf: condition.anyOf };
  if ("allOf" in condition) return { allOf: condition.allOf };

  if (condition.type === "object") {
    const { isRequired, ...rest } = condition;
    return rest;
  }

  return {
    type: condition.type
  };
};

const convertIs = (joiObj, valids, state, convert) => {
  if (joiObj) {
    if (joiObj.type === "any" && joiObj._flags.presence !== "forbidden") {
      const validValues = valids ? valids._values : new Set();
      let converted = { type: "any" };
      if (validValues && validValues.size === 1) {
        const values = Array.from(validValues);
        if (typeof values[0] === "string") converted = { type: "string", enum: values };
      }
      return converted;
    }

    return convert(joiObj, state);
  }

  return undefined;
};

const values = (joiSchema, object_type) => {
  if (joiSchema._valids && joiSchema._valids._values.size) {
    const validValues = Array.from(joiSchema._valids._values);
    return _.partition(
      validValues,
      // eslint-disable-next-line valid-typeof
      value => value !== null && joiSchema._flags.only && object_type === typeof value
    );
  }
  return [[], []];
};

const mapSupportedType = joiSchema => {
  const { type } = joiSchema;

  switch (type) {
    case "number":
    case "string":
    case "boolean":
      return type;
    default:
      return "not_supported";
  }
};

const filterEmpyValue = vals => _.partition(vals, v => v !== "");

const mergeEmptyValue = (openApiObj, empty) => {
  const [emptyValue] = empty;
  const _openApiObj = openApiObj;
  if (typeof emptyValue === "undefined") return _openApiObj;

  switch (_openApiObj.type) {
    case "string": {
      const isEnum = (_openApiObj.enum ?? []).length > 0;
      if (_openApiObj.format) {
        return { anyOf: [_openApiObj, { type: "string", enum: [emptyValue] }] };
      }
      if (isEnum && typeof _openApiObj.minLength === "undefined") {
        const newEnum = _openApiObj.enum.filter(val => val === emptyValue);
        _openApiObj.enum = [...newEnum, emptyValue];
        return _openApiObj;
      }
      const minLength = _openApiObj.minLength ?? 0;
      if (minLength <= 1 && !isEnum) {
        delete _openApiObj.minLength;
        return _openApiObj;
      }
      return { anyOf: [_openApiObj, { type: "string", enum: [emptyValue] }] };
    }
    default:
      return _openApiObj;
  }
};

const addAllows = (joiSchema, openApiObj) => {
  const _openApiObj = openApiObj;

  if (joiSchema._valids) {
    joiSchema._valids._values.delete(null);

    const [sameTypeValues, noSameTypeValues] = values(joiSchema, mapSupportedType(joiSchema));
    if (sameTypeValues.length) _openApiObj.enum = sameTypeValues;

    const [alternativesValues, empty] = filterEmpyValue(noSameTypeValues);
    const _openApiObjWithEmpty = mergeEmptyValue(_openApiObj, empty);

    if (alternativesValues.length > 0) {
      const anyOf = [];
      alternativesValues.forEach(item => {
        const itemType = typeof item;
        switch (itemType) {
          case "string":
            anyOf.push({ type: "string", enum: [item] });
            break;
          case "boolean":
            anyOf.push({ type: "boolean", enum: [item] });
            break;
          case "number":
            anyOf.push({ type: "number", enum: [item] });
            break;
          default:
            break;
        }
      });

      if (anyOf.length === 0) {
        return _openApiObjWithEmpty;
      }
      return merge({ anyOf }, _openApiObjWithEmpty);
    }
    return _openApiObjWithEmpty;
  }
  return _openApiObj;
};

const options = (schema, state, convert, fn) => {
  const _schema = {
    optOf: [
      ...schema.$_terms.whens.map(s => {
        const is = convertIs(s.is, s.is._valids, state, convert);
        const ref = s.ref ? s.ref.key : undefined;
        return {
          is,
          otherwise: fn(s.otherwise, schema, convert, state),
          then: fn(s.then, schema, convert, state),
          ref
        };
      })
    ]
  };
  return _schema;
};

module.exports = {
  retrieveReference,
  retrievePrintedReference,
  getBodyObjKey,
  values,
  options,
  isJoi,
  makeOptions,
  makeAlternativesFromOptions,
  maybeOptionsFromWhens,
  merge,
  mergeDiff,
  removeKeyWithPath,
  extractNands,
  extractXors,
  removeDuplicates,
  requiredFieldsFromList,
  isFieldPresent,
  removeSubsets,
  buildNandAlternatives,
  buildXorAlternatives,
  addAllows
};
