import { v4 as uuid } from 'uuid';
import Parameters from './Parameters';
import Prop from './Prop';
import Type from './Type';

class Schema {
  static parse(component) {
    // eslint-disable-next-line no-prototype-builtins
    if (!component || this.Component.prototype.isPrototypeOf(component)) {
      return component;
    }

    const parseStyle = (
      style,
      parsed = {},
      nesting = [],
    ) => Object.entries(style).reduce((accumulator, [attribute, value]) => {
      if (typeof value === 'string') {
        const name = [...nesting, attribute].join('-');
        accumulator[attribute] = new Prop({ name, value });
      } else if (value.isProp) {
        accumulator[attribute] = new Prop({
          name: [...nesting, attribute].join('-'),
          type: Type.types[value.type],
          value: value.value,
        });
      } else {
        accumulator[attribute] ||= {};
        parseStyle(style[attribute], accumulator[attribute], [...nesting, attribute]);
      }
      return accumulator;
    }, parsed);

    return new this.Component({
      ...component,
      children: (component.children || []).map((child) => this.parse(child)),
      body: typeof (component.body || '') === 'string' ? new Prop({
        name: 'body',
        value: component.body,
        type: Type.types.markdown,
      }) : new Prop({
        name: 'body',
        value: component.body.value,
        type: Type.types[component.body.type],
      }),
      props: Object.entries(component.props || {}).reduce((accumulator, [name, value]) => {
        accumulator[name] = typeof value === 'string' ? new Prop({ name, value }) : new Prop({
          name,
          type: Type.types[value.type],
          value: value.value,
          options: value.options,
        });
        return accumulator;
      }, {}),
      style: parseStyle(component.style || {}),
    });
  }

  static parseComponentJSON(jsonComponent) {
    if (!jsonComponent) return null;

    if (Array.isArray(jsonComponent)) {
      return jsonComponent.reduce((accumulator, component) => {
        accumulator[component.id] = this.load(component);
        return accumulator;
      }, {});
    }

    return this.load(jsonComponent);
  }

  static load(jsonComponent) {
    return new this({
      id: jsonComponent.id,
      slug: jsonComponent.slug,
      type: jsonComponent.type,
      root: jsonComponent.schema,
      params: jsonComponent.params,
    });
  }

  constructor({
    id = null,
    slug = null,
    type = 'component',
    root = null,
    params = null,
  }) {
    this.id = id;
    this.slug = slug;
    this.type = type;
    this.root = this.constructor.parse(root) || new this.constructor.Component({
      name: 'HTML.div',
    });
    this.isSchema = true;

    // eslint-disable-next-line no-prototype-builtins
    if (Parameters.prototype.isPrototypeOf(params)) {
      this.params = params;
    } else if (!params) {
      this.params = new Parameters().load(this.root);
    } else {
      this.params = new Parameters(params).load(this.root);
    }
  }

  remove(component, current = this.root) {
    return this.getParent(component, current, (parent, child, index) => (
      parent.children.splice(index, 1)
    ));
  }

  getParent(component, current = this.root, onFind = () => {}) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < current.children.length; i++) {
      const child = current.children[i];
      if (child.id === component.id) {
        onFind(current, child, i);
        return current;
      }
      const parent = this.getParent(component, child, onFind);
      if (parent) return parent;
    }
    return null;
  }

  isRoot(component) {
    return this.root.id === component.id;
  }

  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      type: this.type,
      schema: this.root.toJSON(),
      params: this.params.toJSON(),
    };
  }
}

Schema.Component = class Component {
  constructor({
    id = uuid(),
    name,
    displayName = null,
    props = {},
    children = [],
    body = new Prop({ name: 'body', type: Type.types.markdown }),
    style = {},
  }) {
    this.id = id;
    this.name = name;
    this.displayName = displayName ?? name;
    this.props = props;
    this.children = children;
    this.body = body;
    this.style = style;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      props: Object.entries(this.props).reduce((acc, [propName, prop]) => {
        acc[propName] = prop.toJSON();
        return acc;
      }, {}),
      body: this.body.toJSON(),
      style: this.serializeStyle(),
      children: this.children.map((child) => child.toJSON()),
    };
  }

  serializeStyle(style = this.style, existing = {}) {
    return Object.entries(style).reduce((acc, [attribute, value]) => {
      if (value?.isProp || typeof value === 'string') {
        acc[attribute] = value.toJSON();
      } else {
        acc[attribute] = {};
        this.serializeStyle(value, acc[attribute]);
      }
      return acc;
    }, existing);
  }
};

export default Schema;
