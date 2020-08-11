const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi");

describe("Joi String to OpenAPI", () => {
  beforeEach(() => {});

  describe("When a string is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string();
      expectedObj = {
        type: "string",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a strings is given with values", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().valid("500", "300", "200");
      expectedObj = {
        type: "string",
        enum: ["500", "300", "200"],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a strings is given with examples", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().example("This is a test");
      expectedObj = {
        type: "string",
        example: "This is a test",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string is given with multiple examples", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string()
        .example("This is a test")
        .example("Happy Joi");
      expectedObj = {
        type: "string",
        examples: ["This is a test", "Happy Joi"],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string is given with description", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().description("This is a test");
      expectedObj = {
        type: "string",
        description: "This is a test",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string is given with label", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().label("This is a test");
      expectedObj = {
        type: "string",
        title: "This is a test",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string is given with default", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().default("This is a test");
      expectedObj = {
        type: "string",
        default: "This is a test",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with null", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().allow(null);
      expectedObj = {
        type: "string",
        nullable: true,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with guid", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().guid();
      expectedObj = {
        type: "string",
        format: "uuid",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with email", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().email();
      expectedObj = {
        type: "string",
        format: "email",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with uri", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().uri();
      expectedObj = {
        type: "string",
        format: "uri",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with iso date", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().isoDate();
      expectedObj = {
        type: "string",
        format: "date-time",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with min", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().min(10);
      expectedObj = {
        type: "string",
        minLength: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with max", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().max(10);
      expectedObj = {
        type: "string",
        maxLength: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with lenght", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().length(10);
      expectedObj = {
        type: "string",
        length: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a string with pattern", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.string().pattern(/^[abc]+$/);
      expectedObj = {
        type: "string",
        pattern: "^[abc]+$",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });
});
