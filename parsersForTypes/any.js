const { options } = require("./utils");

const convertIfPresent = (cond, schema, convert, state) => {
  let c;
  if (cond) {
    if (cond._flags.presence === "forbidden") return undefined;
    c = convert(cond, state);
    if (c) c.isRequired = cond._flags.presence === "required";
  }
  return c;
};

const parser = (schema, state, convert) => {
  if (schema.$_terms.whens) {
    return options(schema, state, convert, convertIfPresent);
  }

  if (schema._flags.presence === "forbidden") return undefined;
  // TODO add required if needed
  return {
    oneOf: [
      { type: "array" },
      { type: "boolean" },
      { type: "number" },
      { type: "object", additionalProperties: true },
      { type: "string" }
    ]
  };
};

module.exports = parser;
