const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("@hapi/joi");

describe("Joi Alternatives to OpenAPI", () => {
  beforeEach(() => {});

  describe("When .when is applied to an object", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object({
        from: Joi.string()
          .allow("")
          .required(),
        timestamp: Joi.string().required(),
        body: Joi.object()
          .keys({
            status: Joi.string().valid(["on", "off", "pause"]),
            stream_direction: Joi.string()
              .valid(["in", "out"])
              .required()
          })
          .required()
      }).when(
        Joi.object({
          body: Joi.object({
            stream_direction: Joi.string()
              .valid("in")
              .required(),
            status: Joi.string()
              .valid(["pause"])
              .required()
          })
            .required()
            .unknown()
        }).unknown(),
        {
          then: Joi.object({
            identifier: Joi.string().optional(),
            device_id: Joi.string().optional()
          }),
          otherwise: Joi.object({
            identifier: Joi.string().required(),
            device_id: Joi.string().required()
          })
        }
      );

      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["pause"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["in"]
                  }
                },
                required: ["stream_direction", "status"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "body"]
          },
          {
            type: "object",
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["on", "off", "pause"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["out"]
                  }
                },
                required: ["stream_direction"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "body", "identifier", "device_id"]
          },
          {
            type: "object",
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["on", "off"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["in"]
                  }
                },
                required: ["stream_direction"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "body", "identifier", "device_id"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      return expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When .when is used inside alternative.try", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const objCond = Joi.object({
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.exist(),
            then: Joi.alternatives()
              .try(Joi.string(), Joi.number())
              .required(),
            otherwise: Joi.forbidden()
          })
        }).required()
      });

      obj = Joi.object({
        someKey: Joi.string().allow(null),
        body: Joi.alternatives().try(
          objCond,
          Joi.object().keys({
            timestamp: Joi.object().keys({
              deleted: Joi.string()
                .isoDate()
                .description("Date in ISO format")
                .required()
            })
          })
        )
      });

      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              someKey: {
                type: "string",
                nullable: true
              },
              body: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      timestamp: {
                        type: "object",
                        properties: {
                          deleted: {
                            type: "string",
                            format: "date-time",
                            description: "Date in ISO format"
                          }
                        },
                        required: ["deleted"]
                      }
                    }
                  },
                  {
                    type: "object",
                    properties: {
                      sequence: {
                        type: "string"
                      },
                      embeed: {
                        type: "object",
                        properties: {
                          struct: {
                            oneOf: [
                              { type: "string" },
                              { type: "number", format: "float" }
                            ]
                          }
                        },
                        required: ["struct"]
                      }
                    },
                    required: ["embeed"]
                  }
                ]
              }
            },
            required: ["someKey"]
          },
          {
            type: "object",
            properties: {
              body: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      timestamp: {
                        type: "object",
                        properties: {
                          deleted: {
                            type: "string",
                            format: "date-time",
                            description: "Date in ISO format"
                          }
                        },
                        required: ["deleted"]
                      }
                    }
                  },
                  {
                    type: "object",
                    properties: {
                      sequence: {
                        type: "string"
                      },
                      embeed: {
                        type: "object",
                        properties: {}
                      }
                    },
                    required: ["embeed"]
                  }
                ]
              }
            }
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
