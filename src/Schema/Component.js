import { uuid } from '../Utils';
import Prop from '../Prop';
import Type from '../Type';

class Component {
  constructor({
    id = uuid(),
    name,
    displayName = null,
    props = {},
    children = [],
    body = new Prop({ name: 'body', type: Type.types.markdown }),
    style = {},
  }) {
    Object.assign(this, {
      id,
      name,
      displayName: displayName ?? name,
      props,
      children,
      body,
      style,
    });
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
}

export default Component;
