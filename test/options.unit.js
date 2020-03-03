const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("@hapi/joi")
  .extend(joi => ({
    base: joi.any(),
    name: "options",
    language: {
      alternative: "!!{{q}}"
    },
    rules: []
  }))
  .extend(joi => ({
    base: joi.options(),
    name: "options",
    language: {
      alternative: "!!{{q}}"
    },
    rules: [
      {
        name: "alternative",
        params: {
          targets: joi.object().unknown()
        },
        setup(params) {
          this._flags.alternatives = params.targets;
        },
        validate(params, value, state, options) {
          const type = value.type || "";
          const target = this._flags.alternatives[type];

          if (!target) {
            return this.createError(
              `options.alternative`,
              { q: `type ${type} is not supported` },
              { ...state, key: "target", value: "target", path: ["target"] },
              options
            );
          }

          const internalOptions = Object.assign(options, {
            abortEarly: false,
            context: Object.assign(options.context, {
              globals: options.context.globals
            })
          });

          return joi.validate(value, target, internalOptions, (err, res) => {
            if (err) {
              const error = this.createError(
                "options.alternative",
                { details: err.details, q: err.details[0].message },
                { ...state, key: "target", value: "target", path: ["target"] },
                options
              );
              return error;
            }
            return res;
          });
        }
      }
    ]
  }));

describe("Joi Options to OpenAPI", () => {
  beforeEach(() => {});

  describe("When .when is applied to options extension", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.options().alternative({
        test: Joi.object({
          someKey: Joi.string()
            .allow(null)
            .optional(),

          embeed: Joi.object({
            body: Joi.object({
              sequence: Joi.string().required(),
              struct: Joi.when(Joi.ref("someKey"), {
                is: Joi.exist(),
                then: Joi.alternatives()
                  .try(Joi.string(), Joi.number())
                  .required(),
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
                properties: {
                  someKey: {
                    type: "string",
                    nullable: true
                  },
                  embeed: {
                    type: "object",
                    properties: {
                      body: {
                        type: "object",
                        properties: {
                          sequence: {
                            type: "string"
                          },
                          struct: {
                            oneOf: [
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
                properties: {
                  embeed: {
                    type: "object",
                    properties: {
                      body: {
                        type: "object",
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
});
