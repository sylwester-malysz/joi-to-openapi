const joi = require("@hapi/joi");

const initIfUndefined = (obj, key, defaultValue) => {
  obj[key] = obj[key] || defaultValue;
  return obj[key];
};

const getPaths = (paths, convert) => {
  const openAPIPaths = {};
  for (let path in paths) {
    openAPIPaths[path] = initIfUndefined(openAPIPaths, path, {});
    const handlers = paths[path];
    for (let i = 0, len = handlers.length; i < len; i++) {
      const handler = handlers[i];
      const method = handler.method.toLowerCase();
      const openAPIHandler = {};
      const requestBody = handler.handler.requestBody;
      openAPIHandler.requestBody = {
        content: {
          [requestBody.contentType]: {
            schema: convert(joi.compile(requestBody.body))
          }
        }
      };
      openAPIPaths[path][method] = openAPIHandler;
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
  for (let i in components) {
    componentToOpenAPI[i] = convert(joi.compile(components[i]));
  }
  return componentToOpenAPI;
};

const getComponents = (components, convert) => {
  const schema = getComponentItem(components.schema || {}, convert);
  const parameters = getComponentItem(components.parameters || {}, convert);
  const responses = getComponentItem(components.responses || {}, convert);
  const requestBodies = getComponentItem(
    components.requestBodies || {},
    convert
  );
  return { schema, parameters, responses, requestBodies };
};

const parser = (joiSchema, convert) => {
  const versionedPaths = Object.entries(
    groupPathsByVersions(joiSchema._settings.routing.paths)
  );
  const routing = {};
  for (let i = 0, len = versionedPaths.length; i < len; i++) {
    const version = versionedPaths[i][0];
    const paths = getPaths(versionedPaths[i][1], convert);
    const components = getComponents(
      (joiSchema._settings.components || { [version]: {} })[version] || {},
      convert
    );
    routing[version] = { paths, components };
  }
  return Object.assign(routing);
};

module.exports = parser;
