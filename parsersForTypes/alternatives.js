const getOneOfSchemas = (matches, state, convert) => ({
  oneOf: [...matches.map(allowedType => convert(allowedType.schema, state))]
});

const getOptionsFromRef = (matches, state, convert) => {
  const schema = {
    optOf: [
      ...matches.map(s => {
        const then = convert(s.then, state);
        then.required = s.then._flags.presence === "required";

        return {
          is: convert(s.is, state),
          then,
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
