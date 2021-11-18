const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const {
  makeDependencies,
  makeFullDependencies,
  setEquality,
  insert,
  computedNotAllowedRelation
} = require("../nand");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi Nand Utils", () => {
  beforeEach(() => {});

  describe("makeDependencies", () => {
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
          code: new Set([new Set(["text", "name"])]),
          text: new Set([new Set(["code"])]),
          name: new Set([new Set(["code"])])
        };

        expectedObj = {
          code: new Set([new Set(["text", "name"])]),
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
