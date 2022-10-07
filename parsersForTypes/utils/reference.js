const { isJoi } = require("./joi");

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
      const r = obj[key];
      if (r.type === "object") return r.properties;
      return r;
    },
    { ...properties }
  );
};

const isJoiReference = obj => isJoi(obj) && obj.type === "reference";
const isOpenApiReference = obj => obj.$ref !== undefined;

const retrieveReference = (joiReference, components) => {
  if (isJoiReference(joiReference)) {
    const [componentRef, itemRef] = (joiReference._flags._ref || "").split(":");
    return getRef(componentRef, itemRef, components);
  }

  return undefined;
};

const retrievePrintedReference = (joiReference, components) => {
  if (isOpenApiReference(joiReference)) {
    const reference = joiReference.$ref || "";
    const [componentRef, itemRef] = reference.split("/").splice(2);
    return getRef(componentRef, itemRef, components);
  }

  return undefined;
};

const retrieveReferenceFollow = (element, state, convert) => {
  let reference = element;
  if (isJoiReference(element)) {
    reference = convert(element, state);
  }

  if (!isOpenApiReference(reference)) return undefined;

  const [componentRef, itemRef] = (reference.$ref || "").split("/").splice(2);
  const referredElement = getRef(componentRef, itemRef, state.components);

  if (isJoiReference(referredElement) || isOpenApiReference(referredElement))
    return retrieveReferenceFollow(referredElement, state, convert);

  return referredElement;
};

const retrieveReferenceByName = (nameReference, objChildren, state, convert) => {
  if (!objChildren)
    throw new Error(`Missing object where the reference [${nameReference}] should be`);

  const property = getProperty(nameReference, objChildren.properties);
  const referenceObjJoi = retrieveReferenceFollow(property, state, convert);

  if (referenceObjJoi) {
    return convert(referenceObjJoi, state);
  }

  return property;
};

module.exports = {
  retrieveReference,
  retrieveReferenceFollow,
  retrievePrintedReference,
  retrieveReferenceByName
};
