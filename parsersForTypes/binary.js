const find = require("lodash.find");

const getFormat = flags => {
  if (flags.encoding === "base64") {
    return { format: "byte" };
  }
  return { format: "binary" };
};

const getLength = tests => {
  const length = find(tests, { name: "length" });
  return length ? { minLength: length.arg, maxLength: length.arg } : null;
};
const getMinLength = tests => {
  const min = find(tests, { name: "min" });
  return min ? { minLength: min.arg } : null;
};

const getMaxLength = tests => {
  const max = find(tests, { name: "max" });
  return max ? { maxLength: max.arg } : null;
};

const parser = (joiSchema, state, convert) => {
  const format = getFormat(joiSchema._flags);
  const maxLength = getMaxLength(joiSchema._tests);
  const minLength = getMinLength(joiSchema._tests);
  const len = getLength(joiSchema._tests);
  return Object.assign({ type: "string" }, format, maxLength, minLength, len);
};

module.exports = parser;
