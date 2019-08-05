const parser = schema => {
  if (schema._flags.presence === "forbidden") return undefined;
  return {
    oneOf: [
      { type: "array" },
      { type: "boolean" },
      { type: "number" },
      { type: "object" },
      { type: "string" },
      { type: "null" }
    ]
  };
};

module.exports = parser;
