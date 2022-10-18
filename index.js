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
const refParser = require("./parsersForTypes/reference");
const extensionParser = require("./parsersForTypes/extension");
const optionsParser = require("./parsersForTypes/opt");
const anyParser = require("./parsersForTypes/any");
const { isJoi, addAllows } = require("./parsersForTypes/utils");

const universalDecorator = joiSchema => {
  const universalParams = {};

  if (!joiSchema._flags) return universalParams;

  if (joiSchema._valids && joiSchema._valids.has(null)) {
    universalParams.nullable = true;
  }

  if (joiSchema._flags.description) {
    universalParams.description = joiSchema._flags.description;
  }

  if (joiSchema._flags.label) {
    universalParams.title = joiSchema._flags.label;
  }

  if (joiSchema._flags.default) {
    universalParams.default = joiSchema._flags.default;
  }

  const exampleLength = (joiSchema.$_terms.examples && joiSchema.$_terms.examples.length) || 0;
  if (exampleLength > 0) {
    if (exampleLength === 1) {
      [universalParams.example] = joiSchema.$_terms.examples;
    } else {
      universalParams.examples = joiSchema.$_terms.examples;
    }
  }
  return universalParams;
};

const convertAux = (joiSchema, state) => {
  if (!joiSchema) {
    throw new Error("No schema was passed");
  }
  if (!isJoi(joiSchema)) {
    throw new TypeError("Passed schema does not appear to be a joi schema.");
  }

  const { type } = joiSchema;
  const newState = {
    ...state,
    isRoot: typeof state.isRoot === "undefined",
    originalSchema: state.originalSchema || joiSchema
  };
  const decorator = universalDecorator(joiSchema);
  let swaggerSchema;
  switch (type) {
    case "number":
      swaggerSchema = numberParser(joiSchema);
      break;
    case "string":
      swaggerSchema = stringParser(joiSchema, newState, convertAux);
      break;
    case "boolean":
      swaggerSchema = booleanParser(joiSchema);
      break;
    case "binary":
      swaggerSchema = binaryParser(joiSchema);
      break;
    case "alternatives":
      swaggerSchema = alternativesParser(joiSchema, newState, convertAux);
      break;
    case "object":
      swaggerSchema = objectParser(joiSchema, newState, convertAux);
      break;
    case "array":
      swaggerSchema = arrayParser(joiSchema, newState, convertAux);
      break;
    case "date":
      swaggerSchema = dateParser(joiSchema);
      break;
    case "any":
      swaggerSchema = anyParser(joiSchema, newState, convertAux);
      break;
    case "opt":
      swaggerSchema = optionsParser(joiSchema, newState, convertAux);
      break;
    case "route":
      swaggerSchema = routeParser(joiSchema, newState, convertAux);
      break;
    case "reference": {
      swaggerSchema = refParser(joiSchema);
      if (decorator.nullable) {
        delete decorator.nullable;
        swaggerSchema = {
          oneOf: [swaggerSchema, { nullable: true }]
        };
      }
      break;
    }
    default:
      swaggerSchema = extensionParser(joiSchema, newState, convertAux);
  }

  return swaggerSchema ? addAllows(joiSchema, Object.assign(swaggerSchema, decorator)) : undefined;
};

const convert = (joiSchema, state = {}) => convertAux(joiSchema, state);

module.exports = { convert };
