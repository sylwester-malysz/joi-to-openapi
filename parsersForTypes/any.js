const convertIfPresent = (cond, convert, state) => {
  let c;
  if (cond) {
    if (cond._flags.presence === "forbidden") return undefined;
    c = convert(cond, state);
    if (c) c.isRequired = cond._flags.presence === "required";
  }
  return c;
};

const getConvertedIs = (joiObj, state, convert) => {
  if (joiObj) {
    if (joiObj.type === "any" && joiObj._flags.presence !== "forbidden")
      return { type: "any" };

    return convert(joiObj, state);
  }

  return undefined;
};

const getOptionsFromRef = (matches, state, convert) => {
  const schema = {
    optOf: [
      ...matches.map((s) => {
        const is = getConvertedIs(s.is, state, convert);
        const ref = s.ref ? s.ref.key : undefined;
        return {
          is,
          otherwise: convertIfPresent(s.otherwise, convert, state),
          then: convertIfPresent(s.then, convert, state),
          ref,
        };
      }),
    ],
  };
  return schema;
};

const parser = (schema, state, convert) => {
  if (schema.$_terms.whens.length > 0) {
    return getOptionsFromRef(schema.$_terms.whens, state, convert);
  }

  if (schema._flags.presence === "forbidden") return undefined;
  // TODO add required if needed
  return {
    oneOf: [
      { type: "array" },
      { type: "boolean" },
      { type: "number" },
      { type: "object" },
      { type: "string" },
    ],
  };
};

module.exports = parser;
