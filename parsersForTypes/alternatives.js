const { getBodyObjKey, merge, makeOptions } = require("./utils");

const mergeObjects = (condition, originalObj, objKey, state, convert) => {
  const properties = condition
    ? {
        properties: { [objKey]: getBodyObjKey(condition) }
      }
    : undefined;
  const required = condition && condition.isRequired ? { required: [objKey] } : undefined;
  return merge(
    {
      type: "object",
      additionalProperties: false,
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
        otherwise: mergeObjects(option.otherwise, obj2Merge, obj.key, state, convert),
        ref: option.ref
      };
    })
  };
};

const getAlternativeSchemas = (matches, mode, state, convert) => {
  const alternativeKey = `${mode}Of`;
  return matches.reduce(
    (acc, match) => {
      const { inheritedOptOf, ...rest } = convert(match.schema, state);
      if (inheritedOptOf)
        acc.inheritedOptOf = [
          ...(acc.inheritedOptOf || []),
          ...inheritedOptOf.map(mergeObjectInOption(rest, state, convert))
        ];
      else acc[alternativeKey] = [...acc[alternativeKey], rest];
      return acc;
    },
    { [alternativeKey]: [] }
  );
};

const parser = (joiSchema, state, convert) => {
  if (
    joiSchema.$_terms.matches.length === 1 &&
    !joiSchema.$_terms.matches[0].schema &&
    joiSchema.$_terms.matches[0].peek
  ) {
    const obj = joiSchema.$_terms.matches[0];

    return makeOptions(
      convert(obj.peek, state),
      convert(obj.then, state),
      convert(obj.otherwise, state),
      state,
      convert
    );
  }
  return getAlternativeSchemas(
    joiSchema.$_terms.matches,
    joiSchema.$_getFlag("match") || "any",
    state,
    convert
  );
};

module.exports = parser;
