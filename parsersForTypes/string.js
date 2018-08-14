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


const parser = joiSchema => ({
  type: 'string',
  ...getFormat(joiSchema._tests),
  ...getMaxLength(joiSchema._tests),
  ...getMinLength(joiSchema._tests),
  ...getLength(joiSchema._tests),
});

module.exports = parser;
