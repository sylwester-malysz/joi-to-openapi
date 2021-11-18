const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { removeKeyFromObjectWithPath } = require("../object");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi Object Utils", () => {
  beforeEach(() => {});

  describe("removeKeyFromObjectWithPath", () => {
    describe("When called with existing key", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            text: {
              type: "string"
            }
          }
        };

        expectedObj = {
          type: "object",
          properties: {
            text: {
              type: "string"
            }
          }
        };
      });

      it("should return the object without the specified key", () =>
        expect(removeKeyFromObjectWithPath(["id"], obj, {})).deep.equal(expectedObj));
    });

    describe("When called with no-existing key", () => {
      let obj;

      beforeEach(() => {
        obj = {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            text: {
              type: "string"
            }
          }
        };
      });

      it("should return the same object", () =>
        expect(removeKeyFromObjectWithPath(["no-existing"], obj, {})).deep.equal(obj));
    });

    describe("When called with nested keys", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          type: "object",
          properties: {
            id: {
              type: "object",
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            text: {
              type: "string"
            }
          }
        };

        expectedObj = {
          type: "object",
          properties: {
            id: {
              type: "object",
              properties: {
                text: {
                  type: "string"
                }
              }
            },
            text: {
              type: "string"
            }
          }
        };
      });

      it("should return the object with removed key", () =>
        expect(removeKeyFromObjectWithPath(["id", "id"], obj, {})).deep.equal(expectedObj));
    });
  });
});
