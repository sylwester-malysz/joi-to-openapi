const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { makeDependencies, computedNotAllowedRelation, join } = require("../nand");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi Nand Utils", () => {
  beforeEach(() => {});

  describe("join", () => {
    describe("When called with dependencies", () => {
      let obj_1;
      let obj_2;
      let expectedObj;

      beforeEach(() => {
        obj_1 = {
          code: new Set([new Set(["text"]), new Set(["alpha"])]),
          text: new Set([new Set(["code"]), new Set(["alpha"])]),
          alpha: new Set([new Set(["code"]), new Set(["text"])])
        };

        obj_2 = {
          code: new Set([new Set(["name"]), new Set(["alpha"])]),
          name: new Set([new Set(["code"]), new Set(["alpha"])]),
          alpha: new Set([new Set(["code"]), new Set(["name"])])
        };

        expectedObj = {
          code: new Set([new Set(["text", "name"]), new Set(["alpha"])]),
          text: new Set([new Set(["code"]), new Set(["alpha"])]),
          name: new Set([new Set(["code"]), new Set(["alpha"])]),
          alpha: new Set([new Set(["code"]), new Set(["name", "text"])])
        };
      });

      it("should return the dependency object", () =>
        expect(join(obj_1, obj_2)).deep.equal(expectedObj));
    });

    describe("When called with dependencies", () => {
      let obj_1;
      let obj_2;
      let expectedObj;

      beforeEach(() => {
        obj_1 = {
          code: new Set([new Set(["text"])]),
          text: new Set([new Set(["code"])])
        };

        obj_2 = {
          code: new Set([new Set(["name"])]),
          name: new Set([new Set(["code"])])
        };

        expectedObj = {
          code: new Set([new Set(["text", "name"])]),
          text: new Set([new Set(["code"])]),
          name: new Set([new Set(["code"])])
        };
      });

      it("should return the dependency object", () =>
        expect(join(obj_1, obj_2)).deep.equal(expectedObj));
    });
  });

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

    describe("When called with nands dependences", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = [
          {
            peers: [
              { path: ["code"], key: "code" },
              { path: ["text"], key: "text" },
              { path: ["earth"], key: "earth" }
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
          code: new Set([new Set(["text"]), new Set(["earth"])]),
          earth: new Set([new Set(["code"]), new Set(["text"])]),
          text: new Set([new Set(["code"]), new Set(["earth"])]),
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
          alpha: new Set([new Set(["code"]), new Set(["text"])]),
          text: new Set([new Set(["code"]), new Set(["alpha"])]),
          code: new Set([new Set(["text", "name"]), new Set(["alpha", "name"])]),
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
              { path: ["name"], key: "name" },
              { path: ["alpha"], key: "alpha" }
            ]
          }
        ];

        expectedObj = {
          alpha: new Set([new Set(["code"]), new Set(["name", "text"])]),
          text: new Set([new Set(["code"]), new Set(["alpha"])]),
          code: new Set([new Set(["name", "text"]), new Set(["alpha"])]),
          name: new Set([new Set(["code"]), new Set(["alpha"])])
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

        expectedObj = new Set([new Set(["code"]), new Set(["name", "text"])]);
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
});
