const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi")
  .extend((joi) => ({
    base: joi.any(),
    type: "reference",
    messages: {
      "reference.use": "{{#q}}",
    },
    coerce() {},
    validate() {},
    rules: {
      use: {
        multi: true,
        method(ref) {
          return this.$_addRule({ name: "use" }).$_setFlag("_ref", ref);
        },
        args: [],
        validate(value, helpers, args, options) {},
      },
    },
  }))
  .extend((joi) => ({
    base: joi.any(),
    type: "opt",
  }))
  .extend((joi) => ({
    base: joi.opt(),
    type: "opt",
    messages: {
      "opt.alternative": "{{#q}}",
    },
    rules: {
      alternative: {
        method(alternatives) {
          return this.$_addRule({
            name: "alternative",
            args: { alternatives },
          });
        },
        args: [
          {
            name: "alternatives",
            assert: (value) => typeof value === "object",
            message: "must be an object",
          },
        ],
        validate(value, helpers, args, options) {},
      },
    },
  }));

describe("Joi Extensions to OpenAPI", () => {
  beforeEach(() => {});

  describe("When a string extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.string(),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        type: "string",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with valids extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.string().valid("test", "test1"),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        type: "string",
        enum: ["test", "test1"],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.object().keys({
          test: joi
            .string()
            .valid("test", "test1")
            .required(),
          list: joi.array().items(joi.string().valid("a", "b")),
        }),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        type: "object",
        properties: {
          test: {
            type: "string",
            enum: ["test", "test1"],
          },
          list: {
            type: "array",
            items: {
              type: "string",
              enum: ["a", "b"],
            },
          },
        },
        required: ["test"],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an alternatives extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.alternatives().try(
          joi.object().keys({
            test: joi
              .string()
              .valid("test", "test1")
              .required(),
            list: joi.array().items(joi.string().valid("a", "b")),
          }),
          joi.string()
        ),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              test: {
                type: "string",
                enum: ["test", "test1"],
              },
              list: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["a", "b"],
                },
              },
            },
            required: ["test"],
          },
          {
            type: "string",
          },
        ],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.number(),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        type: "number",
        format: "float",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a binary extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.binary(),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        type: "string",
        format: "binary",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a boolean extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.boolean(),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        type: "boolean",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a date extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.date(),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        type: "string",
        format: "date-time",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an any extension is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      const joiExtension = Joi.extend((joi) => ({
        base: joi.any(),
        type: "newExtension",
      }));
      obj = joiExtension.newExtension();
      expectedObj = {
        oneOf: [
          { type: "array" },
          { type: "boolean" },
          { type: "number" },
          { type: "object" },
          { type: "string" },
        ],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an extension of extension is given", () => {
    let ext;
    let expectedObj;
    let obj;
    beforeEach(() => {
      ext = Joi.extend((joi) => ({
        base: joi.opt().alternative({
          1: joi.object().keys({ sun: joi.string().required() }),
          2: joi.object().keys({ moon: joi.string().required() }),
        }),
        type: "solarSystem",
      }));

      obj = ext.solarSystem();

      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              sun: {
                type: "string",
              },
            },
            required: ["sun"],
          },
          {
            type: "object",
            properties: {
              moon: {
                type: "string",
              },
            },
            required: ["moon"],
          },
        ],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an array is given with min", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      let joi = Joi.extend((joi) => ({
        base: joi
          .array()
          .items(
            Joi.reference().use("schemas:1"),
            Joi.reference().use("schemas:2"),
            Joi.reference().use("schemas:3"),
            Joi.reference().use("schemas:4"),
            Joi.reference().use("schemas:5")
          ),
        type: "numbers",
      }));
      obj = joi.numbers();
      expectedObj = {
        type: "array",
        items: {
          oneOf: [
            {
              $ref: "#/components/schemas/1",
            },
            {
              $ref: "#/components/schemas/2",
            },
            {
              $ref: "#/components/schemas/3",
            },
            {
              $ref: "#/components/schemas/4",
            },
            {
              $ref: "#/components/schemas/5",
            },
          ],
        },
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });
});
