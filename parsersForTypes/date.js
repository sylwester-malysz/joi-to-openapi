/* eslint-disable no-underscore-dangle */

const getType = (flags) => {
  if (["javascript", "unix"].includes(flags.format)) {
    return { type: "integer" };
  }
  return {
    type: "string",
    format: "date-time",
  };
};

const parser = (joiSchema) => getType(joiSchema._flags);

module.exports = parser;
