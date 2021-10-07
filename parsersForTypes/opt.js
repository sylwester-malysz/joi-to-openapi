const find = require("lodash.find");


const createOneOfNoDuplicates = (objs, state, convert) => {

  const { store } = objs.reduce(({store, cache},value) => {
    const openapiObj =  convert(value, state)
    if(!cache[openapiObj]) {
      store.push(openapiObj)
      cache[JSON.stringify(openapiObj)] = true
    }
    return {store, cache}
  }, { store: [], cache : {}})


  return store
}

const getOneOfSchemas = (matches, state, convert) => ({
  oneOf: [
    ...createOneOfNoDuplicates(matches, state, convert)
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
