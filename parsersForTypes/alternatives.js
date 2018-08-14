const getOneOfSchemas = (matches, convert) => ({ oneOf: [...matches.map(allowedType => convert(allowedType.schema))] });

const parser = (joiSchema, convert) => ({
  ...getOneOfSchemas(joiSchema._inner.matches, convert),
});

module.exports = parser;
