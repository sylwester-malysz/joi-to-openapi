const parser = joiSchema => {
  return {
    $ref: `#/components/${joiSchema._flags._internal_ref.replace(":", "/")}`
  };
};

module.exports = parser;
