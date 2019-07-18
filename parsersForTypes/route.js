const joi = require("@hapi/joi");

const initIfUndefined = (obj, key, defaultValue) => {
  obj[key] = obj[key] || defaultValue;
  return obj[key];
};

const isRequired = obj => {
  return obj._flags.presence === "required" ? true : undefined;
};

const makeOpenApiParam = (item, convert, components = {}) => {
  let openApiParameter;
  if (item.isJoi && item._type == "ref") {
    const reference = item._flags._internal_ref || "";
    const [componentRef, itemRef] = reference.split(":");
    if (
      !componentRef ||
      !itemRef ||
      !components[componentRef] ||
      !components[componentRef][itemRef]
    )
      throw Error(
        `wrong reference ${reference}. Please make sure there exists a schema in the component`
      );
    openApiParameter = convert(item);
  } else {
    const name = item.name ? item.name : item.key;
    openApiParameter = {
      name,
      in: item.in,
      schema: convert(item.schema),
      required: isRequired(item.schema)
    };
  }
  return openApiParameter;
};

const convertParamsFromPath = (params, convert, components) => {
  let parameters = (params || []).map(item => {
    return makeOpenApiParam(item, convert, components);
  });
  return parameters;
};

const convertParamsFromComponents = (params, convert) => {
  let parameters = Object.keys(params || {}).reduce((acc, key) => {
    return { ...acc, [key]: makeOpenApiParam(params[key], convert) };
  }, {});
  return parameters;
};

const wrapInBrackets = str =>
  `${str
    .split("/")
    .map(s => {
      if (s.startsWith(":")) {
        s = `{${s.replace(/^:/g, "")}}`;
      }
      return s;
    })
    .join("/")}`;

const getPaths = (paths, convert, components) => {
  const mapObject = objToMap =>
    objToMap.isJoi
      ? convert(objToMap)
      : Object.keys(objToMap || {}).reduce((obj, item) => {
          let convertItem = objToMap[item] || {};
          if (!convertItem.isJoi) convertItem = joi.compile(convertItem);
          return Object.assign(obj, {
            [item]: { schema: convert(convertItem) }
          });
        }, {});

  const openAPIPaths = {};
  for (const path in paths) {
    const openApiPathFormat = wrapInBrackets(path);
    openAPIPaths[openApiPathFormat] = initIfUndefined(
      openAPIPaths,
      openApiPathFormat,
      {}
    );
    const handlers = paths[path];
    for (let i = 0, len = handlers.length; i < len; i++) {
      const handlerDef = handlers[i];
      const handlerMethod = handlerDef.method.toLowerCase();
      const openAPIHandler = {};
      const responses = handlerDef.handler.responses;

      openAPIHandler.parameters = convertParamsFromPath(
        handlerDef.handler.params,
        convert,
        components
      );
      openAPIHandler.responses = Object.keys(responses || {}).reduce(
        (obj, item) => {
          let itemOpenApiTranformed = mapObject(responses[item] || {});
          if (!itemOpenApiTranformed.$ref) {
            itemOpenApiTranformed = {
              description: "",
              content: itemOpenApiTranformed
            };
          }
          obj[item] = itemOpenApiTranformed;
          return obj;
        },
        {}
      );
      if (handlerMethod !== "get" && handlerMethod != "delete") {
        let requestBodyToOpenApi = mapObject(
          handlerDef.handler.requestBody || {}
        );
        if (!requestBodyToOpenApi.$ref) {
          requestBodyToOpenApi = {
            content: requestBodyToOpenApi
          };
        }
        openAPIHandler.requestBody = requestBodyToOpenApi;
      }

      openAPIPaths[openApiPathFormat][handlerMethod] = openAPIHandler;
    }
  }
  return openAPIPaths;
};

const groupPathsByVersions = paths => {
  const versionedPaths = {};
  const restEndpoint = Object.keys(paths || {});
  for (let i = 0, len_i = restEndpoint.length; i < len_i; i++) {
    let endpoint = paths[restEndpoint[i]];
    let uri = restEndpoint[i];
    for (let j = 0, len_j = endpoint.length; j < len_j; j++) {
      const handler = endpoint[j];
      if (!handler.versions) return;
      let versions = handler.versions;
      const newHandler = Object.assign({}, handler);
      delete newHandler.versions;
      for (let v = 0, len_v = versions.length; v < len_v; v++) {
        const version = versions[v];
        versionedPaths[version] = initIfUndefined(versionedPaths, version, {});
        versionedPaths[version][uri] = initIfUndefined(
          versionedPaths[version],
          uri,
          []
        );
        versionedPaths[version][uri].push(newHandler);
      }
    }
  }
  return versionedPaths;
};

const getComponentItem = (components, convert) => {
  const componentToOpenAPI = {};
  for (const i in components) {
    let convertItem = components[i] || {};
    if (!convertItem.isJoi) convertItem = joi.compile(convertItem);
    componentToOpenAPI[i] = convert(convertItem);
  }
  return componentToOpenAPI;
};

const getComponentWithContentType = (components, convert) => {
  const componentToOpenAPI = {};
  for (const i in components) {
    let convertSet = components[i] || {};
    let contentTypeSet = {};
    for (const j in convertSet) {
      let convertItem = convertSet[j] || {};
      if (!convertItem.isJoi) convertItem = joi.compile(convertItem);
      contentTypeSet = { description: "", content: {} };
      contentTypeSet["content"][j] = { schema: convert(convertItem) };
    }
    componentToOpenAPI[i] = contentTypeSet;
  }
  return componentToOpenAPI;
};

const getComponents = (components, convert) => {
  const schemas = getComponentItem(components.schemas || {}, convert);
  const parameters = convertParamsFromComponents(
    components.parameters || {},
    convert
  );
  const responses = getComponentWithContentType(
    components.responses || {},
    convert
  );
  const requestBodies = getComponentWithContentType(
    components.requestBodies || {},
    convert
  );
  return { schemas, parameters, responses, requestBodies };
};

const parser = (joiSchema, convert) => {
  const versionedPaths = Object.entries(
    groupPathsByVersions(joiSchema._settings.routing.paths)
  );
  const routing = {};
  const emptyInfo = {
    openapi: "3.0.0",
    servers: [],
    info: {
      version: "",
      title: "",
      description: "",
      contact: {
        name: "your name",
        url: "http://your.contact.com",
        email: "youremail@email.com"
      }
    }
  };
  const components = getComponents(
    joiSchema._settings.components || {},
    convert
  );
  for (let i = 0, len = versionedPaths.length; i < len; i++) {
    const version = versionedPaths[i][0];
    const paths = getPaths(versionedPaths[i][1], convert, components);
    routing[version] = {
      ...emptyInfo,
      ...{ info: { ...emptyInfo.info, ...{ version } } },
      paths,
      components
    };
  }

  return routing;
};

module.exports = parser;
