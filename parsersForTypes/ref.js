const parser = joiSchema => {
  return {
    $ref: joiSchema._internal_ref
  };
};

module.exports = parser;
