const { makeOptions, makeAlternativesFromOptions } = require("./alternatives");
const { merge, mergeDiff } = require("./merge");
const { retrieveReference, retrievePrintedReference } = require("./reference");
const { isJoi } = require("./joi");
const { removeKeyWithPath, removeDuplicates } = require("./object");
const { extractNands, computedNotAllowedRelation } = require("./nand");

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
      // converted.isRequired = joiObj._flags.presence === "required";
      return converted;
    }

    return convert(joiObj, state);
  }

  return undefined;
};

const values = joiSchema => {
  if (joiSchema._valids && joiSchema._valids._values.size) {
    const validValues = Array.from(joiSchema._valids._values);
    const notEmptyValues = validValues.filter(value => value !== null && value !== "");
    return notEmptyValues;
  }
  return [];
};

const options = (schema, state, convert, fn) => {
  const vals = values(schema);
  const _schema = {
    optOf: [
      ...schema.$_terms.whens.map(s => {
        const is = convertIs(s.is, s.is._valids, state, convert);
        const ref = s.ref ? s.ref.key : undefined;
        return {
          is,
          otherwise: fn(s.otherwise, vals, convert, state),
          then: fn(s.then, vals, convert, state),
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
  merge,
  mergeDiff,
  removeKeyWithPath,
  extractNands,
  computedNotAllowedRelation,
  removeDuplicates
};
