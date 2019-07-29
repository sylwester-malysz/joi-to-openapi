const retrieveReference = (joiReference, components) => {
  if (joiReference.isJoi && joiReference._type == "ref") {
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
    !components[componentRef] ||
    !components[componentRef][itemRef]
  )
    throw Error(
      `wrong reference ${reference}. Please make sure there exists a schema in the component`
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

module.exports = { retrieveReference, retrievePrintedReference };
