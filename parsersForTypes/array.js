const joi = require("joi");
const find = require("lodash.find");
const { limit } = require("./utils");

const getChild = (items, state, convert) => {
  if (items.length === 0) {
    return undefined;
  }
  if (items.length === 1) {
    return { items: convert(items[0], state) };
  }
  return { items: convert(joi.alternatives().try(...items), state) };
};

const getLength = (tests) => {
  const length = find(tests, { name: "length" });
  if (!length) return null;
  return { minItems: length.args.limit, maxItems: length.args.limit };
};

const getMinItems = (tests) => {
  const min = find(tests, { name: "min" });
  return min ? { minItems: min.args.limit } : null;
};

const getMaxItems = (tests) => {
  const max = find(tests, { name: "max" });
  return max ? { maxItems: max.args.limit } : null;
};

const parser = (joiSchema, state, convert) => {
  debugger;
  const child = getChild(joiSchema.$_terms.items, state, convert);
  const maxItems = getMaxItems(joiSchema._rules);
  const minItems = getMinItems(joiSchema._rules);
  const len = getLength(joiSchema._rules);
  return Object.assign({ type: "array" }, child, maxItems, minItems, len);
};

module.exports = parser;
