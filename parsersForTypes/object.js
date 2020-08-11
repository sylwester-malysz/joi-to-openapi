const {
  makeAlternativesFromOptions,
  //buildAlt,
  makeOptions,
} = require("./alternatives_utils");
const { merge } = require("./merge_utils");
const { getBodyObjKey } = require("./utils");
const _ = require("lodash");

const deepcopy = require("deepcopy");

const wrapConditionInObject = (condition, objKey) => {
  if (!objKey) return getBodyObjKey(condition);
  const properties = condition
    ? {
        properties: { [objKey]: getBodyObjKey(condition) },
      }
    : undefined;
  const required =
    condition && condition.isRequired ? { required: [objKey] } : undefined;
  return {
    type: "object",
    ...properties,
    ...required,
  };
};

const wrapOption = (key) => (obj) => {
  const options = obj.options.map((option) => {
    return {
      is: option.is,
      then: wrapConditionInObject(option.then, obj.key),
      otherwise: wrapConditionInObject(option.otherwise, obj.key),
      ref: option.ref,
    };
  });
  return { key, options };
};

const getChild = (child, state, convert) => {
  if (!child) {
    return null;
  }
  let properties = {};
  for (const children of child) {
    let convertedChild = convert(children.schema, state);
    if (convertedChild) {
      if (convertedChild.optOf) {
        properties.optOf = [
          ...(properties.optOf || []),
          { options: convertedChild.optOf, key: children.key },
        ];
      } else if (convertedChild.inheritedOptOf) {
        const { inheritedOptOf, ...rest } = convertedChild;
        properties[children.key] = rest;
        properties = {
          ...(properties || {}),
          optOf: [
            ...(properties.optOf || []),
            ...inheritedOptOf.map(wrapOption(children.key)),
          ],
        };
      } else properties[children.key] = convertedChild;
    }
  }
  return { properties };
};

const getRequiredFields = (child) => {
  if (!child) {
    return null;
  }
  const required = [];
  for (const children of child) {
    if (children.schema._flags.presence === "required") {
      required.push(children.key);
    }
  }
  return required.length ? { required } : null;
};

const findObjectInScope = (object) => (option) => {
  const scopeObj = option.ref.split(".").reduce((obj, key) => {
    if (obj && obj.properties) {
      return obj.properties[key];
    }
    return obj;
  }, deepcopy(object));

  return scopeObj;
};

const aggregateScopedPartitions = (scope) => ([left, right], obj) => {
  const [inScope, notInScope] = _.partition(
    obj.options,
    findObjectInScope(scope)
  );
  return [
    [...left, { ...obj, options: inScope }],
    [...right, { ...obj, options: notInScope }],
  ];
};

function needsOptOfPropagation(optList) {
  return optList.length > 0 && optList.some((opt) => opt.options.length > 0);
}

const synchRequired = (required, obj) => {
  if (required) {
    const allKeys = Object.keys(obj.properties);
    const noRequiredKeys = _.difference(allKeys, obj.required || []);
    const newRequired = _.difference(required, noRequiredKeys);
    if (newRequired.length > 0) return newRequired;
  }

  return undefined;
};

const parser = (joiSchema, state, convert) => {
  const child = getChild(joiSchema.$_terms.keys, state, convert);
  const requiredFields = getRequiredFields(joiSchema.$_terms.keys);
  let obj = Object.assign({ type: "object" }, child, requiredFields);

  if (joiSchema.$_terms.whens) {
    const conditionals = joiSchema.$_terms.whens[0];
    const thennable = convert(conditionals.then, state);
    const otherwise = convert(conditionals.otherwise, state);
    let req = obj.required;
    obj = makeOptions(
      convert(conditionals.is, state),
      merge(
        { ...obj, required: synchRequired(req, thennable) },
        thennable,
        state,
        convert
      ),
      merge(
        { ...obj, required: synchRequired(req, otherwise) },
        otherwise,
        state,
        convert
      ),
      state,
      convert
    );
  }

  if (obj.properties && obj.properties.optOf) {
    const { optOf, ...rest } = obj.properties;
    const newObj = { ...obj, properties: rest };
    const [currentScopeOpt, notInScopeOpt] = optOf.reduce(
      aggregateScopedPartitions(newObj),
      [[], []]
    );
    const optionObject = makeAlternativesFromOptions(
      currentScopeOpt,
      newObj,
      state,
      convert
    );

    if (state.isRoot) {
      let notFoundAlternative = notInScopeOpt.reduce(
        (acc, opt) =>
          opt.options.reduce((acc, o) => {
            const { isRequired, ...rest } = (o.is ? o.otherwise : o.then) || {};
            return merge(
              acc,
              {
                type: "object",
                properties: { [opt.key]: rest },
              },
              state,
              convert
            );
          }, acc),
        optionObject
      );

      return notFoundAlternative;
    } else if (needsOptOfPropagation(notInScopeOpt)) {
      optionObject.inheritedOptOf = notInScopeOpt;
    }

    return optionObject;
  }

  return obj;
};

module.exports = parser;
