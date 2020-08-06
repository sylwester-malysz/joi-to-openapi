const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi");

describe("Joi Number to OpenAPI", () => {
  beforeEach(() => {});

  describe("When a number is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number();
      expectedObj = {
        type: "number",
        format: "float",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number is given with values", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().valid(20, 30);
      expectedObj = {
        type: "number",
        format: "float",
        enum: [20, 30],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number is given with examples", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().example(10);
      expectedObj = {
        type: "number",
        format: "float",
        example: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number is given with multiple examples", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number()
        .example(10)
        .example(20);
      expectedObj = {
        type: "number",
        format: "float",
        examples: [10, 20],
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number is given with description", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().description("This is a test");
      expectedObj = {
        type: "number",
        format: "float",
        description: "This is a test",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number is given with label", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().label("This is a test");
      expectedObj = {
        type: "number",
        format: "float",
        title: "This is a test",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number is given with default", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().default(1);
      expectedObj = {
        type: "number",
        format: "float",
        default: 1,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number integer is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().integer();
      expectedObj = {
        type: "integer",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number with precision is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().precision(2);
      expectedObj = {
        type: "number",
        format: "double",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number with max and min", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number()
        .max(10)
        .min(5);
      expectedObj = {
        type: "number",
        format: "float",
        minimum: 5,
        maximum: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number with positive", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().positive();
      expectedObj = {
        type: "number",
        format: "float",
        minimum: 1,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number with negative", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().negative();
      expectedObj = {
        type: "number",
        format: "float",
        maximum: -1,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number with grater", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().greater(5);
      expectedObj = {
        type: "number",
        format: "float",
        minimum: 6,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number with less", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().less(10);
      expectedObj = {
        type: "number",
        format: "float",
        maximum: 9,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a number with null", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.number().allow(null);
      expectedObj = {
        type: "number",
        format: "float",
        nullable: true,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });
});
