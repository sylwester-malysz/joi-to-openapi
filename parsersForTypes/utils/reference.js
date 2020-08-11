const { isJoi } = require("./joi");
const deepcopy = require("deepcopy");

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

const getProperty = (refName, properties) => {
  const refList = refName.split(".");
  return refList.reduce(
    (obj, key) => {
      let r = obj[key];
      if (r.type === "object") return r.properties;
      return r;
    },
    { ...properties }
  );
};

const retrieveReferenceByName = (
  nameReference,
  objChildren,
  state,
  convert
) => {
  if (!objChildren)
    throw new Error(
      `Missing object where the reference [${nameReference}] should be`
    );

  const property = getProperty(nameReference, objChildren.properties);
  const referenceObjJoi = retrievePrintedReference(property, state.components);
  return referenceObjJoi ? convert(referenceObjJoi, state) : property;
};

const retrieveReference = (joiReference, components) => {
  if (isJoi(joiReference) && joiReference.type == "reference") {
    const reference = joiReference._flags._ref || "";
    const [componentRef, itemRef] = reference.split(":");
    return deepcopy(getRef(componentRef, itemRef, components));
  }

  return undefined;
};

const retrievePrintedReference = (joiReference, components) => {
  if (joiReference["$ref"]) {
    const reference = joiReference["$ref"] || "";
    const [componentRef, itemRef] = reference.split("/").splice(2);
    return getRef(componentRef, itemRef, components);
  }

  return undefined;
};

module.exports = {
  retrieveReference,
  retrievePrintedReference,
  retrieveReferenceByName,
};
