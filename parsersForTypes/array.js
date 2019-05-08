const joi = require('@hapi/joi');
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


const parser = (joiSchema, convert) => {
  const child = getChild(joiSchema._inner.items, convert);
  const maxItems = getMaxItems(joiSchema._tests);
  const minItems = getMinItems(joiSchema._tests);
  const len = getLength(joiSchema._tests);
  return Object.assign({ type : 'array' }, child, maxItems, minItems, len)
};

module.exports = parser;
