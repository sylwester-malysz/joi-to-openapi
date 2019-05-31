/* eslint-disable no-underscore-dangle */
const alternativesParser = require("./parsersForTypes/alternatives");
const numberParser = require("./parsersForTypes/number");
const stringParser = require("./parsersForTypes/string");
const booleanParser = require("./parsersForTypes/boolean");
const objectParser = require("./parsersForTypes/object");
const arrayParser = require("./parsersForTypes/array");
const binaryParser = require("./parsersForTypes/binary");
const dateParser = require("./parsersForTypes/date");
const routeParser = require("./parsersForTypes/route");
const refParser = require("./parsersForTypes/ref");
const extensionParser = require("./parsersForTypes/extension");
const jsonfile = require("jsonfile");
const resolvePath = require("path").resolve;
const OpenAPISchemaValidator = require("openapi-schema-validator").default;

const validator = new OpenAPISchemaValidator({
  version: 3
});

const universalDecorator = joiSchema => {
  const universalParams = {};

  if (joiSchema._valids && joiSchema._valids.has(null)) {
    universalParams.nullable = true;
  }

  if (joiSchema._valids && joiSchema._valids._set.size) {
    const validValues = Array.from(joiSchema._valids._set);
    const notEmptyValues = validValues.filter(
      value => value !== null && value !== ""
    );
    if (notEmptyValues.length) {
      universalParams.enum = notEmptyValues;
    }
  }

  if (joiSchema._description) {
    universalParams.description = joiSchema._description;
  }

  if (joiSchema._flags.label) {
    universalParams.title = joiSchema._flags.label;
  }

  if (joiSchema._flags.default) {
    universalParams.default = joiSchema._flags.default;
  }

  if (joiSchema._examples && joiSchema._examples.length > 0) {
    if (joiSchema._examples.length === 1) {
      [universalParams.example] = joiSchema._examples;
    } else {
      universalParams.examples = joiSchema._examples;
    }
  }
  return universalParams;
};

const convert = joiSchema => {
  if (!joiSchema) throw new Error("No schema was passed.");

  if (!joiSchema.isJoi)
    throw new TypeError("Passed schema does not appear to be a joi schema.");

  const type = joiSchema._type;
  let swaggerSchema;
  switch (type) {
    case "number":
      swaggerSchema = numberParser(joiSchema);
      break;
    case "string":
      swaggerSchema = stringParser(joiSchema);
      break;
    case "boolean":
      swaggerSchema = booleanParser(joiSchema);
      break;
    case "binary":
      swaggerSchema = binaryParser(joiSchema);
      break;
    case "alternatives":
      swaggerSchema = alternativesParser(joiSchema, convert);
      break;
    case "object":
      swaggerSchema = objectParser(joiSchema, convert);
      break;
    case "array":
      swaggerSchema = arrayParser(joiSchema, convert);
      break;
    case "date":
      swaggerSchema = dateParser(joiSchema);
      break;
    case "any":
      swaggerSchema = {
        oneOf: [
          { type: "array" },
          { type: "boolean" },
          { type: "number" },
          { type: "object" },
          { type: "string" },
          { type: "null" }
        ]
      };
      break;
    case "route":
      swaggerSchema = swaggerSchema = routeParser(joiSchema, convert);
      break;
    case "ref":
      swaggerSchema = swaggerSchema = refParser(joiSchema);
      break;
    default:
      swaggerSchema = swaggerSchema = extensionParser(joiSchema, convert);
  }

  return Object.assign(swaggerSchema, universalDecorator(joiSchema));
};

const convertToFile = (joiSchema, destinationFolder) => {
  const openAPISchema = convert(joiSchema);
  for (let version in openAPISchema) {
    const schemaValidation = validator.validate(openAPISchema[version]);
    if (schemaValidation.errors.length > 0) {
      const errorPath = `${destinationFolder}/error_${version}.json`;
      console.log(
        `An error has occured, please check ${errorPath} for details`
      );
      jsonfile.writeFile(resolvePath(errorPath), schemaValidation);
    }
    jsonfile.writeFile(
      resolvePath(`${destinationFolder}/${version}.json`),
      openAPISchema[version]
    );
  }
};

module.exports = { convert, convertToFile };
