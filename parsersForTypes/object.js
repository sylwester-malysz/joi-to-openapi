const _ = require("lodash");

const deepcopy = require("deepcopy");
const {
  getBodyObjKey,
  maybeOptionsFromWhens,
  makeAlternativesFromOptions,
  merge,
  removeKeyWithPath,
  removeDuplicates,
  extractNands,
  computedNotAllowedRelation
} = require("./utils");

const wrapConditionInObject = (condition, objKey) => {
  if (!objKey) return getBodyObjKey(condition);
  const properties = condition
    ? {
        properties: { [objKey]: getBodyObjKey(condition) }
      }
    : undefined;
  const required = condition && condition.isRequired ? { required: [objKey] } : undefined;
  return {
    type: "object",
    additionalProperties: false,
    ...properties,
    ...required
  };
};

const wrapOption = key => obj => {
  const options = obj.options.map(option => {
    return {
      is: option.is,
      then: wrapConditionInObject(option.then, obj.key),
      otherwise: wrapConditionInObject(option.otherwise, obj.key),
      ref: option.ref
    };
  });
  return { key, options };
};

const getChild = (child, state, convert) => {
  if (!child) {
    return null;
  }
  let properties = {};

  child.forEach(children => {
    const convertedChild = convert(children.schema, state);
    if (convertedChild) {
      if (convertedChild.optOf) {
        properties.optOf = [
          ...(properties.optOf || []),
          { options: convertedChild.optOf, key: children.key }
        ];
      } else if (convertedChild.inheritedOptOf) {
        const { inheritedOptOf, ...rest } = convertedChild;
        properties[children.key] = rest;
        properties = {
          ...(properties || {}),
          optOf: [...(properties.optOf || []), ...inheritedOptOf.map(wrapOption(children.key))]
        };
      } else properties[children.key] = convertedChild;
    }
  });

  return { properties };
};

const getRequiredFields = child => {
  if (!child) {
    return null;
  }
  const required = [];

  child.forEach(children => {
    if (children.schema._flags.presence === "required") {
      required.push(children.key);
    }
  });

  return required.length ? { required } : null;
};

const findObjectInScope = object => option => {
  const scopeObj = option.ref.split(".").reduce((obj, key) => {
    if (obj && obj.properties) {
      return obj.properties[key];
    }
    return obj;
  }, deepcopy(object));

  return scopeObj;
};

const aggregateScopedPartitions =
  scope =>
  ([left, right], obj) => {
    const [inScope, notInScope] = _.partition(obj.options, findObjectInScope(scope));
    return [
      [...left, { ...obj, options: inScope }],
      [...right, { ...obj, options: notInScope }]
    ];
  };

const handleOptionalFormObject = (obj, state, convert) => {
  if (obj.properties && obj.properties.optOf) {
    const { optOf, ...rest } = obj.properties;
    const newObj = { ...obj, properties: rest };
    const [currentScopeOpt, notInScopeOpt] = optOf.reduce(aggregateScopedPartitions(newObj), [
      [],
      []
    ]);
    const optionObject = makeAlternativesFromOptions(currentScopeOpt, newObj, state, convert);
    if (state.isRoot) {
      const notFoundAlternative = notInScopeOpt.reduce(
        (acc, opt) =>
          opt.options.reduce((accumulator, o) => {
            const { isRequired, ...remaining } = (o.is ? o.otherwise : o.then) || {};
            return merge(
              accumulator,
              {
                type: "object",
                additionalProperties: false,
                properties: { [opt.key]: remaining }
              },
              state,
              convert
            );
          }, acc),
        optionObject
      );
      return notFoundAlternative;
    }
    if (notInScopeOpt.length > 0 && notInScopeOpt.some(opt => opt.options.length > 0)) {
      optionObject.inheritedOptOf = notInScopeOpt;
    }
    return optionObject;
  }
  return obj;
};

const buildNandsAlternativesAux = (nands, parsedObject, state) => {
  const notAllawedRealations = computedNotAllowedRelation(nands);

  return [...notAllawedRealations].reduce((acc, notAllowedSet) => {
    return [
      ...acc,
      [...notAllowedSet].reduce(
        (obj, path) => removeKeyWithPath(path.split("."), obj, state),
        parsedObject
      )
    ];
  }, []);
};

const buildNandsAlternatives = (nands, parsedObject, state) => {
  if (parsedObject.oneOf) {
    return {
      oneOf: parsedObject.oneOf.reduce(
        (acc, obj) => [...acc, ...buildNandsAlternativesAux(nands, obj, state)],
        []
      )
    };
  }
  if (parsedObject.anyOf) {
    return {
      anyOf: parsedObject.anyOf.reduce(
        (acc, obj) => [...acc, ...buildNandsAlternativesAux(nands, obj, state)],
        []
      )
    };
  }
  if (parsedObject.allOf) {
    return {
      allOf: parsedObject.allOf.reduce(
        (acc, obj) => [...acc, ...buildNandsAlternativesAux(nands, obj, state)],
        []
      )
    };
  }
  return { oneOf: buildNandsAlternativesAux(nands, parsedObject, state) };
};

const doNotAllowAdditionalProperties = (parsedObject, additionalProperties) => {
  const reducer = (acc, obj) => [...acc, { ...obj, additionalProperties }];

  if (parsedObject.oneOf) {
    return {
      oneOf: parsedObject.oneOf.reduce(reducer, [])
    };
  }
  if (parsedObject.anyOf) {
    return {
      anyOf: parsedObject.anyOf.reduce(reducer, [])
    };
  }
  if (parsedObject.allOf) {
    return {
      allOf: parsedObject.allOf.reduce(reducer, [])
    };
  }
  return reducer([], parsedObject)[0];
};

const parserAux = (joiSchema, state, convert) => {
  const child = getChild(joiSchema.$_terms.keys, state, convert);

  const requiredFields = getRequiredFields(joiSchema.$_terms.keys);
  const obj = maybeOptionsFromWhens(
    { type: "object", ...child, ...requiredFields },
    joiSchema,
    state,
    convert
  );

  return handleOptionalFormObject(obj, state, convert);
};

const parser = (joiSchema, state, convert) => {
  const nands = extractNands(joiSchema);
  let parsedObject = parserAux(joiSchema, state, convert);

  if (nands.length > 0) {
    parsedObject = removeDuplicates(buildNandsAlternatives(nands, parsedObject, state));
  }

  const isAdditionalPropertiesEnabled =
    joiSchema._flags.unknown ?? joiSchema.$_terms.patterns?.length > 0;

  return doNotAllowAdditionalProperties(parsedObject, isAdditionalPropertiesEnabled);
};

module.exports = parser;
