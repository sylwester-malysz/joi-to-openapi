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

const processCondition = (condition, ref, is, key, state, convert) => {
  if (condition) {
    const obj = condition["$ref"]
      ? convert(retrievePrintedReference(condition, state.components), state)
      : condition;

    let spec = {
      [ref]: is,
      [key]: obj
    };

    if (condition.required) {
      delete condition.required;
      spec = { ...spec, required: [key] };
    }

    return spec;
  }

  return undefined;
};

const createAlternative = (cond, obj, key) => {
  let condTmp = cond;
  if (!condTmp) {
    condTmp = { [key]: obj };
  }
  return condTmp;
};

const processOption = (opts, objChildren, state, convert) => {
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
        switch (is.type) {
          case "string": {
            referenceObj.enum = referenceObj.enum.diff(is.enum);
            const thennable = processCondition(
              option.then,
              nameReference,
              is,
              opts.key,
              state,
              convert
            );
            const notId = {
              ...is,
              enum: referenceObj.enum.diff(is.enum)
            };
            const otherwise = processCondition(
              option.otherwise,
              nameReference,
              notId,
              opts.key,
              state,
              convert
            );

            if (!thennable && !otherwise)
              throw `No then/otherwise condtions found on "${
                opts.key
              }" definition`;

            return acc
              .addIfDefined(createAlternative(thennable, is, nameReference))
              .addIfDefined(createAlternative(otherwise, notId, nameReference));
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
      oneOf: opts.reduce((acc, opts) => {
        return processOption(opts, obj, state, convert, acc);
      }, [])
    };
  }

  return obj;
};

module.exports = parser;
