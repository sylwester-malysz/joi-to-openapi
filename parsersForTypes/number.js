/* eslint-disable no-underscore-dangle */
const find = require('lodash.find');


const getType = (tests) => {
  if (find(tests, { name: 'integer' })) {
    return { type: 'integer' };
  }
  if (find(tests, { name: 'precision' })) {
    return {
      type: 'number',
      format: 'double',
    };
  }
  return {
    type: 'number',
    format: 'float',
  };
};

const getMinValue = (tests) => {
  const min = find(tests, { name: 'min' });
  if (min) {
    return { minimum: min.arg };
  }
  if (find(tests, { name: 'positive' })) {
    return { minimum: 1 };
  }
  return null;
};

const getMaxValue = (tests) => {
  const max = find(tests, { name: 'max' });
  if (max) {
    return { maximum: max.arg };
  }
  if (find(tests, { name: 'negative' })) {
    return { maximum: -1 };
  }
  return null;
};

const getValidValues = (joiSchema) => {
  if (!joiSchema._flags.allowOnly) {
    return null;
  }
  const validValues = joiSchema._valids.values().filter(value => typeof value === 'number');
  if (validValues.length) {
    return { enum: validValues };
  }
  return null;
};

const parser = joiSchema => {

  const type = getType(joiSchema._tests);
  const minValue = getMinValue(joiSchema._tests);
  const maxValue = getMaxValue(joiSchema._tests);
  const validValues = getValidValues(joiSchema);

  return Object.assign({}, type, minValue, maxValue, validValues);

};

module.exports = parser;
