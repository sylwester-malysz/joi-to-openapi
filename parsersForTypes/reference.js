const parser = (joiSchema) => {
  return {
    $ref: `#/components/${joiSchema._flags._ref.replace(":", "/")}`,
  };
};

module.exports = parser;
