const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi");

describe("Joi Alternatives to OpenAPI", () => {
  beforeEach(() => {});

  describe("When alternatives try is used with mode one", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.alternatives().try(Joi.string(), Joi.number()).match('one');

      expectedObj = {
        oneOf: [
          {
            type: "string",
          },
          {
            type: "number",
            format: "float",
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      return expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When alternatives try is used with mode all", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.alternatives().try(Joi.string(), Joi.number()).match('all');

      expectedObj = {
        allOf: [
          {
            type: "string",
          },
          {
            type: "number",
            format: "float",
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      return expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When alternatives try is used", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.alternatives().try(Joi.string(), Joi.number());

      expectedObj = {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "number",
            format: "float",
          },
        ],
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
            otherwise: Joi.forbidden(),
          }),
        }).required(),
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
                .required(),
            }),
          })
        ),
      });

      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              someKey: {
                type: "string",
                nullable: true,
              },
              body: {
                anyOf: [
                  {
                    type: "object",
                    properties: {
                      timestamp: {
                        type: "object",
                        properties: {
                          deleted: {
                            type: "string",
                            format: "date-time",
                            description: "Date in ISO format",
                          },
                        },
                        required: ["deleted"],
                      },
                    },
                  },
                  {
                    type: "object",
                    properties: {
                      sequence: {
                        type: "string",
                      },
                      embeed: {
                        type: "object",
                        properties: {
                          struct: {
                            anyOf: [
                              { type: "string" },
                              { type: "number", format: "float" },
                            ],
                          },
                        },
                        required: ["struct"],
                      },
                    },
                    required: ["embeed"],
                  },
                ],
              },
            },
            required: ["someKey"],
          },
          {
            type: "object",
            properties: {
              body: {
                anyOf: [
                  {
                    type: "object",
                    properties: {
                      timestamp: {
                        type: "object",
                        properties: {
                          deleted: {
                            type: "string",
                            format: "date-time",
                            description: "Date in ISO format",
                          },
                        },
                        required: ["deleted"],
                      },
                    },
                  },
                  {
                    type: "object",
                    properties: {
                      sequence: {
                        type: "string",
                      },
                      embeed: {
                        type: "object",
                        properties: {},
                      },
                    },
                    required: ["embeed"],
                  },
                ],
              },
            },
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObj);
    });
  });
});
