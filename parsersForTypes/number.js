/* eslint-disable no-underscore-dangle */
const find = require("lodash.find");

const getType = (tests) => {
  if (find(tests, { name: "integer" })) {
    return { type: "integer" };
  }
  if (find(tests, { name: "precision" })) {
    return {
      type: "number",
      format: "double",
    };
  }
  return {
    type: "number",
    format: "float",
  };
};

const getMinValue = (tests) => {
  const min = find(tests, { name: "min" });
  if (min) {
    return { minimum: min.args.limit };
  }
  const greater = find(tests, { name: "greater" });
  if (greater) {
    return { minimum: greater.args.limit + 1 };
  }
  if (find(tests, { args: { sign: "positive" } })) {
    return { minimum: 1 };
  }
  return null;
};

const getMaxValue = (tests) => {
  const max = find(tests, { name: "max" });
  if (max) {
    return { maximum: max.args.limit };
  }
  const less = find(tests, { name: "less" });
  if (less) {
    return { maximum: less.args.limit - 1 };
  }
  if (find(tests, { args: { sign: "negative" } })) {
    return { maximum: -1 };
  }
  return null;
};

const getValidValues = (joiSchema) => {
  if (!joiSchema._flags.allowOnly) {
    return null;
  }
  const validValues = joiSchema._valids
    .values()
    .filter((value) => typeof value === "number");
  if (validValues.length) {
    return { enum: validValues };
  }
  return null;
};

const parser = (joiSchema) => {
  const type = getType(joiSchema._rules);
  const minValue = getMinValue(joiSchema._rules);
  const maxValue = getMaxValue(joiSchema._rules);
  const validValues = getValidValues(joiSchema);

  return Object.assign({}, type, minValue, maxValue, validValues);
};

module.exports = parser;
