const { retrievePrintedReference } = require("./reference");
const deepcopy = require("deepcopy");

const overlapping = (obj1, obj2, state, convert) => {
  const _obj1 = deepcopy(obj1);
  const _obj2 = deepcopy(obj2);
  const { type } = _obj1;
  if (type === "object") return diffObject(_obj1, _obj2, state, convert);
  if (_obj1.$ref || _obj1.$ref)
    return diffReference(_obj1, _obj2, state, convert);
  if (type === "string") return stringDiff(_obj1, _obj2, state, convert);

  return _obj1;
};

const diffReference = (r1, r2, state, convert) => {
  const fn = (obj) =>
    convert(retrievePrintedReference(obj, state.components), state);
  return overlapping(
    r1.$ref ? fn(r1) : r1,
    r2.$ref ? fn(r2) : r2,
    state,
    convert
  );
};

const diffObject = (obj1, obj2, state, convert) => {
  const [properties, required] = Object.entries(obj2.properties || {}).reduce(
    ([acc, req], [k, v]) => {
      const propertyKey = acc[k];
      if (propertyKey) {
        const child = overlapping(propertyKey, v, state, convert);
        const _req = req && !child ? req.diff([k]) : req;
        delete acc[k];
        return child
          ? [
              {
                ...acc,
                [k]: child,
              },
              req,
            ]
          : [acc, _req];
      }

      return [acc, req];
    },
    [obj1.properties, obj1.required]
  );
  return JSON.parse(JSON.stringify({ ...obj1, properties, required }));
};

const stringDiff = (obj1, obj2) => {
  if (!obj1.enum && !obj2.enum) return obj1;

  const remainingItems = obj1.enum.diff(obj2.enum || []);
  if (remainingItems.length == 0) {
    return obj1;
  }
  return { ...obj1, enum: remainingItems };
};

module.exports = { overlapping };
