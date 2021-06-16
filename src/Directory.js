import Renderer from './Renderer';
import Component from './Component';
import Registry from './Registry';
import Schema from './Schema';
import { associatePropType, Storage } from './Utils';
import HTML from './HTML';
import useHead from './Renderer/useHead';

class Directory {
  constructor({
    components,
    react,
    renderer,
    accessToken,
    cacheForMillis = 0,
    version,
    schemaType = Schema,
  }) {
    this.React = react;
    this.components = this.convert({
      ...components,
      HTML: HTML(react),
    });
    this.renderer = renderer;
    this.schemaCache = Storage('nebo.schemas', {
      parser: (value) => (
        schemaType.parseComponentJSON(value.isSchema ? value.toJSON() : value)
      ),
    });
    this.accessToken = accessToken;
    this.version = version;

    this.cacheForMillis = cacheForMillis;
    this.cache = {};
    this.Renderer = Renderer;
    this.Registry = Registry;
    this.Component = Component;
  }

  get schemas() {
    return this.schemaCache;
  }

  set schemas(newSchemas) {
    this.schemaCache = Storage('nebo.schemas', {
      parser: this.schemaCache.parser,
      override: newSchemas,
    });
  }

  get all() {
    const neboComponents = Object.keys(this.schemas).reduce((acc, id) => {
      acc[id] = this.get(id);
      return acc;
    }, {});
    return { ...neboComponents, ...this.components };
  }

  get(nameOrId) {
    if (nameOrId in this.components) return this.components[nameOrId];
    if (nameOrId in this.cache) return this.cache[nameOrId];

    const component = Component.build(nameOrId, this);
    this.cache[nameOrId] = component;
    return component;
  }

  getHead(metadata = null) {
    if (metadata) return new useHead.State(metadata, this.React);
    return useHead.state;
  }

  convert(components) {
    const componentMap = this.flatten(components);
    Object.entries(componentMap).forEach(([name, component]) => {
      component.isNebo = false;
      component.displayName = name;
      component.componentType = null;
      component.expectedProps ||= {};
    });
    return componentMap;
  }

  flatten(components) {
    return Object.entries(components).reduce((acc, [key, component]) => {
      if (typeof component === 'string') {
        acc[key] = component;
      } else if (component.$$typeof || typeof component === 'function') {
        acc[key] = component;
      } else {
        Object.entries(this.flatten(component)).forEach(([subkey, subcomponent]) => {
          const name = `${key}.${subkey}`;
          acc[name] = subcomponent;
        });
      }
      return acc;
    }, {});
  }
}

associatePropType(Directory, 'Directory');

export default Directory;
