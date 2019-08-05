const getOneOfSchemas = (matches, state, convert) => ({
  oneOf: [...matches.map(allowedType => convert(allowedType.schema, state))]
});

const convertIfPresent = (cond, convert, state) => {
  let c;
  if (cond) {
    c = convert(cond, state);
    if (c) c.required = cond._flags.presence === "required";
  }
  return c;
};

const getOptionsFromRef = (matches, state, convert) => {
  const schema = {
    optOf: [
      ...matches.map(s => {
        const is = s.is ? convert(s.is, state) : undefined;
        return {
          is,
          otherwise: convertIfPresent(s.otherwise, convert, state),
          then: convertIfPresent(s.then, convert, state),
          ref: s.ref.key
        };
      })
    ]
  };
  return schema;
};
const parser = (joiSchema, state, convert) => {
  if (joiSchema._refs && joiSchema._refs.length > 0) {
    return getOptionsFromRef(joiSchema._inner.matches, state, convert);
  }
  return getOneOfSchemas(joiSchema._inner.matches, state, convert);
};

module.exports = parser;
