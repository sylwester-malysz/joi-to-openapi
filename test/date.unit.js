const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi");

describe("Joi date to OpenAPI", () => {
  beforeEach(() => {});

  describe("When a date is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.date();
      expectedObj = {
        type: "string",
        format: "date-time",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When a timestamp is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.date().timestamp();
      expectedObj = {
        type: "integer",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });
});
