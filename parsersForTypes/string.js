/* eslint-disable no-underscore-dangle */
const find = require('lodash.find');

const getFormat = (tests) => {
  if (find(tests, { name: 'guid' })) {
    return { format: 'uuid' };
  }
  if (find(tests, { name: 'email' })) {
    return { format: 'email' };
  }
  if (find(tests, { name: 'uri' })) {
    return { format: 'uri' };
  }
  if (find(tests, { name: 'isoDate' })) {
    return { format: 'date-time' };
  }
  return null;
};

const getLength = (tests) => {
  const length = find(tests, { name: 'length' });
  return length ? { length: length.arg } : null;
};
const getMinLength = (tests) => {
  const min = find(tests, { name: 'min' });
  return min ? { minLength: min.arg } : null;
};

const getMaxLength = (tests) => {
  const max = find(tests, { name: 'max' });
  return max ? { maxLength: max.arg } : null;
};

const parser = joiSchema => {
  const format = getFormat(joiSchema._tests);
  const maxLength = getMaxLength(joiSchema._tests);
  const minLength = getMinLength(joiSchema._tests);
  const len = getLength(joiSchema._tests);
  return Object.assign({ type : 'string' }, format, maxLength, minLength, len)
};

module.exports = parser;
