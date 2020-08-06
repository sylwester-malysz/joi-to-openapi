const find = require("lodash.find");

const retrieveReference = (joiReference, components) => {
  if (joiReference.isJoi && joiReference.type == "reference") {
    const reference = joiReference._flags._internal_ref || "";
    const [componentRef, itemRef] = reference.split(":");
    return getRef(componentRef, itemRef, components);
  }

  return undefined;
};

const getRef = (componentRef, itemRef, components) => {
  if (
    !componentRef ||
    !itemRef ||
    !components ||
    !components[componentRef] ||
    !components[componentRef][itemRef]
  )
    throw Error(
      `wrong reference ${componentRef}:${itemRef}. Please make sure there exists a schema in the component`
    );
  return components[componentRef][itemRef];
};

const retrievePrintedReference = (joiReference, components) => {
  if (joiReference["$ref"]) {
    const reference = joiReference["$ref"] || "";
    const [componentRef, itemRef] = reference.split("/").splice(2);
    return getRef(componentRef, itemRef, components);
  }

  return undefined;
};

const getBodyObjKey = (condition) => {
  if ("oneOf" in condition) return { oneOf: condition.oneOf };
  if (condition.type === "object") {
    const { isRequired, ...rest } = condition;
    return rest;
  }

  return {
    type: condition.type,
  };
};

const convertIs = (joiObj, valids, state, convert) => {
  if (joiObj) {
    if (joiObj.type === "any" && joiObj._flags.presence !== "forbidden") {
      const validValues = valids ? valids._values : new Set();
      if (validValues && validValues.size === 1) {
        const values = Array.from(validValues);
        if (typeof values[0] === "string")
          return { type: "string", enum: values };
      }
      return { type: "any" };
    }

    return convert(joiObj, state);
  }

  return undefined;
};

const values = (joiSchema) => {
  if (joiSchema._valids && joiSchema._valids._values.size) {
    const validValues = Array.from(joiSchema._valids._values);
    const notEmptyValues = validValues.filter(
      (value) => value !== null && value !== ""
    );
    return notEmptyValues;
  }
  return [];
};

const options = (schema, state, convert, fn) => {
  const vals = values(schema);
  const _schema = {
    optOf: [
      ...schema.$_terms.whens.map((s) => {
        const is = convertIs(s.is, s.is._valids, state, convert);
        const ref = s.ref ? s.ref.key : undefined;
        return {
          is,
          otherwise: fn(s.otherwise, vals, convert, state),
          then: fn(s.then, vals, convert, state),
          ref,
        };
      }),
    ],
  };
  return _schema;
};

module.exports = {
  retrieveReference,
  retrievePrintedReference,
  getBodyObjKey,
  values,
  options,
};
