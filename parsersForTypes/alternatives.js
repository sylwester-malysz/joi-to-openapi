const { makeOptions } = require("./alternatives_utils");

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

const getConvertedIs = (joiObj, state, convert) => {
  if (joiObj) {
    if (joiObj._type === "any") return { type: "any" };

    return convert(joiObj, state);
  }

  return undefined;
};

const getOptionsFromRef = (matches, state, convert) => {
  const schema = {
    optOf: [
      ...matches.map(s => {
        const is = getConvertedIs(s.is, state, convert);
        const ref = s.ref ? s.ref.key : undefined;
        return {
          is,
          otherwise: convertIfPresent(s.otherwise, convert, state),
          then: convertIfPresent(s.then, convert, state),
          ref
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
  if (
    joiSchema._inner.matches.length === 1 &&
    !joiSchema._inner.matches[0].schema &&
    joiSchema._inner.matches[0].peek
  ) {
    const obj = joiSchema._inner.matches[0];

    return makeOptions(
      convert(obj.peek, state),
      convert(obj.then, state),
      convert(obj.otherwise, state),
      state,
      convert
    );
  }
  return getOneOfSchemas(joiSchema._inner.matches, state, convert);
};

module.exports = parser;
