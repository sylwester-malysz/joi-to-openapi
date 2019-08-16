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

Array.prototype.addIfDefined = function(lst) {
  if (lst) return [...this, lst];
  return this;
};

const getProperty = (refName, properties) => {
  const refList = refName.split(".");
  return refList.reduce(
    (obj, key) => {
      let r = obj[key];
      if (r.type === "object") return r.properties;
      return r;
    },
    { ...properties }
  );
};

const accumulateConditions = (acc, cond, is, convert, state) => {
  if (cond.opt) {
    const obj = cond.opt["$ref"]
      ? convert(retrievePrintedReference(cond.opt, state.components), state)
      : cond.opt;

    let newAcc = { ...acc, [cond.key]: obj };
    if (cond.opt.required)
      newAcc.required = [...(newAcc.required || []), cond.key];
    delete cond.opt.required;
    return newAcc;
  }
  return acc;
};

const replaceKeyWithObject = (keys, store, obj) => {
  const [currentKey, ...remainingKeys] = keys;
  if (!currentKey) return obj;
  if (!store[currentKey]) return store;

  if (store.type === "object") {
    return {
      ...store,
      properties: {
        ...store.properties,
        [currentKey]: replaceKeyWithObject(
          remainingKeys,
          store[currentKey],
          obj
        )
      }
    };
  }
  return {
    ...store,
    [currentKey]: replaceKeyWithObject(remainingKeys, store[currentKey], obj)
  };
};

const processOption = (opts, objChildren, state, convert) => {
  const generateAlternatives = (acc, [referenceName, data]) => {
    const referenceObj = data.reference;

    const refPath = { name: referenceName, path: referenceName.split(".") };

    return Object.entries(data.alternatives).reduce((acc, [_, conditions]) => {
      const is = conditions.is;
      const f = (acc, cond) =>
        accumulateConditions(acc, cond, is, convert, state);
      const thennable = (conditions.options.thennable || []).reduce(f, {
        [referenceName]: is
      });

      const alternativeEnum = referenceObj.enum.diff(is.enum);
      const alternativeIs =
        alternativeEnum.length > 0
          ? {
              [referenceName]: { ...is, enum: referenceObj.enum.diff(is.enum) }
            }
          : {};

      const otherwise = (conditions.options.otherwise || []).reduce(
        f,
        alternativeIs
      );

      return [
        ...acc,
        { refPath, option: thennable },
        { refPath, option: otherwise }
      ];
    }, acc);
  };
  return Object.entries(opts)
    .reduce(
      (acc, [referenceName, data]) =>
        generateAlternatives(acc, [referenceName, data]),
      []
    )
    .map(({ refPath: { name, path }, option }) => {
      let required = objChildren.required;
      if (option.required) {
        required = option.required.union(objChildren.required || []);
        delete option.required;
      }

      const objPath = option[name];
      delete option[name];
      return {
        properties: {
          ...JSON.parse(
            JSON.stringify(
              replaceKeyWithObject(path, objChildren.properties, objPath)
            )
          ),
          ...option
        },
        required
      };
    });
};

const retrieveReference = (nameReference, objChildren, state, convert) => {
  const referenceObjJoi = retrievePrintedReference(
    getProperty(nameReference, objChildren.properties),
    state.components
  );
  return referenceObjJoi
    ? convert(referenceObjJoi, state)
    : objChildren.properties[nameReference];
};

const joinOption = (option, opt, key) => {
  option.thennable = [...(option.thennable || []), { key: key, opt: opt.then }];
  option.otherwise = [
    ...(option.otherwise || []),
    { key: key, opt: opt.otherwise }
  ];
  return option;
};

const groupByOptions = (opts, objChildren, state, convert) =>
  opts.reduce((store, opt) => {
    return opt.options.reduce((store, option) => {
      const storeKey = option.is.enum.join(".");
      const reference = option["ref"];
      const referenceContainer = store[reference] || {
        reference: retrieveReference(reference, objChildren, state, convert),
        alternatives: {}
      };
      const enumContainer = referenceContainer.alternatives[storeKey] || {
        is: option.is,
        options: {}
      };

      return {
        ...store,
        [reference]: {
          ...referenceContainer,
          alternatives: {
            ...referenceContainer.referenceContainer,
            [storeKey]: {
              ...enumContainer,
              options: joinOption(enumContainer.options, option, opt.key)
            }
          }
        }
      };
    }, store);
  }, {});

const parser = (joiSchema, state, convert) => {
  const child = getChild(joiSchema._inner.children, state, convert);
  const requiredFields = getRequiredFields(joiSchema._inner.children);

  const obj = Object.assign({ type: "object" }, child, requiredFields);
  if (child && child.properties.optOf) {
    const opts = child.properties.optOf;
    delete obj.properties.optOf;

    return {
      type: "object",
      oneOf: processOption(
        groupByOptions(opts, obj, state, convert),
        obj,
        state,
        convert
      )
    };
  }

  return obj;
};

module.exports = parser;
