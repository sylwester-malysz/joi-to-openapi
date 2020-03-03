const { makeOptions } = require("./alternatives_utils");
const { merge } = require("./merge_utils");
const { getBodyObjKey } = require("./utils");

const mergeObjects = (condition, originalObj, objKey, state, convert) => {
  const properties = condition
    ? {
        properties: { [objKey]: getBodyObjKey(condition) }
      }
    : undefined;
  const required =
    condition && condition.isRequired ? { required: [objKey] } : undefined;
  return merge(
    {
      type: "object",
      ...properties,
      ...required
    },
    originalObj,
    state,
    convert
  );
};

const mergeObjectInOption = (obj2Merge, state, convert) => obj => {
  return {
    options: obj.options.map(option => {
      return {
        is: option.is,
        then: mergeObjects(option.then, obj2Merge, obj.key, state, convert),
        otherwise: mergeObjects(
          option.otherwise,
          obj2Merge,
          obj.key,
          state,
          convert
        ),
        ref: option.ref
      };
    })
  };
};

const getOneOfSchemas = (matches, state, convert) =>
  matches.reduce(
    (acc, match) => {
      const { inheritedOptOf, ...rest } = convert(match.schema, state);
      if (inheritedOptOf)
        acc.inheritedOptOf = [
          ...(acc.inheritedOptOf || []),
          ...inheritedOptOf.map(mergeObjectInOption(rest, state, convert))
        ];
      else acc.oneOf = [...acc.oneOf, rest];
      return acc;
    },
    { oneOf: [] }
  );

const convertIfPresent = (cond, convert, state) => {
  let c;
  if (cond) {
    if (cond._flags.presence === "forbidden") return undefined;
    c = convert(cond, state);
    if (c) c.isRequired = cond._flags.presence === "required";
  }
  return c;
};

const getConvertedIs = (joiObj, state, convert) => {
  if (joiObj) {
    if (joiObj._type === "any" && joiObj._flags.presence !== "forbidden")
      return { type: "any" };

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
