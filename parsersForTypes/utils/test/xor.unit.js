const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { makeDependencies, computedNotAllowedRelation } = require("../xor");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi Xor Utils", () => {
  beforeEach(() => {});

  describe("makeDependencies", () => {
    describe("When called with xor dependences", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" }
            ]
          },
          {
            peers: [
              { path: ["id"], key: "id" },
              { path: ["name"], key: "name" }
            ]
          }
        ];

        expectedObj = {
          code: new Set([new Set(["text"])]),
          text: new Set([new Set(["code"])]),
          id: new Set([new Set(["name"])]),
          name: new Set([new Set(["id"])])
        };
      });

      it("should return the dependency object", () =>
        expect(makeDependencies(obj)).deep.equal(expectedObj));
    });

    describe("When more than 2 keys are involved", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["id"], key: "id" },
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" }
            ]
          }
        ];

        expectedObj = {
          code: new Set([new Set(["id", "text"])]),
          text: new Set([new Set(["id", "code"])]),
          id: new Set([new Set(["code", "text"])])
        };
      });

      it("should return the dependency object", () =>
        expect(makeDependencies(obj)).deep.equal(expectedObj));
    });

    describe("When distinct peers overlaps", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" }
            ]
          },
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["name"], key: "name" }
            ]
          }
        ];

        expectedObj = {
          code: new Set([new Set(["text", "name"])]),
          text: new Set([new Set(["code"])]),
          name: new Set([new Set(["code"])])
        };
      });

      it("should return the dependency object", () =>
        expect(makeDependencies(obj)).deep.equal(expectedObj));
    });

    describe("When more than 2 distinct peers are present", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" },
              { path: ["alpha"], key: "alpha" }
            ]
          },
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["name"], key: "name" }
            ]
          }
        ];

        expectedObj = {
          alpha: new Set([new Set(["code", "text"])]),
          text: new Set([new Set(["code", "alpha"])]),
          code: new Set([new Set(["text", "alpha", "name"])]),
          name: new Set([new Set(["code"])])
        };
      });

      it("should return the dependency object", () =>
        expect(makeDependencies(obj)).deep.equal(expectedObj));
    });
  });

  describe("computedNotAllowedRelation", () => {
    describe("When called with nands dependences", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" }
            ]
          },
          {
            peers: [
              { path: ["id"], key: "id" },
              { path: ["name"], key: "name" }
            ]
          }
        ];

        expectedObj = new Set([
          new Set(["code", "id"]),
          new Set(["code", "name"]),
          new Set(["text", "id"]),
          new Set(["text", "name"])
        ]);
      });

      it("should return the augmented dependency object", () =>
        expect(computedNotAllowedRelation(obj)).deep.equal(expectedObj));
    });

    describe("When distinct peers overlaps", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" }
            ]
          },
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["name"], key: "name" }
            ]
          }
        ];

        expectedObj = new Set([new Set(["code"]), new Set(["text", "name"])]);
      });

      it("should return the augmented dependency object", () =>
        expect(computedNotAllowedRelation(obj)).deep.equal(expectedObj));
    });

    describe("When more than 2 keys are involved", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["id"], key: "id" },
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" }
            ]
          }
        ];

        expectedObj = new Set([
          new Set(["id", "code"]),
          new Set(["id", "text"]),
          new Set(["code", "text"])
        ]);
      });

      it("should return the dependency object", () =>
        expect(computedNotAllowedRelation(obj)).deep.equal(expectedObj));
    });

    describe("When called with xor dependences", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" }
            ]
          },
          {
            peers: [
              { path: ["id"], key: "id" },
              { path: ["name"], key: "name" }
            ]
          },
          {
            peers: [
              { path: ["prefix"], key: "prefix" },
              { path: ["value"], key: "value" }
            ]
          }
        ];

        expectedObj = new Set([
          new Set(["code", "id", "prefix"]),
          new Set(["code", "id", "value"]),
          new Set(["code", "name", "prefix"]),
          new Set(["code", "name", "value"]),
          new Set(["text", "id", "prefix"]),
          new Set(["text", "id", "value"]),
          new Set(["text", "name", "prefix"]),
          new Set(["text", "name", "value"])
        ]);
      });

      it("should return the augmented dependency object", () =>
        expect(computedNotAllowedRelation(obj)).deep.equal(expectedObj));
    });
  });
});
