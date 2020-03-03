const retrieveReference = (joiReference, components) => {
  if (joiReference.isJoi && joiReference._type == "reference") {
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

const getBodyObjKey = condition => {
  if ("oneOf" in condition) return { oneOf: condition.oneOf };
  if (condition.type === "object") {
    const { isRequired, ...rest } = condition;
    return rest;
  }

  return {
    type: condition.type
  };
};

module.exports = { retrieveReference, retrievePrintedReference, getBodyObjKey };
