import Renderer from './Renderer';
import Component from './Component';
import Registry from './Registry';
import Schema from './Schema';
import { associatePropType, Storage } from './Utils';
import HTML from './HTML';
import useHead from './Renderer/useHead';
import ComponentStore from './Component/Store';

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
    this.importedComponents = this.convert({
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
    this.neboComponents = new ComponentStore({ React: react, schemaCache: this.schemaCache });
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
      cacheFor: this.cacheForMillis,
    });
    this.neboComponents.schemaCache = this.schemaCache;
  }

  get all() {
    return { ...this.neboComponents.all(), ...this.importedComponents };
  }

  get(nameOrId) {
    if (nameOrId in this.importedComponents) return this.importedComponents[nameOrId];
    if (this.neboComponents.get(nameOrId)) return this.neboComponents.get(nameOrId);

    return this.neboComponents.store(nameOrId);
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
