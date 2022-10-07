const joi = require("joi");
const { retrieveReference, isJoi } = require("./utils");

const initIfUndefined = (_obj, key, defaultValue) => {
  const obj = _obj;
  obj[key] = obj[key] || defaultValue;
  return obj[key];
};

const isRequired = obj => {
  return obj._flags.presence === "required" ? true : undefined;
};

const makeOpenApiParam = (item, state = {}, convert) => {
  let openApiParameter;
  if (retrieveReference(item, state.components)) {
    openApiParameter = convert(item, state);
  } else {
    const name = item.name ? item.name : item.key;
    openApiParameter = {
      name,
      in: item.in,
      schema: convert(item.schema, state),
      required: isRequired(item.schema)
    };
  }
  return openApiParameter;
};

const convertParamsFromPath = (params, state, convert) => {
  const parameters = (params || []).map(item => {
    return makeOpenApiParam(item, state, convert);
  });
  return parameters;
};

const convertParamsFromComponents = (params, state, convert) => {
  const parameters = Object.keys(params || {}).reduce((acc, key) => {
    return { ...acc, [key]: makeOpenApiParam(params[key], state, convert) };
  }, {});
  return parameters;
};

const wrapInBrackets = str =>
  `${str
    .split("/")
    .map(s => (s.startsWith(":") ? `{${s.replace(/^:/g, "")}}` : s))
    .join("/")}`;

const getPaths = (paths, state, convert) => {
  const mapObject = objToMap =>
    isJoi(objToMap)
      ? convert(objToMap, state)
      : Object.keys(objToMap || {}).reduce((obj, item) => {
          let convertItem = objToMap[item] || {};
          if (!isJoi(convertItem)) convertItem = joi.compile(convertItem);
          return Object.assign(obj, {
            [item]: { schema: convert(convertItem, state) }
          });
        }, {});

  return Object.keys(paths).reduce((_openAPIPaths, path) => {
    const openAPIPaths = _openAPIPaths;
    const openApiPathFormat = wrapInBrackets(path);
    openAPIPaths[openApiPathFormat] = initIfUndefined(openAPIPaths, openApiPathFormat, {});
    const handlers = paths[path];
    for (let i = 0, len = handlers.length; i < len; i += 1) {
      const handlerDef = handlers[i];
      const handlerMethod = handlerDef.method.toLowerCase();
      const openAPIHandler = {};
      const { responses } = handlerDef.handler;

      openAPIHandler.parameters = convertParamsFromPath(handlerDef.handler.params, state, convert);
      openAPIHandler.responses = Object.keys(responses || {}).reduce((obj, item) => {
        const _obj = obj;
        let itemOpenApiTranformed = mapObject(responses[item] || {});
        if (!itemOpenApiTranformed.$ref) {
          itemOpenApiTranformed = {
            description: "",
            content: itemOpenApiTranformed
          };
        }
        _obj[item] = itemOpenApiTranformed;
        return _obj;
      }, {});
      if (handlerMethod !== "get" && handlerMethod !== "delete") {
        let requestBodyToOpenApi = mapObject(handlerDef.handler.requestBody || {});
        if (!requestBodyToOpenApi.$ref) {
          requestBodyToOpenApi = {
            content: requestBodyToOpenApi
          };
        }
        openAPIHandler.requestBody = requestBodyToOpenApi;
      }

      openAPIPaths[openApiPathFormat][handlerMethod] = openAPIHandler;
    }
    return openAPIPaths;
  }, {});
};

const groupPathsByVersions = paths => {
  const versionedPaths = {};
  const restEndpoint = Object.keys(paths || {});
  for (let i = 0, len_i = restEndpoint.length; i < len_i; i += 1) {
    const endpoint = paths[restEndpoint[i]];
    const uri = restEndpoint[i];
    for (let j = 0, len_j = endpoint.length; j < len_j; j += 1) {
      const handler = endpoint[j];
      if (!handler.versions) return undefined;
      const { versions } = handler;
      const newHandler = { ...handler };
      delete newHandler.versions;
      for (let v = 0, len_v = versions.length; v < len_v; v += 1) {
        const version = versions[v];
        versionedPaths[version] = initIfUndefined(versionedPaths, version, {});
        versionedPaths[version][uri] = initIfUndefined(versionedPaths[version], uri, []);
        versionedPaths[version][uri].push(newHandler);
      }
    }
  }
  return versionedPaths;
};

const getComponentItem = (components, state, convert) => {
  return Object.entries(components).reduce((acc, [key, obj]) => {
    const item = !isJoi(obj) ? joi.compile(obj) : obj;
    return { ...acc, [key]: convert(item, { ...state }) };
  }, {});
};

const getComponentWithContentType = (components, state, convert) => {
  const result = Object.entries(components).reduce((acc, [key, convertSet]) => {
    const contentTypeSet = Object.entries(convertSet).reduce(
      (acc2, [key2, convertItem]) => {
        const item = !isJoi(convertItem) ? joi.compile(convertItem) : convertItem;
        return { ...acc2, content: { ...acc2.content, [key2]: { schema: convert(item, state) } } };
      },
      { description: "", content: {} }
    );
    return { ...acc, [key]: contentTypeSet };
  }, {});
  return result;
};

const getComponents = (components, state, convert) => {
  const schemas = getComponentItem(components.schemas || {}, state, convert);
  const parameters = convertParamsFromComponents(components.parameters || {}, state, convert);
  const responses = getComponentWithContentType(components.responses || {}, state, convert);
  const requestBodies = getComponentWithContentType(components.requestBodies || {}, state, convert);
  return { schemas, parameters, responses, requestBodies };
};

const parser = (joiSchema, s, convert) => {
  const versionedPaths = Object.entries(groupPathsByVersions(joiSchema._flags.routing.paths));
  const state = {
    ...s,
    components: { ...(joiSchema._flags.components || {}) }
  };
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
  const components = getComponents(joiSchema._flags.components || {}, state, convert);

  for (let i = 0, len = versionedPaths.length; i < len; i += 1) {
    const version = versionedPaths[i][0];
    const paths = getPaths(versionedPaths[i][1], state, convert, components);
    const routTmp = {
      ...emptyInfo,
      ...{ info: { ...emptyInfo.info, ...{ version } } },
      paths,
      components
    };
    routing[version] = routTmp;
  }

  return routing;
};

module.exports = parser;
