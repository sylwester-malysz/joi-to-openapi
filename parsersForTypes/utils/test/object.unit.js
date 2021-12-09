const chai = require("chai");

const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const {
  removeKeyWithPath,
  optionalAndRequiredKeys,
  isSubsetOf,
  removeSubsets
} = require("../object");

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

  describe("optionalAndRequiredKeys", () => {
    describe("When called with an empty object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = {
          type: "object"
        };

        expectedObj = [[], []];
      });

      it("should return an empty set of required fields and a set of optional ones", () =>
        expect(optionalAndRequiredKeys(obj)).deep.equal(expectedObj));
    });

    describe("When called with object without required fields", () => {
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

        expectedObj = [[], ["id", "text"]];
      });

      it("should return an empty set of required fields and a set of optional ones", () =>
        expect(optionalAndRequiredKeys(obj)).deep.equal(expectedObj));
    });

    describe("When called with object required fields", () => {
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
          },
          required: ["text"]
        };

        expectedObj = [["text"], ["id"]];
      });

      it("should return an empty set of required fields and a set of optional ones", () =>
        expect(optionalAndRequiredKeys(obj)).deep.equal(expectedObj));
    });

    describe("When called with object with nested object", () => {
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
            },
            code: {
              type: "object",
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              },
              required: ["text"]
            }
          },
          required: ["text"]
        };

        expectedObj = [["text"], ["id", "code"]];
      });

      it("should return an empty set of required fields and a set of optional ones", () => {
        const result = optionalAndRequiredKeys(obj);
        return expect(result).deep.equal(expectedObj);
      });
    });

    describe("When called with object with a required string and enum", () => {
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
              type: "string",
              enum: ["value_1", "value_2"]
            }
          },
          required: ["text"]
        };

        expectedObj = [["text"], ["id"]];
      });

      it("should return an empty set of required fields and a set of optional ones", () => {
        const result = optionalAndRequiredKeys(obj);
        return expect(result).deep.equal(expectedObj);
      });
    });
  });

  describe("isSubsetOf", () => {
    describe("When string objects are evaluated", () => {
      describe("When one enum being a subset of the other", () => {
        let obj_1;
        let obj_2;

        beforeEach(() => {
          obj_2 = {
            type: "string",
            enum: ["this", "is", "a", "test"]
          };
          obj_1 = {
            type: "string",
            enum: ["a", "test"]
          };
        });

        it("should return true", () => expect(isSubsetOf(obj_1, obj_2)).to.be.true);
      });

      describe("When one with a greater minLength", () => {
        let obj_1;
        let obj_2;

        beforeEach(() => {
          obj_2 = {
            type: "string",
            minLength: 2
          };
          obj_1 = {
            type: "string",
            minLength: 10
          };
        });

        it("should return true", () => expect(isSubsetOf(obj_1, obj_2)).to.be.true);
      });

      describe("When one with a lower maxLength", () => {
        let obj_1;
        let obj_2;

        beforeEach(() => {
          obj_2 = {
            type: "string",
            maxLength: 10
          };
          obj_1 = {
            type: "string",
            maxLength: 2
          };
        });

        it("should return true", () => expect(isSubsetOf(obj_1, obj_2)).to.be.true);
      });

      describe("When one with a lower maxLength and a greater minLength", () => {
        let obj_1;
        let obj_2;

        beforeEach(() => {
          obj_2 = {
            type: "string",
            minLength: 2,
            maxLength: 10
          };
          obj_1 = {
            type: "string",
            maxLength: 5,
            minLength: 4
          };
        });

        it("should return true", () => expect(isSubsetOf(obj_1, obj_2)).to.be.true);
      });
    });

    describe("When empty object is subset of any object", () => {
      let obj_1;
      let obj_2;

      beforeEach(() => {
        obj_1 = {
          type: "object"
        };
        obj_2 = {
          type: "object",
          properties: {
            id: {
              type: "string"
            }
          }
        };
      });

      it("should return true", () => expect(isSubsetOf(obj_1, obj_2)).to.be.true);
    });

    describe("When reference objects are compared", () => {
      let obj_1;
      let obj_2;

      beforeEach(() => {
        obj_1 = {
          $ref: "test"
        };
        obj_2 = {
          $ref: "test"
        };
      });

      it("should return true", () => expect(isSubsetOf(obj_1, obj_2)).to.be.true);
    });

    describe("When identical objects are subset of each other", () => {
      let obj_1;
      let obj_2;

      beforeEach(() => {
        obj_1 = {
          type: "object",
          properties: {
            id: {
              type: "string"
            }
          }
        };
        obj_2 = {
          type: "object",
          properties: {
            id: {
              type: "string"
            }
          }
        };
      });

      it("should return true for one direction", () => expect(isSubsetOf(obj_1, obj_2)).to.be.true);

      it("should return true for the other", () => expect(isSubsetOf(obj_2, obj_1)).to.be.true);
    });

    describe("When two objects are not subset of each other", () => {
      let obj_1;
      let obj_2;

      beforeEach(() => {
        obj_1 = {
          type: "object",
          properties: {
            id: {
              type: "string"
            }
          }
        };
        obj_2 = {
          type: "object",
          properties: {
            code: {
              type: "string"
            }
          }
        };
      });

      it("should return false", () => expect(isSubsetOf(obj_1, obj_2)).to.be.false);
    });
  });

  describe("removeSubsets", () => {
    describe("When list with subset objects is given", () => {
      let obj;
      let expected;

      beforeEach(() => {
        obj = [
          {
            type: "string",
            enum: ["this", "is", "a", "test"]
          },
          {
            type: "string",
            enum: ["a", "test"]
          },
          {
            type: "object",
            properties: {
              id: {
                type: "string"
              }
            }
          }
        ];
        expected = [
          {
            type: "string",
            enum: ["this", "is", "a", "test"]
          },
          {
            type: "object",
            properties: {
              id: {
                type: "string"
              }
            }
          }
        ];
      });

      it("should return the list without subsets", () =>
        expect(removeSubsets(obj)).to.be.deep.equal(expected));
    });

    describe("When list with subset objects is given", () => {
      let obj;
      let expected;

      beforeEach(() => {
        obj = [
          {
            type: "string",
            enum: ["a", "test"]
          },
          {
            type: "object",
            properties: {
              id: {
                type: "string"
              }
            }
          },
          {
            type: "string",
            enum: ["this", "is", "a", "test"]
          }
        ];
        expected = [
          {
            type: "object",
            properties: {
              id: {
                type: "string"
              }
            }
          },
          {
            type: "string",
            enum: ["this", "is", "a", "test"]
          }
        ];
      });

      it("should return the list without subsets", () =>
        expect(removeSubsets(obj)).to.be.deep.equal(expected));
    });
  });
});
