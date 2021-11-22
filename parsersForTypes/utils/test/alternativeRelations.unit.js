const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { setEquality, insert, makeFullDependencies } = require("../alternativeRelations");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi AlternativeRelations Set Utils", () => {
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

      it("should return true", () => expect(insert(obj_1, obj_2)).deep.equal(expectedObj));
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

      it("should return true", () => expect(insert(obj_1, obj_2)).deep.equal(expectedObj));
    });
  });
});

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
