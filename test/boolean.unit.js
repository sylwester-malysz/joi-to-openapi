const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi");

describe("Joi Boolean to OpenAPI", () => {
  beforeEach(() => {});

  describe("When a boolean is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.boolean();
      expectedObj = {
        type: "boolean",
      };
    });

    it("should be converted in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });
});
