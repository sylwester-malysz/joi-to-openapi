const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { makeFullDependencies } = require("../alternativeRelations");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi AlternativeRelations Dependencies Utils", () => {
  describe("makeFullDependencies", () => {
    describe("When called with nands dependences", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          code: new Set([new Set(["text"])]),
          text: new Set([new Set(["code"])]),
          id: new Set([new Set(["name"])]),
          name: new Set([new Set(["id"])])
        };

        expectedObj = {
          code: new Set([new Set(["text", "name"]), new Set(["text", "id"])]),
          text: new Set([new Set(["code", "name"]), new Set(["code", "id"])]),
          id: new Set([new Set(["name", "text"]), new Set(["name", "code"])]),
          name: new Set([new Set(["id", "text"]), new Set(["id", "code"])])
        };
      });

      it("should return the augmented dependency object", () =>
        expect(makeFullDependencies(obj)).deep.equal(expectedObj));
    });

    describe("When called with nands dependences", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          alpha: new Set([new Set(["code"]), new Set(["name", "text"])]),
          text: new Set([new Set(["code"]), new Set(["alpha"]), new Set(["alpha", "code"])]),
          code: new Set([new Set(["name", "text"]), new Set(["alpha"])]),
          name: new Set([new Set(["code"]), new Set(["alpha", "code"]), new Set(["alpha"])])
        };

        expectedObj = {
          alpha: new Set([new Set(["code"]), new Set(["name", "text"])]),
          text: new Set([new Set(["code"]), new Set(["alpha"]), new Set(["alpha", "code"])]),
          code: new Set([new Set(["name", "text"]), new Set(["alpha"])]),
          name: new Set([new Set(["code"]), new Set(["alpha", "code"]), new Set(["alpha"])])
        };
      });

      it("should return the augmented dependency object", () =>
        expect(makeFullDependencies(obj)).deep.equal(expectedObj));
    });

    describe("When distinct peers overlaps", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          code: new Set([new Set(["text"]), new Set(["name"])]),
          text: new Set([new Set(["code"])]),
          name: new Set([new Set(["code"])])
        };

        expectedObj = {
          code: new Set([new Set(["text"]), new Set(["name"])]),
          text: new Set([new Set(["code"])]),
          name: new Set([new Set(["code"])])
        };
      });

      it("should return the augmented dependency object", () =>
        expect(makeFullDependencies(obj)).deep.equal(expectedObj));
    });

    describe("When called with nands dependences", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          code: new Set([new Set(["text"])]),
          text: new Set([new Set(["code"])]),
          id: new Set([new Set(["name"])]),
          name: new Set([new Set(["id"])]),
          value: new Set([new Set(["prefix"])]),
          prefix: new Set([new Set(["value"])])
        };

        expectedObj = {
          code: new Set([
            new Set(["text", "name", "prefix"]),
            new Set(["text", "name", "value"]),
            new Set(["text", "id", "prefix"]),
            new Set(["text", "id", "value"])
          ]),
          text: new Set([
            new Set(["code", "name", "prefix"]),
            new Set(["code", "name", "value"]),
            new Set(["code", "id", "prefix"]),
            new Set(["code", "id", "value"])
          ]),
          id: new Set([
            new Set(["name", "text", "prefix"]),
            new Set(["name", "text", "value"]),
            new Set(["name", "code", "prefix"]),
            new Set(["name", "code", "value"])
          ]),
          name: new Set([
            new Set(["id", "text", "prefix"]),
            new Set(["id", "text", "value"]),
            new Set(["id", "code", "prefix"]),
            new Set(["id", "code", "value"])
          ]),
          value: new Set([
            new Set(["prefix", "text", "name"]),
            new Set(["prefix", "text", "id"]),
            new Set(["prefix", "code", "name"]),
            new Set(["prefix", "code", "id"])
          ]),
          prefix: new Set([
            new Set(["value", "text", "name"]),
            new Set(["value", "text", "id"]),
            new Set(["value", "code", "name"]),
            new Set(["value", "code", "id"])
          ])
        };
      });

      it("should return the augmented dependency object", () =>
        expect(makeFullDependencies(obj)).deep.equal(expectedObj));
    });
  });
});
