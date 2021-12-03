const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { setEquality, insert, diff } = require("../setUtils");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Set Utils", () => {
  beforeEach(() => {});

  describe("setEquality", () => {
    describe("When set with primitive values are compared", () => {
      let obj_1;
      let obj_2;

      beforeEach(() => {
        obj_1 = new Set(["text", "code", "value", "id"]);
        obj_2 = new Set(["code", "text", "id", "value"]);
      });

      it("should return true", () => expect(setEquality(obj_1, obj_2)).to.be.true);
    });

    describe("When set of sets are compared", () => {
      let obj_1;
      let obj_2;

      beforeEach(() => {
        obj_1 = new Set([new Set(["text", "code"]), new Set(["value", "id"])]);
        obj_2 = new Set([new Set(["code", "text"]), new Set(["id", "value"])]);
      });

      it("should return true", () => expect(setEquality(obj_1, obj_2)).to.be.true);
    });

    describe("When set of different sets are compared", () => {
      let obj_1;
      let obj_2;

      beforeEach(() => {
        obj_1 = new Set([new Set(["text", "code"]), new Set(["value", "id"])]);
        obj_2 = new Set([new Set(["code", "text"]), new Set(["id", "trump"])]);
      });

      it("should return false", () => expect(setEquality(obj_1, obj_2)).to.be.false);
    });
  });

  describe("insert", () => {
    describe("When set contains the element to be inserted", () => {
      let obj_1;
      let obj_2;
      let expectedObj;

      beforeEach(() => {
        obj_1 = new Set([
          new Set([new Set(["value", "text", "name"]), new Set(["value", "text", "id"])])
        ]);
        obj_2 = new Set([new Set(["value", "name", "text"]), new Set(["value", "name", "code"])]);

        expectedObj = new Set([
          new Set([new Set(["value", "text", "name"]), new Set(["value", "text", "id"])]),
          new Set([new Set(["value", "name", "text"]), new Set(["value", "name", "code"])])
        ]);
      });

      it("should return the set with no duplicated values inserted", () =>
        expect(insert(obj_1, obj_2)).deep.equal(expectedObj));
    });

    describe("When set does not contains the element to be inserted", () => {
      let obj_1;
      let obj_2;
      let expectedObj;

      beforeEach(() => {
        obj_1 = new Set([
          new Set([new Set(["value", "text", "name"]), new Set(["value", "code", "name"])]),
          new Set([new Set(["value", "code", "name"]), new Set(["value", "code", "id"])])
        ]);
        obj_2 = new Set([new Set(["value", "name", "text"]), new Set(["value", "name", "code"])]);

        expectedObj = new Set([
          new Set([new Set(["value", "text", "name"]), new Set(["value", "code", "name"])]),
          new Set([new Set(["value", "code", "name"]), new Set(["value", "code", "id"])])
        ]);
      });

      it("should return the set with no duplicated values inserted", () =>
        expect(insert(obj_1, obj_2)).deep.equal(expectedObj));
    });
  });

  describe("difference", () => {
    describe("When two sets have elements in common", () => {
      let obj_1;
      let obj_2;
      let expectedObj;

      beforeEach(() => {
        obj_1 = new Set(["value", "text", "name", "no_common_1", "no_common_2"]);
        obj_2 = new Set(["value", "text", "name"]);

        expectedObj = new Set(["no_common_1", "no_common_2"]);
      });

      it("should return a set with all no common elements", () =>
        expect(diff(obj_1, obj_2)).deep.equal(expectedObj));
    });

    describe("When two sets doesn't have elements in common", () => {
      let obj_1;
      let obj_2;
      let expectedObj;

      beforeEach(() => {
        obj_1 = new Set(["no_common_1", "no_common_2"]);
        obj_2 = new Set(["value", "text", "name"]);

        expectedObj = new Set(["no_common_1", "no_common_2"]);
      });

      it("should return true", () => expect(diff(obj_1, obj_2)).deep.equal(expectedObj));
    });
  });
});
