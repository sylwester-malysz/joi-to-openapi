const find = require("lodash.find");
const { options, addAllows } = require("./utils");

/* eslint-disable no-underscore-dangle */

const getFormat = tests => {
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

const getLength = tests => {
  const length = find(tests, { name: "length" });
  return length ? { length: length.args.limit } : null;
};
const getMinLength = tests => {
  const min = find(tests, { name: "min" });
  return min ? { minLength: min.args.limit } : null;
};

const getMaxLength = tests => {
  const max = find(tests, { name: "max" });
  return max ? { maxLength: max.args.limit } : null;
};

const getPattern = tests => {
  const p = find(tests, { name: "pattern" });
  return p ? { pattern: p.args.regex.source } : null;
};

const mkString = (cond, schema) => {
  let c;
  if (cond) {
    if (cond.type !== "any" && cond.type !== "string")
      throw Error("cannot build alternative different of string or any");
    if (cond._flags.presence === "forbidden") return undefined;
    c = { type: "string" };
    if (c) c.isRequired = cond._flags.presence === "required";
    c = addAllows(schema, c);
  }
  return c;
};

const parser = (joiSchema, state, convert) => {
  if (joiSchema.$_terms.whens) {
    return options(joiSchema, state, convert, mkString);
  }
  const rules = joiSchema._rules;
  const format = getFormat(rules);
  const maxLength = getMaxLength(rules);
  const minLength = getMinLength(rules);
  const len = getLength(rules);
  const pattern = getPattern(rules);

  return {
    type: "string",
    ...format,
    ...maxLength,
    ...minLength,
    ...pattern,
    ...len
  };
};

module.exports = parser;
