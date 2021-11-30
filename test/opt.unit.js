const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi")
  .extend(joi => ({
    base: joi.any(),
    type: "opt"
  }))
  .extend(joi => ({
    base: joi.opt(),
    type: "opt",
    messages: {
      "opt.alternative": "{{#q}}"
    },
    rules: {
      alternative: {
        // convert: true,
        method(alternatives) {
          return this.$_addRule({
            name: "alternative",
            args: { alternatives }
          });
        },
        args: [
          {
            name: "alternatives",
            assert: value => typeof value === "object",
            message: "must be an object"
          }
        ],
        validate(value, helpers, args, options) {
          const type = value.type || "";
          const target = args.alternative[type];

          if (!target) {
            const error = helpers.error(`opt.alternative`, {});
            error.local = {
              ...error.local,
              q: `"target" with type ${type} is not supported`
            };

            return error;
          }
          const internalOptions = Object.assign(options, {
            abortEarly: false,
            context: { ...helpers.prefs.context }
          });

          const tagertValidation = target.validate(value, internalOptions);

          if (tagertValidation.error) {
            const error = helpers.error(`opt.alternative`, {
              details: tagertValidation.error.details,
              q: tagertValidation.error.details[0].message
            });

            return error;
          }

          return value;
        }
      }
    }
  }));

describe("Joi Options to OpenAPI", () => {
  beforeEach(() => { });

  describe("When .when is applied to options extension", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.opt().alternative({
        test: Joi.object({
          someKey: Joi.string().allow(null).optional(),

          embeed: Joi.object({
            body: Joi.object({
              sequence: Joi.string().required(),
              struct: Joi.when(Joi.ref("someKey"), {
                is: Joi.exist(),
                then: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
                otherwise: Joi.forbidden()
              })
            })
          }).required()
        })
      });

      expectedObj = {
        oneOf: [
          {
            oneOf: [
              {
                type: "object",
                additionalProperties: false,
                properties: {
                  someKey: {
                    type: "string",
                    nullable: true
                  },
                  embeed: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      body: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          sequence: {
                            type: "string"
                          },
                          struct: {
                            anyOf: [
                              {
                                type: "string"
                              },
                              {
                                type: "number",
                                format: "float"
                              }
                            ]
                          }
                        },
                        required: ["sequence", "struct"]
                      }
                    }
                  }
                },
                required: ["someKey", "embeed"]
              },
              {
                type: "object",
                additionalProperties: false,
                properties: {
                  embeed: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      body: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          sequence: {
                            type: "string"
                          }
                        },
                        required: ["sequence"]
                      }
                    }
                  }
                },
                required: ["embeed"]
              }
            ]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When two identical objects are given", () => {
    let ext;
    let expectedObj;
    let obj;
    beforeEach(() => {
      ext = Joi.extend(joi => ({
        base: joi.opt().alternative({
          1: joi.object().keys({ sun: joi.string().required() }),
          2: joi.object().keys({ sun: joi.string().required() })
        }),
        type: "solarSystem"
      }));

      obj = ext.solarSystem();

      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              sun: {
                type: "string"
              }
            },
            required: ["sun"]
          }
        ]
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });
});
