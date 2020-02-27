const { retrievePrintedReference } = require("./utils");
const { makeAlternativesFromOptions, addObject } = require("./alternatives_utils");

const getBodyObjKey = (condition) => {
  if ("oneOf" in condition) return { oneOf: condition.oneOf }

  return {
    type: condition.type
  }
}

const wrapConditionInObject = (condition, objKey) => {
  const properties = condition ? {
    [objKey]: getBodyObjKey(condition),
    ...(condition.required && { required: [objKey] })
  } : undefined

  const obj = {
    type: "object",
  }

  if (properties) {
    return {
      ...obj, properties
    }
  }

  return obj
}

const wrapOption = (key) => obj => {

  const options = obj.options.map(option => {
    return {
      is: option.is,
      then: wrapConditionInObject(option.then, obj.key),
      otherwise: wrapConditionInObject(option.otherwise, obj.key),
      ref: option.ref
    }
  });
  return { key, options }
}

const getChild = (child, state, convert) => {
  if (!child) {
    return null;
  }
  let properties = {};
  for (const children of child) {
    let convertedChild = convert(children.schema, state);
    if (convertedChild.optOf) {

      properties.optOf = [
        ...(properties.optOf || []),
        { options: convertedChild.optOf, key: children.key }
      ];
    }
    else if (convertedChild.properties && convertedChild.properties.inheritedOptOf) {
      const { inheritedOptOf, ...rest } = convertedChild.properties;


      properties = {
        ...properties,
        ...rest,
        optOf: [
          ...(properties.optOf || []),
          ...inheritedOptOf.map(wrapOption(children.key))
        ]
      };
    } else properties[children.key] = convertedChild;
  }
  return { properties };
};

const getRequiredFields = child => {
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

const getScopeAtPartition = (obj, currentScope) => {

  const findInScope = (object, path) => path.split(".").reduce((obj, key) => {
    if (obj && obj.properties) {
      const nest = obj.properties;
      if (nest) return nest[key]
    }
    return obj
  }, object)


  const notInScope = obj.options.filter(option => findInScope(currentScope, option.ref) === undefined);
  const inScope = obj.options.filter(option => findInScope(currentScope, option.ref) !== undefined);
  return [[{ ...obj, options: inScope }], [{ ...obj, options: notInScope }]]
}

const aggregateScopedPartitions = ({ scope, acc: [left, right] }, obj) => {
  [leftF, rightF] = getScopeAtPartition(obj, scope);

  return { scope, acc: [[...leftF, ...left], [...rightF, ...right]] }
}

function needsOptOfPropagation(optList) {
  return optList.length > 0 && optList.some(opt => opt.options.length > 0)
}

const parser = (joiSchema, state, convert) => {



  const child = getChild(joiSchema._inner.children, state, convert);
  const requiredFields = getRequiredFields(joiSchema._inner.children);

  const obj = Object.assign({ type: "object" }, child, requiredFields);


  if (obj.properties && obj.properties.optOf) {
    const { optOf, ...rest } = obj.properties;
    const newObj = { ...obj, properties: rest };
    const { acc: [currentScopeOpt, notInScopeOpt] } = optOf.reduce(aggregateScopedPartitions, { scope: newObj, acc: [[], []] });

    const optionObject = makeAlternativesFromOptions(currentScopeOpt, newObj, state, convert);

    if (joiSchema === state.parentObject.originalSchema) {
      let c = notInScopeOpt.reduce((acc, opt) => opt.options.reduce((acc, o) => {
        return addObject({ type: "object", properties: { [opt.key]: o.is ? o.otherwise : o.then } }, acc)
      }, acc), optionObject)
      return c
    }
    else if (needsOptOfPropagation(notInScopeOpt)) {
      optionObject.properties = { ...optionObject.properties, inheritedOptOf: notInScopeOpt }
    }

    return optionObject
  }
  return obj;
};

module.exports = parser;
