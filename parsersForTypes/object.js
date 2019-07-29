const { retrievePrintedReference } = require("./utils");

const getChild = (child, state, convert) => {
  if (!child) {
    return null;
  }
  const properties = {};
  for (const children of child) {
    let convertedChild = convert(children.schema, state);
    if (convertedChild.optOf) {
      properties.optOf = [
        ...(properties.optOf || []),
        { options: convertedChild.optOf, key: children.key }
      ];
    } else properties[children.key] = convertedChild;
  }
  return { properties };
};

const getRequiredFields = child => {
  if (!child) {
    return null;
  }
  const required = [];
  for (const children of child) {
    if (children.schema._flags.presence === "required") {
      required.push(children.key);
    }
  }
  return required.length ? { required } : null;
};

const getReferenceSchema = (ref, component) => {};

/** 
 * 
 * "optOf": [
  {
      "options": [
          {
              "is": {
                  "type": "string",
                  "enum": [
                      "websocket"
                  ]
              },
              "then": {
                  "type": "string",
                  "required": true
              },
              "ref": "type"
          }
      ],
      "key": "content-type"
  }
]
 * 
* "channel_type": {
      "type": "string",
      "enum": [
          "app",
          "phone",
          "sip",
          "websocket"
      ]
  }
 * 
 * 
 * {
    "options": [{
        "is": {
            "type": "string",
            "enum": ["websocket"]
        },
        "then": {
            "type": "string",
            "required": true
        },
        "ref": "type"
    }],
    "key": "content-type"
}

[
  {
    "type" : "object",
    "properties" : {
        "type" : {
          "type" : "string"
          "enum": ["websocket"]
        }
        "content-type" : {
          "type" : "string"
        }
    },
    required : ["content-type"]
  },
  {
    "type" : "object",
    "properties" : {
        "type" : {
          "type" : "string"
          "enum": [
              "app",
              "phone",
              "sip"
          ]
        }
    }
  }
]


*/

Array.prototype.diff = function(lst) {
  const itemsVisited = lst.reduce((acc, item) => ((acc[item] = true), acc), {});
  return this.reduce((acc, item) => {
    if (!itemsVisited[item]) {
      return [...acc, item];
    }
    return acc;
  }, []);
};

Array.prototype.union = function(lst) {
  const itemsVisited = this.reduce(
    (acc, item) => ((acc[item] = true), acc),
    {}
  );
  return lst.reduce((acc, item) => {
    if (!itemsVisited[item]) {
      return [...acc, item];
    }
    return acc;
  }, this);
};

const processOption = (opts, objChildren, state, convert, store) => {
  return opts.options
    .reduce((acc, option) => {
      const nameReference = option["ref"];
      const referenceObjJoi = retrievePrintedReference(
        objChildren.properties[nameReference],
        state.components
      );
      const referenceObj = referenceObjJoi
        ? convert(referenceObjJoi, state)
        : objChildren.properties[nameReference];
      const is = option.is;

      if (is.type === referenceObj.type) {
        if (!option.then.required) return [...acc, referenceObj];
        switch (is.type) {
          case "string": {
            delete option.then.required;
            referenceObj.enum = referenceObj.enum.diff(is.enum);
            return [
              ...acc,
              { [nameReference]: referenceObj },
              {
                [nameReference]: is,
                [opts.key]: option.then,
                required: [opts.key]
              }
            ];
          }
          default:
            break;
        }
      }

      return acc;
    }, [])
    .map(option => {
      let required = objChildren.required;
      if (option.required) {
        required = option.required.union(objChildren.required || []);
        delete option.required;
      }

      return {
        properties: { ...objChildren.properties, ...option },
        required
      };
    });
};

const parser = (joiSchema, state, convert) => {
  const child = getChild(joiSchema._inner.children, state, convert);
  const requiredFields = getRequiredFields(joiSchema._inner.children);

  const obj = Object.assign({ type: "object" }, child, requiredFields);
  if (child && child.properties.optOf) {
    const opts = child.properties.optOf;
    delete obj.properties.optOf;
    return {
      type: "object",
      oneOf: opts.reduce(
        (acc, opts) => processOption(opts, obj, state, convert, acc),
        []
      )
    };
  }

  return obj;
};

module.exports = parser;
