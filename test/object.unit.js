const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("@hapi/joi");
const joiToOpenapi = require("../index");

describe("Joi Object to OpenAPI", () => {
  beforeEach(() => {});

  describe("When an object is given with strings keys", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          code: Joi.string(),
          text: Joi.string(),
        })
        .and("code", "text");
      expectedObj = {
        type: "object",
        properties: {
          code: {
            type: "string",
          },
          text: {
            type: "string",
          },
        },
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
        date: Joi.alternatives(
          Joi.string()
            .allow("")
            .allow(null),
          Joi.object().unknown()
        ),
        sequence: Joi.number().integer(),
        duration: Joi.when("method", {
          is: "in",
          then: Joi.number()
            .integer()
            .required(),
          otherwise: Joi.forbidden(),
        }),
        method: Joi.string()
          .valid("in")
          .optional(),
      });
      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              digit: {
                type: "string",
                pattern: "^([abcdABCD0-9*#pP])+$",
              },
              date: {
                oneOf: [
                  {
                    type: "string",
                    nullable: true,
                  },
                  {
                    type: "object",
                  },
                ],
              },
              sequence: {
                type: "integer",
              },
              duration: {
                type: "integer",
              },
              method: {
                type: "string",
                enum: ["in"],
              },
            },
            required: ["method", "duration"],
          },
          {
            type: "object",
            properties: {
              digit: {
                type: "string",
                pattern: "^([abcdABCD0-9*#pP])+$",
              },
              date: {
                oneOf: [
                  {
                    type: "string",
                    nullable: true,
                  },
                  {
                    type: "object",
                  },
                ],
              },
              sequence: {
                type: "integer",
              },
            },
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object with multiple conditional with same value and reference is given", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object().keys({
        body: Joi.object().keys({
          stream: Joi.string()
            .valid(["inbound", "outbound"])
            .required(),
        }),
        sender: Joi.when(Joi.ref("body.stream"), {
          is: "outbound",
          then: Joi.string(),
          otherwise: Joi.any().forbidden(),
        }),
        receiver: Joi.when(Joi.ref("body.stream"), {
          is: "outbound",
          then: Joi.string().required(),
          otherwise: Joi.any().forbidden(),
        }),
        timestamp: Joi.string()
          .allow("")
          .required(),
      });
      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              body: {
                type: "object",
                properties: {
                  stream: {
                    type: "string",
                    enum: ["outbound"],
                  },
                },
                required: ["stream"],
              },
              sender: {
                type: "string",
              },
              receiver: {
                type: "string",
              },
              timestamp: {
                type: "string",
              },
            },
            required: ["timestamp", "receiver"],
          },
          {
            type: "object",
            properties: {
              body: {
                type: "object",
                properties: {
                  stream: {
                    type: "string",
                    enum: ["inbound"],
                  },
                },
                required: ["stream"],
              },
              timestamp: {
                type: "string",
              },
            },
            required: ["timestamp"],
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object with string is optional or required basing on existence", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          identifier: Joi.string()
            .allow(null)
            .optional(),
          name: Joi.string()
            .allow(null)
            .optional(),
          channel: Joi.string().when("user", {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required(),
          }),
          action: Joi.string()
            .valid(["create", "delete"])
            .required(),
          user: Joi.string().optional(),
        })
        .or("user_id", "user_name")
        .unknown();
      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                nullable: true,
              },
              name: {
                type: "string",
                nullable: true,
              },
              channel: {
                type: "string",
              },
              action: {
                type: "string",
                enum: ["create", "delete"],
              },
              user: {
                type: "string",
              },
            },
            required: ["user", "action"],
          },
          {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                nullable: true,
              },
              name: {
                type: "string",
                nullable: true,
              },
              channel: {
                type: "string",
              },
              action: {
                type: "string",
                enum: ["create", "delete"],
              },
            },
            required: ["action", "channel"],
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
  });

  describe("When an object with string is forbidden or required basing on existence", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object()
        .keys({
          identifier: Joi.string()
            .allow(null)
            .optional(),
          name: Joi.string()
            .allow(null)
            .optional(),
          channel: Joi.string().when("transition", {
            is: "up",
            then: Joi.forbidden(),
            otherwise: Joi.required(),
          }),
          action: Joi.string()
            .valid(["create", "delete"])
            .required(),
          transition: Joi.string()
            .valid(["up", "down"])
            .required(),
        })
        .or("user_id", "user_name")
        .unknown();
      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                nullable: true,
              },
              name: {
                type: "string",
                nullable: true,
              },
              action: {
                type: "string",
                enum: ["create", "delete"],
              },
              transition: {
                type: "string",
                enum: ["up"],
              },
            },
            required: ["action", "transition"],
          },
          {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                nullable: true,
              },
              name: {
                type: "string",
                nullable: true,
              },
              channel: {
                type: "string",
              },
              action: {
                type: "string",
                enum: ["create", "delete"],
              },
              transition: {
                type: "string",
                enum: ["down"],
              },
            },
            required: ["action", "transition", "channel"],
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () =>
      expect(convert(obj)).deep.equal(expectedObj));
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
            then: Joi.alternatives()
              .try(Joi.string(), Joi.number())
              .required(),
            otherwise: Joi.string().required(),
          }),
        }),
      });

      expectedObjUpperScope = {
        oneOf: [
          {
            type: "object",
            properties: {
              someKey: {
                type: "string",
                nullable: true,
              },
              sequence: {
                type: "string",
              },
              embeed: {
                type: "object",
                properties: {
                  struct: {
                    oneOf: [
                      { type: "string" },
                      { type: "number", format: "float" },
                    ],
                  },
                },
                required: ["struct"],
              },
            },
            required: ["someKey"],
          },
          {
            type: "object",
            properties: {
              sequence: {
                type: "string",
              },
              embeed: {
                type: "object",
                properties: {
                  struct: { type: "string" },
                },
                required: ["struct"],
              },
            },
          },
        ],
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
            fame: Joi.string().valid(["famous", "vip"]),
          })
          .required(),
        status: Joi.string()
          .valid(["available", "busy"])
          .insensitive()
          .required(),
      }).when(
        Joi.object()
          .keys({
            status: Joi.string()
              .valid(["busy"])
              .required(),
          })
          .unknown(),
        {
          otherwise: Joi.object().keys({
            reason: Joi.any().forbidden(),
          }),
          then: Joi.object().keys({
            reason: Joi.object()
              .keys({
                txt: Joi.string(),
              })
              .required(),
          }),
        }
      );

      expectedObjUpperScope = {
        oneOf: [
          {
            type: "object",
            properties: {
              someObject: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  fame: {
                    type: "string",
                    enum: ["famous", "vip"],
                  },
                },
              },
              status: {
                type: "string",
                enum: ["busy"],
              },
              reason: {
                type: "object",
                properties: {
                  txt: {
                    type: "string",
                  },
                },
              },
            },
            required: ["someObject", "status", "reason"],
          },
          {
            type: "object",
            properties: {
              someObject: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  fame: {
                    type: "string",
                    enum: ["famous", "vip"],
                  },
                },
              },
              status: {
                type: "string",
                enum: ["available"],
              },
            },
            required: ["someObject", "status"],
          },
        ],
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
            then: Joi.alternatives()
              .try(Joi.string(), Joi.number())
              .required(),
            otherwise: Joi.forbidden(),
          }),
        }),
      });

      expectedObjUpperScope = {
        type: "object",
        properties: {
          sequence: {
            type: "string",
          },
          embeed: {
            type: "object",
            properties: {},
          },
        },
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
            then: Joi.alternatives()
              .try(Joi.string(), Joi.number())
              .required(),
            otherwise: Joi.forbidden(),
          }),
        }),
      });

      expectedObjUpperScope = {
        type: "object",
        properties: {
          sequence: {
            type: "string",
          },
          embeed: {
            type: "object",
            properties: {
              struct: {
                oneOf: [
                  { type: "string" },
                  { type: "number", format: "float" },
                ],
              },
            },
            required: ["struct"],
          },
        },
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
            then: Joi.alternatives()
              .try(Joi.string(), Joi.number())
              .required(),
            otherwise: Joi.forbidden(),
          }),
        }),
      });

      expectedObjUpperScope = {
        type: "object",
        properties: {
          sequence: {
            type: "string",
            nullable: true,
          },
          embeed: {
            type: "object",
            properties: {
              struct: {
                oneOf: [
                  { type: "string" },
                  { type: "number", format: "float" },
                ],
              },
            },
            required: ["struct"],
          },
        },
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObjUpperScope);
    });
  });

  describe("When .when is applied to a field which doesn't exist - nullable is propagated", () => {
    let obj;
    let expectedObj;

    beforeEach(() => {
      obj = Joi.object({
        someKey: Joi.string().allow(null),
        sequence: Joi.string(),
        embeed: Joi.object({
          struct: Joi.when(Joi.ref("someKey"), {
            is: Joi.exist(),
            then: Joi.alternatives()
              .try(Joi.string(), Joi.number())
              .required(),
            otherwise: Joi.optional(),
          }),
        }).required(),
      });

      expectedObj = {
        oneOf: [
          {
            type: "object",
            properties: {
              someKey: {
                type: "string",
                nullable: true,
              },
              sequence: {
                type: "string",
              },
              embeed: {
                type: "object",
                properties: {
                  struct: {
                    oneOf: [
                      { type: "string" },
                      { type: "number", format: "float" },
                    ],
                  },
                },
                required: ["struct"],
              },
            },
            required: ["someKey", "embeed"],
          },
          {
            type: "object",
            properties: {
              sequence: {
                type: "string",
              },
              embeed: {
                type: "object",
                properties: {
                  struct: {
                    oneOf: [
                      { type: "array" },
                      { type: "boolean" },
                      { type: "number" },
                      { type: "object" },
                      { type: "string" },
                    ],
                  },
                },
              },
            },
            required: ["embeed"],
          },
        ],
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(obj);
      expect(converted).deep.equal(expectedObj);
    });
  });
});
