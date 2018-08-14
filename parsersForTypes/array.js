const joi = require('joi');
const find = require('lodash.find');

const getChild = (items, convert) => {
  if (items.length === 1) {
    return { items: convert(items[0]) };
  }
  return { items: convert(joi.alternatives().try(...items)) };
};

const getLength = (tests) => {
  const length = find(tests, { name: 'length' });
  return length ? { minItems: length.arg, maxItems: length.arg } : null;
};
const getMinItems = (tests) => {
  const min = find(tests, { name: 'min' });
  return min ? { minItems: min.arg } : null;
};

const getMaxItems = (tests) => {
  const max = find(tests, { name: 'max' });
  return max ? { maxItems: max.arg } : null;
};


const parser = (joiSchema, convert) => ({
  type: 'array',
  ...getChild(joiSchema._inner.items, convert),
  ...getMaxItems(joiSchema._tests),
  ...getMinItems(joiSchema._tests),
  ...getLength(joiSchema._tests),
});

module.exports = parser;

