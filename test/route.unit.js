const chai = require("chai");

const { expect } = chai;

const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const { convert } = require("../index");

chai.use(chaiAsPromised);
chai.use(sinonChai);

const Joi = require("joi")
  .extend((joi) => ({
    base: joi.any(),
    type: "reference",
    messages: {
      "reference.use": "{{#q}}",
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
        validate(value, helpers, args, options) {},
      },
    },
  }))
  .extend((joi) => ({
    type: "route",
    base: joi.object(),
    messages: {
      "route.components": "{{#q}}",
      "route.paths": "{{#q}}",
    },
    coerce() {},
    validate() {},
    rules: {
      components: {
        convert: true,
        method(components) {
          return this.$_addRule({
            name: "components",
          }).$_setFlag("components", { ...components });
        },
        args: [],
        validate() {},
      },
      paths: {
        convert: true,
        method(paths) {
          return this.$_addRule({ name: "paths" }).$_setFlag("routing", {
            paths,
          });
        },
        args: [],
        validate() {},
      },
    },
  }));

describe("Joi Route to OpenAPI", () => {
  beforeEach(() => {});

  describe("When route extension is used", () => {
    let routing;
    let expectedObj;

    beforeEach(() => {
      schema = (joi) => ({
        schemas: {
          token: joi.string().max(40),
        },
        parameters: {
          user_name: {
            name: "user_name",
            in: "path",
            schema: joi.string().required(),
          },
        },
        responses: {
          user: {
            "application/json": joi
              .object()
              .keys({ name: joi.string().required() }),
          },
        },
        requestBodies: {
          user: {
            "application/json": joi.object().keys({
              name: joi.string().required(),
              token: joi
                .reference()
                .use("schemas:token")
                .optional(),
            }),
          },
        },
      });

      buildPath = (joi) => ({
        "/session": [
          {
            method: "POST",
            versions: ["0.0.1"],
            handler: {
              responses: {
                201: {
                  "application/json": joi.object().keys({
                    token: joi.string().required(),
                  }),
                },
              },
              params: [],
              requestBody: {
                "application/json": joi.object().keys({
                  username: joi.string().required(),
                  password: joi.string().required(),
                }),
              },
            },
          },
        ],
        "/user/:user_name": [
          {
            method: "GET",
            versions: ["0.0.1"],
            handler: {
              responses: {
                200: joi
                  .reference()
                  .use("responses:user")
                  .required(),
              },
              params: [
                joi
                  .reference()
                  .use("parameters:user_name")
                  .required(),
              ],
              requestBody: {},
            },
          },
          {
            method: "POST",
            versions: ["0.0.1"],
            handler: {
              responses: {
                200: joi.reference().use("responses:user"),
              },
              params: [joi.reference().use("parameters:user_name")],
              requestBody: joi.reference().use("requestBodies:user"),
            },
          },
        ],
      });
      routing = Joi.route()
        .paths(buildPath(Joi))
        .components(schema(Joi));
      expectedObj = {
        "0.0.1": {
          openapi: "3.0.0",
          servers: [],
          info: {
            version: "0.0.1",
            title: "",
            description: "",
            contact: {
              name: "your name",
              url: "http://your.contact.com",
              email: "youremail@email.com",
            },
          },
          paths: {
            "/session": {
              post: {
                parameters: [],
                responses: {
                  201: {
                    description: "",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            token: {
                              type: "string",
                            },
                          },
                          required: ["token"],
                        },
                      },
                    },
                  },
                },
                requestBody: {
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          username: {
                            type: "string",
                          },
                          password: {
                            type: "string",
                          },
                        },
                        required: ["username", "password"],
                      },
                    },
                  },
                },
              },
            },
            "/user/{user_name}": {
              get: {
                parameters: [
                  {
                    $ref: "#/components/parameters/user_name",
                  },
                ],
                responses: {
                  200: {
                    $ref: "#/components/responses/user",
                  },
                },
              },
              post: {
                parameters: [
                  {
                    $ref: "#/components/parameters/user_name",
                  },
                ],
                responses: {
                  200: {
                    $ref: "#/components/responses/user",
                  },
                },
                requestBody: {
                  $ref: "#/components/requestBodies/user",
                },
              },
            },
          },
          components: {
            schemas: {
              token: {
                type: "string",
                maxLength: 40,
              },
            },
            parameters: {
              user_name: {
                name: "user_name",
                in: "path",
                schema: {
                  type: "string",
                },
                required: true,
              },
            },
            responses: {
              user: {
                description: "",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                        },
                      },
                      required: ["name"],
                    },
                  },
                },
              },
            },
            requestBodies: {
              user: {
                description: "",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                        },
                        token: {
                          $ref: "#/components/schemas/token",
                        },
                      },
                      required: ["name"],
                    },
                  },
                },
              },
            },
          },
        },
      };
    });

    it("should convert the object in the proper open-api", () => {
      const converted = convert(routing);
      expect(converted).deep.equal(expectedObj);
    });
  });
});
