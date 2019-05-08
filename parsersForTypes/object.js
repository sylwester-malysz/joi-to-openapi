const getChild = (child, convert) => {
  if (!child) {
    return null;
  }
  const properties = {};
  for (const children of child) {
    properties[children.key] = convert(children.schema);
  }
  return { properties };
};

const getRequiredFields = (child) => {
  if (!child) {
    return null;
  }
  const required = [];
  for (const children of child) {
    if (children.schema._flags.presence === 'required') {
      required.push(children.key);
    }
  }
  return required.length ? { required } : null;
};


const parser = (joiSchema, convert) => {
  const child = getChild(joiSchema._inner.children, convert);
  const requiredFields = getRequiredFields(joiSchema._inner.children, convert);
  return Object.assign({ type : 'object' }, child, requiredFields);
};

module.exports = parser;
