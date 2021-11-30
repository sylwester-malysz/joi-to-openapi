const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { removeKeyWithPath } = require("../object");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi Object Utils", () => {
  beforeEach(() => {});

  describe("removeKeyWithPath", () => {
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
        expect(removeKeyWithPath(["id"], obj, {})).deep.equal(expectedObj));
    });

    describe("When object contains additionalProperties", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string"
            },
            code: {
              additionalProperties: false,
              type: "object",
              properties: {
                patch: {
                  type: "string"
                }
              }
            }
          }
        };

        expectedObj = {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string"
            },
            code: {
              additionalProperties: false,
              type: "object"
            }
          }
        };
      });

      it("should return the object without the specified key", () =>
        expect(removeKeyWithPath(["code", "patch"], obj, {})).deep.equal(expectedObj));
    });

    describe("When the key is inside of a oneOf", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          oneOf: [
            {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            {
              type: "object",
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            }
          ]
        };

        expectedObj = {
          oneOf: [
            {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            {
              type: "object",
              properties: {
                text: {
                  type: "string"
                }
              }
            }
          ]
        };
      });

      it("should return the object without the specified key", () =>
        expect(removeKeyWithPath(["id"], obj, {})).deep.equal(expectedObj));
    });

    describe("When the key is inside of a oneOf and some object is equal to someone else", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          oneOf: [
            {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            {
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
            {
              type: "object",
              properties: {
                text: {
                  type: "string"
                }
              }
            }
          ]
        };

        expectedObj = {
          oneOf: [
            {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            {
              type: "object",
              properties: {
                text: {
                  type: "string"
                }
              }
            }
          ]
        };
      });

      it("should return the object without the specified key and one less object", () =>
        expect(removeKeyWithPath(["id"], obj, {})).deep.equal(expectedObj));
    });

    describe("When the key is inside of a oneOf is with one element only", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          oneOf: [
            {
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
            {
              type: "object",
              properties: {
                text: {
                  type: "string"
                }
              }
            }
          ]
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

      it("should return the object without the specified key and one less object", () =>
        expect(removeKeyWithPath(["id"], obj, {})).deep.equal(expectedObj));
    });

    describe("When the key is inside of a anyOf", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          anyOf: [
            {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            {
              type: "object",
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            }
          ]
        };

        expectedObj = {
          anyOf: [
            {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            {
              type: "object",
              properties: {
                text: {
                  type: "string"
                }
              }
            }
          ]
        };
      });

      it("should return the object without the specified key", () =>
        expect(removeKeyWithPath(["id"], obj, {})).deep.equal(expectedObj));
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
        expect(removeKeyWithPath(["no-existing"], obj, {})).deep.equal(obj));
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
        expect(removeKeyWithPath(["id", "id"], obj, {})).deep.equal(expectedObj));
    });
  });
});
