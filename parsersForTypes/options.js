const getOneOfSchemas = (matches, state, convert) => ({
  oneOf: [
    ...matches.map(allowedType => {
      return convert(allowedType, state);
    })
  ]
});

const parser = (joiSchema, state, convert) => {
  const schema = getOneOfSchemas(
    Object.values(joiSchema._flags.alternatives),
    state,
    convert
  );
  return schema;
};

module.exports = parser;
