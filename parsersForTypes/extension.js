const inheritedTypes = obj =>
  Object.keys(obj._definition.messages).reduce((acc, key) => acc.add(key.split(".")[0]), new Set());

const inferType = obj => {
  const possibleTypes = inheritedTypes(obj);
  const definition = obj._definition;
  if (definition) {
    const { rules } = definition;
    if (rules.try && possibleTypes.has("alternatives")) return "alternatives";
    if (rules.uppercase && possibleTypes.has("string")) return "string";
    if (rules.keys && possibleTypes.has("object")) return "object";
    if (rules.sign && possibleTypes.has("number")) return "number";
    if (rules.encoding && possibleTypes.has("binary")) return "binary";
    if (rules.items && possibleTypes.has("array")) return "array";
    if (rules.truthy && possibleTypes.has("boolean")) return "boolean";
    if (rules.iso && possibleTypes.has("date")) return "date";
    if (rules.alternative && possibleTypes.has("opt")) return "opt";
    return "any";
  }

  return undefined;
};

const parser = (joiSchema, state, convert) => {
  const processingSchema = joiSchema;
  processingSchema.type = inferType(joiSchema);
  return convert(processingSchema, state);
};

module.exports = parser;
