const chai = require("chai");

const { expect } = chai;
const Joi = require("joi").extend(joi => ({
  base: joi.any(),
  type: "reference",
  messages: {
    "reference.use": "{{#q}}"
  },
  coerce() {},
  validate() {},
  rules: {
    use: {
      multi: true,
      method(ref) {
        return this.$_addRule({ name: "use" }).$_setFlag("_ref", ref);
      },
      args: [],
      // eslint-disable-next-line no-unused-vars
      validate(value, helpers, args, options) {}
    }
  }
}));
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Joi Object to OpenAPI", () => {
  beforeEach(() => {});

  describe("When simple object is used", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object();
      expectedObj = {
        type: "object",
        additionalProperties: true
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When object with empty set of keys", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object().keys({});
      expectedObj = {
        type: "object",
        properties: {},
        additionalProperties: false
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When pattern is applied to the object", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object().pattern(Joi.string(), Joi.any());
      expectedObj = {
        type: "object",
        additionalProperties: true
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When unknown is applied to the object", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          code: Joi.string().valid("500", "300", "200"),
          text: Joi.string()
        })
        .unknown();
      expectedObj = {
        type: "object",
        additionalProperties: true,
        properties: {
          code: {
            type: "string",
            enum: ["500", "300", "200"]
          },
          text: {
            type: "string"
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When xor and nand are applied to the object", () => {
    describe("When is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .xor("code", "text")
          .nand("code", "id");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              },
              required: ["text"]
            },
            {
              type: "object",
              properties: { id: { type: "string" } },
              additionalProperties: false
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                code: {
                  type: "string"
                }
              },
              required: ["code"]
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });
  });

  describe("When xor is applied to the object", () => {
    describe("When is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .xor("code", "text");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              },
              required: ["text"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                code: {
                  type: "string"
                }
              },
              required: ["code"]
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When sequence of xors with shared key is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .xor("code", "text")
          .xor("code", "id");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              },
              required: ["id", "text"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                code: {
                  type: "string"
                }
              },
              required: ["code"]
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When sequence of xors with shared key is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .xor("code", "text", "id");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                }
              },
              required: ["id"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                text: {
                  type: "string"
                }
              },
              required: ["text"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                code: {
                  type: "string"
                }
              },
              required: ["code"]
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When sequence of xors with indipendent key is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            name: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .xor("code", "text")
          .xor("name", "id");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              },
              required: ["id", "text"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                name: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              },
              required: ["name", "text"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                code: {
                  type: "string"
                }
              },
              required: ["id", "code"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                name: {
                  type: "string"
                },
                code: {
                  type: "string"
                }
              },
              required: ["name", "code"]
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When nested path is provided", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.object().keys({
              patch: Joi.string()
            }),
            text: Joi.string()
          })
          .xor("code.patch", "text");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                },
                code: {
                  additionalProperties: false,
                  type: "object"
                }
              },
              required: ["text"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                code: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    patch: {
                      type: "string"
                    }
                  },
                  required: ["patch"]
                }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When nested path with custom separator is provided", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.object().keys({
              patch: Joi.string()
            }),
            text: Joi.string()
          })
          .xor("code,patch", "text", { separator: "," });

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                },
                code: {
                  type: "object",
                  additionalProperties: false
                }
              },
              required: ["text"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                code: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    patch: {
                      type: "string"
                    }
                  },
                  required: ["patch"]
                }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When xor is applied to an object with one conditional", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            digit: Joi.string().regex(/^([abcdABCD0-9*#pP])+$/),
            date: Joi.alternatives(Joi.string().allow("").allow(null), Joi.object().unknown()),
            sequence: Joi.number().integer(),
            duration: Joi.when("method", {
              is: "in",
              then: Joi.number().integer().required(),
              otherwise: Joi.forbidden()
            }),
            method: Joi.string().valid("in").optional()
          })
          .xor("digit", "sequence");
        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      type: "object",
                      additionalProperties: true
                    }
                  ]
                },
                sequence: {
                  type: "integer"
                },
                duration: {
                  type: "integer"
                },
                method: {
                  type: "string",
                  enum: ["in"]
                }
              },
              required: ["sequence", "method", "duration"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                digit: {
                  type: "string",
                  pattern: "^([abcdABCD0-9*#pP])+$"
                },
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      type: "object",
                      additionalProperties: true
                    }
                  ]
                },
                duration: {
                  type: "integer"
                },
                method: {
                  type: "string",
                  enum: ["in"]
                }
              },
              required: ["digit", "method", "duration"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      type: "object",
                      additionalProperties: true
                    }
                  ]
                },
                sequence: {
                  type: "integer"
                }
              },
              required: ["sequence"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                digit: {
                  type: "string",
                  pattern: "^([abcdABCD0-9*#pP])+$"
                },
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      type: "object",
                      additionalProperties: true
                    }
                  ]
                }
              },
              required: ["digit"]
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () => {
        const converted = convert(obj);
        return expect(converted).deep.equal(expectedObj);
      });
    });
  });

  describe("When nand is applied to the object", () => {
    describe("When is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .nand("code", "text");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
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
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                code: {
                  type: "string"
                }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When multiple peers are given", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            alpha: Joi.string(),
            code: Joi.string(),
            text: Joi.string(),
            name: Joi.string()
          })
          .nand("code", "text", "alpha")
          .nand("code", "name", "alpha");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                alpha: { type: "string" },
                text: { type: "string" },
                name: { type: "string" }
              }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: { alpha: { type: "string" }, code: { type: "string" } }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                code: { type: "string" },
                text: { type: "string" },
                name: { type: "string" }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When sequence of nands with shared key is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .nand("code", "text")
          .nand("code", "id");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
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
              additionalProperties: false,
              properties: {
                code: {
                  type: "string"
                }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When sequence of nands with indipendent key is applied to the object", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            name: Joi.string(),
            code: Joi.string(),
            text: Joi.string()
          })
          .nand("code", "text")
          .nand("name", "id");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
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
              additionalProperties: false,
              properties: {
                name: {
                  type: "string"
                },
                text: {
                  type: "string"
                }
              }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                code: {
                  type: "string"
                }
              }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                name: {
                  type: "string"
                },
                code: {
                  type: "string"
                }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When nested path is provided", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.object().keys({
              patch: Joi.string()
            }),
            text: Joi.string()
          })
          .nand("code.patch", "text");

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                },
                code: {
                  additionalProperties: false,
                  type: "object"
                }
              }
            },
            {
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
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When nand is applied to one required fields", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.object().keys({
              patch: Joi.string().required()
            }),
            text: Joi.string()
          })
          .nand("code.patch", "text");

        expectedObj = {
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
              },
              required: ["patch"]
            }
          }
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When nand is applied to all required fields", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.object().keys({
              patch: Joi.string().required()
            }),
            text: Joi.string().required()
          })
          .nand("code.patch", "text");

        expectedObj = {
          anyOf: []
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When nested path with custom separator is provided", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            id: Joi.string(),
            code: Joi.object().keys({
              patch: Joi.string()
            }),
            text: Joi.string()
          })
          .nand("code,patch", "text", { separator: "," });

        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                text: {
                  type: "string"
                },
                code: {
                  type: "object",
                  additionalProperties: false
                }
              }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                id: {
                  type: "string"
                },
                code: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    patch: {
                      type: "string"
                    }
                  }
                }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () =>
        expect(convert(obj)).deep.equal(expectedObj));
    });

    describe("When nand is applied to an object with one conditional", () => {
      let obj;
      let expectedObj;

      beforeEach(() => {
        obj = Joi.object()
          .keys({
            digit: Joi.string().regex(/^([abcdABCD0-9*#pP])+$/),
            date: Joi.alternatives(Joi.string().allow("").allow(null), Joi.object().unknown()),
            sequence: Joi.number().integer(),
            duration: Joi.when("method", {
              is: "in",
              then: Joi.number().integer().required(),
              otherwise: Joi.forbidden()
            }),
            method: Joi.string().valid("in").optional()
          })
          .nand("digit", "sequence");
        expectedObj = {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      additionalProperties: true,
                      type: "object"
                    }
                  ]
                },
                sequence: {
                  type: "integer"
                },
                duration: {
                  type: "integer"
                },
                method: {
                  type: "string",
                  enum: ["in"]
                }
              },
              required: ["method", "duration"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                digit: {
                  type: "string",
                  pattern: "^([abcdABCD0-9*#pP])+$"
                },
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      additionalProperties: true,
                      type: "object"
                    }
                  ]
                },
                duration: {
                  type: "integer"
                },
                method: {
                  type: "string",
                  enum: ["in"]
                }
              },
              required: ["method", "duration"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      additionalProperties: true,
                      type: "object"
                    }
                  ]
                },
                sequence: {
                  type: "integer"
                }
              }
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                digit: {
                  type: "string",
                  pattern: "^([abcdABCD0-9*#pP])+$"
                },
                date: {
                  anyOf: [
                    {
                      type: "string",
                      nullable: true
                    },
                    {
                      additionalProperties: true,
                      type: "object"
                    }
                  ]
                }
              }
            }
          ]
        };
      });

      it("should convert the object in the proper open-api", () => {
        const converted = convert(obj);
        return expect(converted).deep.equal(expectedObj);
      });
    });
  });

  describe("When an object is given with strings keys", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          code: Joi.string(),
          text: Joi.string()
        })
        .and("code", "text");
      expectedObj = {
        type: "object",
        additionalProperties: false,
        properties: {
          code: {
            type: "string"
          },
          text: {
            type: "string"
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object is given with strings keys with values", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          code: Joi.string().valid("500", "300", "200"),
          text: Joi.string()
        })
        .and("code", "text");
      expectedObj = {
        type: "object",
        additionalProperties: false,
        properties: {
          code: {
            type: "string",
            enum: ["500", "300", "200"]
          },
          text: {
            type: "string"
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object is given with strings keys and examples", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          code: Joi.string().valid("500", "300", "200"),
          text: Joi.string().example("This is a test")
        })
        .and("code", "text");
      expectedObj = {
        type: "object",
        additionalProperties: false,
        properties: {
          code: {
            type: "string",
            enum: ["500", "300", "200"]
          },
          text: {
            type: "string",
            example: "This is a test"
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object is given with strings keys and multiple examples", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          code: Joi.string().valid("500", "300", "200"),
          text: Joi.string().example("This is a test").example("Happy Joi")
        })
        .and("code", "text");
      expectedObj = {
        type: "object",
        additionalProperties: false,
        properties: {
          code: {
            type: "string",
            enum: ["500", "300", "200"]
          },
          text: {
            type: "string",
            examples: ["This is a test", "Happy Joi"]
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object with one conditional is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object().keys({
        digit: Joi.string().regex(/^([abcdABCD0-9*#pP])+$/),
        date: Joi.alternatives(Joi.string().allow("").allow(null), Joi.object().unknown()),
        sequence: Joi.number().integer(),
        duration: Joi.when("method", {
          is: "in",
          then: Joi.number().integer().required(),
          otherwise: Joi.forbidden()
        }),
        method: Joi.string().valid("in").optional()
      });
      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              digit: {
                type: "string",
                pattern: "^([abcdABCD0-9*#pP])+$"
              },
              date: {
                anyOf: [
                  {
                    type: "string",
                    nullable: true
                  },
                  {
                    additionalProperties: true,
                    type: "object"
                  }
                ]
              },
              sequence: {
                type: "integer"
              },
              duration: {
                type: "integer"
              },
              method: {
                type: "string",
                enum: ["in"]
              }
            },
            required: ["method", "duration"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              digit: {
                type: "string",
                pattern: "^([abcdABCD0-9*#pP])+$"
              },
              date: {
                anyOf: [
                  {
                    type: "string",
                    nullable: true
                  },
                  {
                    additionalProperties: true,
                    type: "object"
                  }
                ]
              },
              sequence: {
                type: "integer"
              }
            }
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      return expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When an object with multiple conditional with same value and reference is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object().keys({
        body: Joi.object().keys({
          stream: Joi.string().valid("inbound", "outbound").required()
        }),
        sender: Joi.when(Joi.ref("body.stream"), {
          is: "outbound",
          then: Joi.string(),
          otherwise: Joi.any().forbidden()
        }),
        receiver: Joi.when(Joi.ref("body.stream"), {
          is: "outbound",
          then: Joi.string().required(),
          otherwise: Joi.any().forbidden()
        }),
        timestamp: Joi.string().allow("").required()
      });
      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              body: {
                type: "object",
                additionalProperties: false,
                properties: {
                  stream: {
                    type: "string",
                    enum: ["outbound"]
                  }
                },
                required: ["stream"]
              },
              sender: {
                type: "string"
              },
              receiver: {
                type: "string"
              },
              timestamp: {
                type: "string"
              }
            },
            required: ["timestamp", "receiver"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              body: {
                type: "object",
                additionalProperties: false,
                properties: {
                  stream: {
                    type: "string",
                    enum: ["inbound"]
                  }
                },
                required: ["stream"]
              },
              timestamp: {
                type: "string"
              }
            },
            required: ["timestamp"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When an object with string is optional or required basing on existence", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          identifier: Joi.string().allow(null).optional(),
          name: Joi.string().allow(null).optional(),
          channel: Joi.string().valid("test", "on").when("user", {
            is: Joi.exist(),
            then: Joi.any(),
            otherwise: Joi.required()
          }),
          action: Joi.string().valid("create", "delete").required(),
          user: Joi.string().optional()
        })
        .or("user_id", "user_name")
        .unknown();
      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: true,
            properties: {
              identifier: {
                type: "string",
                nullable: true
              },
              name: {
                type: "string",
                nullable: true
              },
              channel: {
                type: "string",
                enum: ["test", "on"]
              },
              action: {
                type: "string",
                enum: ["create", "delete"]
              },
              user: {
                type: "string"
              }
            },
            required: ["user", "action"]
          },
          {
            type: "object",
            additionalProperties: true,
            properties: {
              identifier: {
                type: "string",
                nullable: true
              },
              name: {
                type: "string",
                nullable: true
              },
              channel: {
                type: "string",
                enum: ["test", "on"]
              },
              action: {
                type: "string",
                enum: ["create", "delete"]
              }
            },
            required: ["action", "channel"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      return expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When an object with string is forbidden or required basing on existence", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          identifier: Joi.string().allow(null).optional(),
          name: Joi.string().allow(null).optional(),
          channel: Joi.string().when("transition", {
            is: "up",
            then: Joi.forbidden(),
            otherwise: Joi.required()
          }),
          action: Joi.string().valid("create", "delete").required(),
          transition: Joi.string().valid("up", "down").required()
        })
        .or("user_id", "user_name")
        .unknown();
      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: true,
            properties: {
              identifier: {
                type: "string",
                nullable: true
              },
              name: {
                type: "string",
                nullable: true
              },
              action: {
                type: "string",
                enum: ["create", "delete"]
              },
              transition: {
                type: "string",
                enum: ["up"]
              }
            },
            required: ["action", "transition"]
          },
          {
            type: "object",
            additionalProperties: true,
            properties: {
              identifier: {
                type: "string",
                nullable: true
              },
              name: {
                type: "string",
                nullable: true
              },
              channel: {
                type: "string"
              },
              action: {
                type: "string",
                enum: ["create", "delete"]
              },
              transition: {
                type: "string",
                enum: ["down"]
              }
            },
            required: ["action", "transition", "channel"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When object has a reference which use a reference in the condition", () => {
    let obj;
    let expectedObj;
    let state;

    beforeEach(() => {
      obj = Joi.object({
        from: Joi.string().allow("").required(),
        identifier: Joi.when(Joi.ref("body.status"), {
          is: Joi.exist(),
          then: Joi.reference().use("schemas:1").allow("").optional(),
          otherwise: Joi.reference().use("schemas:1").allow("").required()
        }),
        body: Joi.object()
          .keys({
            status: Joi.reference().use("schemas:1").optional()
          })
          .required()
      });

      state = {
        components: {
          schemas: {
            1: Joi.reference().use("schemas:2"),
            2: Joi.string()
          }
        }
      };

      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: false,
                properties: {
                  status: {
                    type: "string"
                  }
                },
                required: ["status"]
              },
              identifier: {
                $ref: "#/components/schemas/1"
              }
            },
            required: ["from", "body"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: false,
                properties: {}
              },
              identifier: {
                $ref: "#/components/schemas/1"
              }
            },
            required: ["from", "body", "identifier"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj, state);
      return expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When .when is applied to an object which has a reference in an upper scope", () => {
    let obj;
    let expectedObjUpperScope;

    beforeEach(() => {
      obj = Joi.object({
        someKey: Joi.string().allow(null),
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.exist(),
            then: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            otherwise: Joi.string().required()
          })
        })
      });

      expectedObjUpperScope = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              someKey: {
                type: "string",
                nullable: true
              },
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: {
                    anyOf: [{ type: "string" }, { type: "number", format: "float" }]
                  }
                },
                required: ["struct"]
              }
            },
            required: ["someKey"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: { type: "string" }
                },
                required: ["struct"]
              }
            }
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObjUpperScope);
    });
  });

  // TODO - apply proper diff (in nested objects) when JOI object in .when is used
  describe("When .when is applied to an object", () => {
    let obj;
    let expectedObjUpperScope;

    beforeEach(() => {
      obj = Joi.object({
        someObject: Joi.object()
          .keys({
            name: Joi.string(),
            fame: Joi.string().valid("famous", "vip")
          })
          .required(),
        status: Joi.string().valid("available", "busy").insensitive().required()
      }).when(
        Joi.object()
          .keys({
            status: Joi.string().valid("busy").required()
          })
          .unknown(),
        {
          otherwise: Joi.object().keys({
            reason: Joi.any().forbidden()
          }),
          then: Joi.object().keys({
            reason: Joi.object()
              .keys({
                txt: Joi.string()
              })
              .required()
          })
        }
      );

      expectedObjUpperScope = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              someObject: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: {
                    type: "string"
                  },
                  fame: {
                    type: "string",
                    enum: ["famous", "vip"]
                  }
                }
              },
              status: {
                type: "string",
                enum: ["busy"]
              },
              reason: {
                type: "object",
                additionalProperties: false,
                properties: {
                  txt: {
                    type: "string"
                  }
                }
              }
            },
            required: ["someObject", "status", "reason"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              someObject: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: {
                    type: "string"
                  },
                  fame: {
                    type: "string",
                    enum: ["famous", "vip"]
                  }
                }
              },
              status: {
                type: "string",
                enum: ["available"]
              }
            },
            required: ["someObject", "status"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObjUpperScope);
    });
  });

  describe("When .when is applied to a field which doesn't exist and condition is exists", () => {
    let obj;
    let expectedObjUpperScope;

    beforeEach(() => {
      obj = Joi.object({
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.exist(),
            then: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            otherwise: Joi.forbidden()
          })
        })
      });

      expectedObjUpperScope = {
        type: "object",
        additionalProperties: false,
        properties: {
          sequence: {
            type: "string"
          },
          embeed: {
            type: "object",
            additionalProperties: false,
            properties: {}
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObjUpperScope);
    });
  });

  describe("When .when is applied to a field which doesn't exist and condition is forbidden", () => {
    let obj;
    let expectedObjUpperScope;

    beforeEach(() => {
      obj = Joi.object({
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.forbidden(),
            then: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            otherwise: Joi.forbidden()
          })
        })
      });

      expectedObjUpperScope = {
        type: "object",
        additionalProperties: false,
        properties: {
          sequence: {
            type: "string"
          },
          embeed: {
            type: "object",
            additionalProperties: false,
            properties: {
              struct: {
                anyOf: [{ type: "string" }, { type: "number", format: "float" }]
              }
            },
            required: ["struct"]
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObjUpperScope);
    });
  });

  describe("When .when is applied to a field which doesn't exist - nullable is propagated", () => {
    let obj;
    let expectedObjUpperScope;

    beforeEach(() => {
      obj = Joi.object({
        sequence: Joi.string().allow(null),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.forbidden(),
            then: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            otherwise: Joi.forbidden()
          })
        })
      });

      expectedObjUpperScope = {
        type: "object",
        additionalProperties: false,
        properties: {
          sequence: {
            type: "string",
            nullable: true
          },
          embeed: {
            type: "object",
            additionalProperties: false,
            properties: {
              struct: {
                anyOf: [{ type: "string" }, { type: "number", format: "float" }]
              }
            },
            required: ["struct"]
          }
        }
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObjUpperScope);
    });
  });

  describe("When .when is applied to a field which exists - nullable is propagated", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object({
        someKey: Joi.string().allow(null),
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.exist(),
            then: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            otherwise: Joi.optional()
          })
        }).required()
      });

      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              someKey: {
                type: "string",
                nullable: true
              },
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: {
                    anyOf: [{ type: "string" }, { type: "number", format: "float" }]
                  }
                },
                required: ["struct"]
              }
            },
            required: ["someKey", "embeed"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: {
                    oneOf: [
                      { type: "array" },
                      { type: "boolean" },
                      { type: "number" },
                      { type: "object", additionalProperties: true },
                      { type: "string" }
                    ]
                  }
                }
              }
            },
            required: ["embeed"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When .when is applied 'one' alternative", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object({
        someKey: Joi.string().allow(null),
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.exist(),
            then: Joi.alternatives().try(Joi.string(), Joi.number()).match("one").required(),
            otherwise: Joi.optional()
          })
        }).required()
      });

      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              someKey: {
                type: "string",
                nullable: true
              },
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: {
                    oneOf: [{ type: "string" }, { type: "number", format: "float" }]
                  }
                },
                required: ["struct"]
              }
            },
            required: ["someKey", "embeed"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: {
                    oneOf: [
                      { type: "array" },
                      { type: "boolean" },
                      { type: "number" },
                      { type: "object", additionalProperties: true },
                      { type: "string" }
                    ]
                  }
                }
              }
            },
            required: ["embeed"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When .when is applied 'all' alternative", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object({
        someKey: Joi.string().allow(null),
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.exist(),
            then: Joi.alternatives().try(Joi.string(), Joi.number()).match("all").required(),
            otherwise: Joi.optional()
          })
        }).required()
      });

      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              someKey: {
                type: "string",
                nullable: true
              },
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: {
                    allOf: [{ type: "string" }, { type: "number", format: "float" }]
                  }
                },
                required: ["struct"]
              }
            },
            required: ["someKey", "embeed"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              sequence: {
                type: "string"
              },
              embeed: {
                type: "object",
                additionalProperties: false,
                properties: {
                  struct: {
                    oneOf: [
                      { type: "array" },
                      { type: "boolean" },
                      { type: "number" },
                      { type: "object", additionalProperties: true },
                      { type: "string" }
                    ]
                  }
                }
              }
            },
            required: ["embeed"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When .when is applied to an object", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object({
        from: Joi.string().allow("").required(),
        timestamp: Joi.string().required(),
        identifier: Joi.string().required(),
        device_id: Joi.string().required(),
        body: Joi.object()
          .keys({
            status: Joi.string().valid("on", "off", "pause"),
            stream_direction: Joi.string().valid("in", "out").required()
          })
          .required()
      }).when(
        Joi.object({
          body: Joi.object({
            stream_direction: Joi.string().valid("in").required(),
            status: Joi.string().valid("pause").required()
          })
            .required()
            .unknown()
        }).unknown(),
        {
          then: Joi.object({
            identifier: Joi.string().optional(),
            device_id: Joi.string().optional()
          }),
          otherwise: Joi.object({
            identifier: Joi.string().required(),
            device_id: Joi.string().required()
          })
        }
      );

      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: false,
                properties: {
                  status: {
                    type: "string",
                    enum: ["pause"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["in"]
                  }
                },
                required: ["stream_direction", "status"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "body"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: false,
                properties: {
                  status: {
                    type: "string",
                    enum: ["on", "off", "pause"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["out"]
                  }
                },
                required: ["stream_direction"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "identifier", "device_id", "body"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: false,
                properties: {
                  status: {
                    type: "string",
                    enum: ["on", "off"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["in"]
                  }
                },
                required: ["stream_direction"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "identifier", "device_id", "body"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      return expect(converted).deep.equal(expectedObj);
    });
  });

  describe("When .when is applied to an object with unknown", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object({
        from: Joi.string().allow("").required(),
        timestamp: Joi.string().required(),
        identifier: Joi.string().required(),
        device_id: Joi.string().required(),
        body: Joi.object()
          .keys({
            status: Joi.string().valid("on", "off", "pause"),
            stream_direction: Joi.string().valid("in", "out").required()
          })
          .unknown()
          .required()
      }).when(
        Joi.object({
          body: Joi.object({
            stream_direction: Joi.string().valid("in").required(),
            status: Joi.string().valid("pause").required()
          })
            .required()
            .unknown()
        }).unknown(),
        {
          then: Joi.object({
            identifier: Joi.string().optional(),
            device_id: Joi.string().optional()
          }),
          otherwise: Joi.object({
            identifier: Joi.string().required(),
            device_id: Joi.string().required()
          })
        }
      );

      expectedObj = {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: true,
                properties: {
                  status: {
                    type: "string",
                    enum: ["pause"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["in"]
                  }
                },
                required: ["stream_direction", "status"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "body"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: true,
                properties: {
                  status: {
                    type: "string",
                    enum: ["on", "off", "pause"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["out"]
                  }
                },
                required: ["stream_direction"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "identifier", "device_id", "body"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              from: {
                type: "string"
              },
              timestamp: {
                type: "string"
              },
              body: {
                type: "object",
                additionalProperties: true,
                properties: {
                  status: {
                    type: "string",
                    enum: ["on", "off"]
                  },
                  stream_direction: {
                    type: "string",
                    enum: ["in"]
                  }
                },
                required: ["stream_direction"]
              },
              identifier: {
                type: "string"
              },
              device_id: {
                type: "string"
              }
            },
            required: ["from", "timestamp", "identifier", "device_id", "body"]
          }
        ]
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      return expect(converted).deep.equal(expectedObj);
    });
  });
});
