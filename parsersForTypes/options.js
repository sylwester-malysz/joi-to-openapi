const getOneOfSchemas = (matches, convert) => ({ oneOf: [...matches.map(allowedType => convert(allowedType))] });

const parser = (joiSchema, convert) => {
  const schema = getOneOfSchemas(Object.values(joiSchema._flags.alternatives), convert)
  return schema
};

module.exports = parser;
