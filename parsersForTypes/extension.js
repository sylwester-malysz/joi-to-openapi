const parser = (joiSchema, convert) => {
  let inheritedBase = {};
  if (
    joiSchema.__proto__.__proto__ &&
    joiSchema.__proto__.__proto__.constructor
  ) {
    const obj = new joiSchema.__proto__.__proto__.constructor();
    obj._test = joiSchema._test;
    obj._tests = joiSchema._tests;
    obj._flags = joiSchema._flags;
    obj._inner.items = joiSchema._inner.items;
    obj._inner.children = joiSchema._inner.children;
    inheritedBase = convert(obj);
  }
  return inheritedBase;
};

module.exports = parser;
