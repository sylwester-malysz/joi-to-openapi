const find = require("lodash.find");

const createOneOfNoDuplicates = (objs, state, convert) => {
  const { store } = objs.reduce(
    ({ store: _store, cache: _cache }, value) => {
      const cache = _cache;
      const openapiObj = convert(value, state);
      const key = JSON.stringify(openapiObj);
      if (!cache[key]) {
        _store.push(openapiObj);
        cache[key] = true;
      }
      return { store: _store, cache };
    },
    { store: [], cache: {} }
  );

  return store;
};

const getOneOfSchemas = (matches, state, convert) => ({
  oneOf: [...createOneOfNoDuplicates(matches, state, convert)]
});

const parser = (joiSchema, state, convert) => {
  const alt = find(joiSchema._rules, { args: { alternatives: {} } });
  if (alt) {
    const schema = getOneOfSchemas(Object.values(alt.args.alternatives), state, convert);
    return schema;
  }

  return { type: "any" };
};

module.exports = parser;
