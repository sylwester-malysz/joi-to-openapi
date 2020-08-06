/* eslint-disable no-underscore-dangle */
const find = require("lodash.find");

const getFormat = (tests) => {
  if (find(tests, { name: "guid" })) {
    return { format: "uuid" };
  }
  if (find(tests, { name: "email" })) {
    return { format: "email" };
  }
  if (find(tests, { name: "uri" })) {
    return { format: "uri" };
  }
  if (find(tests, { name: "isoDate" })) {
    return { format: "date-time" };
  }
  return null;
};

const getLength = (tests) => {
  const length = find(tests, { name: "length" });
  return length ? { length: length.args.limit } : null;
};
const getMinLength = (tests) => {
  const min = find(tests, { name: "min" });
  return min ? { minLength: min.args.limit } : null;
};

const getMaxLength = (tests) => {
  const max = find(tests, { name: "max" });
  return max ? { maxLength: max.args.limit } : null;
};

const getPattern = (tests) => {
  const p = find(tests, { name: "pattern" });
  return p ? { pattern: p.args.regex } : null;
};

const parser = (joiSchema) => {
  const rules = joiSchema._rules;
  const format = getFormat(rules);
  const maxLength = getMaxLength(rules);
  const minLength = getMinLength(rules);
  const len = getLength(rules);
  const pattern = getPattern(rules);
  return Object.assign(
    { type: "string" },
    format,
    maxLength,
    minLength,
    pattern,
    len
  );
};

module.exports = parser;
