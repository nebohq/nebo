import Parameters from './Parameters';
import Component from './Schema/Component';
import Parser from './Schema/Parser';

class Schema {
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
      metadata: jsonComponent.metadata,
      root: jsonComponent.schema,
      params: jsonComponent.params,
    });
  }

  static parse(component) {
    return new Parser(this).parse(component);
  }

  constructor({
    id = null,
    slug = null,
    metadata = null,
    type = 'component',
    root = null,
    params = null,
  }) {
    this.id = id;
    this.slug = slug;
    this.type = type;
    this.metadata = metadata || {};
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
      metadata: { ...this.metadata },
      schema: this.root.toJSON(),
      params: this.params.toJSON(),
    };
  }
}

Schema.Component = Component;

export default Schema;
