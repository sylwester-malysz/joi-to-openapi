const getOneOfSchemas = (matches, state, convert) => ({
  oneOf: [...matches.map(allowedType => convert(allowedType.schema, state))]
});

const getOptionsFromRef = (matches, state, convert) => {
  const schema = {
    optOf: [
      ...matches.map(s => {
        let then;
        if (s.then) {
          then = convert(s.then, state);
          then.required = s.then._flags.presence === "required";
        }

        const is = s.is ? convert(s.is, state) : undefined;
        const otherwise = s.otherwise ? convert(s.otherwise, state) : undefined;

        return {
          is,
          otherwise,
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
