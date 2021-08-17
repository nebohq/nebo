import Component from '../Component';
import Type from '../Type';
import Prop from '../Prop';

class Store {
  constructor({ React, schemaCache }) {
    this.React = React;
    this.schemaCache = schemaCache;
    this.componentsCache = {};
  }

  all() {
    return Object.keys(this.schemaCache).reduce((acc, cacheKey) => {
      acc[cacheKey] = this.store(cacheKey);
      return acc;
    }, {});
  }

  get(cacheKey) {
    return this.componentsCache[cacheKey] || null;
  }

  store(id, { schema = this.schemaCache[id], cacheKeys = [id] } = {}) {
    const elementType = this.componentsCache[id] || this.build(id);
    if (schema) this.configure(elementType, schema);
    cacheKeys.forEach((key) => {
      this.componentsCache[key] ||= elementType;
    });

    return this.componentsCache[id];
  }

  build(id) {
    const component = (({ children, ...props }) => this.React.createElement(Component, {
      id,
      nebo: { elementType: component },
      ...props,
    }, children));

    Object.assign(component, {
      id,
      isNebo: true,
      displayName: 'NeboComponent',
      isVoid: true,
      componentType: null,
      expectedProps: {},
    });

    return component;
  }

  configure(elementType, schema) {
    Object.assign(elementType, {
      displayName: schema.root.displayName,
      componentType: schema.type,
      params: schema.params,
      isVoid: schema.root.isVoid(),
      schema,
    });

    const propTypes = schema.params.reduce((accumulator, param) => {
      const { type } = param;
      const validator = param.isRequired ? type.requiredValidator : type.validator;
      accumulator[param.name] = (...args) => validator(...args, param);
      return accumulator;
    }, {});

    elementType.propTypes = propTypes;
    elementType.defaultProps = schema.params.reduce((accumulator, param) => {
      accumulator[param.name] = param.type.converter(param.defaultValue);
      return accumulator;
    }, {});

    elementType.expectedProps = Object.keys(propTypes).reduce((acc, propName) => {
      const params = (elementType.schema.params.params || {});
      const param = params[propName];
      const type = param?.type || Type.types.string;
      const value = param?.defaultValue || '';
      acc[propName] = new Prop({
        name: propName,
        type,
        value,
        options: param.options,
      });
      return acc;
    }, {});
  }
}

export default Store;
