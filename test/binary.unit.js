const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi");

describe("Joi Binary to OpenAPI", () => {
  beforeEach(() => {});

  describe("When a binary is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.binary();
      expectedObj = {
        type: "string",
        format: "binary",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a binary is given base64", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.binary().encoding("base64");
      expectedObj = {
        type: "string",
        format: "byte",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a binary is given with lenght", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.binary().length(10);
      expectedObj = {
        type: "string",
        format: "binary",
        minLength: 10,
        maxLength: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a binary is given with min", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.binary().min(10);
      expectedObj = {
        type: "string",
        format: "binary",
        minLength: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a binary is given with max", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.binary().max(10);
      expectedObj = {
        type: "string",
        format: "binary",
        maxLength: 10,
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });
});
