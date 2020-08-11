const find = require("lodash.find");

const getOneOfSchemas = (matches, state, convert) => ({
  oneOf: [
    ...matches.map((allowedType) => {
      return convert(allowedType, state);
    }),
  ],
});

const parser = (joiSchema, state, convert) => {
  const alt = find(joiSchema._rules, { args: { alternatives: {} } });
  if (alt) {
    const schema = getOneOfSchemas(
      Object.values(alt.args.alternatives),
      state,
      convert
    );
    return schema;
  }

  return { type: "any" };
};

module.exports = parser;
