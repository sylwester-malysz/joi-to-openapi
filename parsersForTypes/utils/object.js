const deepcopy = require("deepcopy");
const { retrievePrintedReference } = require("./reference");

const removeKeyFromObjectWithPath = (path, obj, state) => {
  if (!obj) return undefined;
  if (obj.type !== "object")
    throw new Error("Cannot remove key from an object with type different from `object`");
  const [key, ...keys] = path;
  if (!key) return obj;

  let _obj = deepcopy(obj);

  if (_obj?.$ref) _obj = retrievePrintedReference(_obj, state.components);
  if (keys.length === 0 && _obj.properties[key]) {
    delete _obj.properties[key];
    return _obj;
  }

  const nesting = removeKeyFromObjectWithPath(keys, _obj.properties[key], state);

  return {
    type: "object",
    properties: {
      ..._obj.properties,
      ...(nesting && { [key]: nesting })
    }
  };
};

module.exports = { removeKeyFromObjectWithPath };
