const getOneOfSchemas = (matches, convert) => ({ oneOf: [...matches.map(allowedType => convert(allowedType.schema))] });

const parser = (joiSchema, convert) => {
  const schema = getOneOfSchemas(joiSchema._inner.matches, convert)
  return schema
};

module.exports = parser;
