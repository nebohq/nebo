import Prop from '../Prop';
import Type from '../Type';

class Parser {
  constructor(schemaType) {
    this.schemaType = schemaType;
  }

  parse(component) {
    // eslint-disable-next-line no-prototype-builtins
    if (!component || this.schemaType.Component.prototype.isPrototypeOf(component)) {
      return component;
    }

    return new this.schemaType.Component({
      ...component,
      children: (component.children || []).map((child) => this.parse(child)),
      body: this.parseBody(component.body || ''),
      props: this.parseProps(component.props || {}),
      style: this.parseStyle(component.style || {}),
    });
  }

  parseBody(body) {
    return typeof (body || '') === 'string' ? new Prop({
      name: 'body',
      value: body,
      type: Type.types.markdown,
    }) : new Prop({
      name: 'body',
      value: body.value,
      type: Type.types[body.type],
    });
  }

  parseProps(props) {
    return Object.entries(props).reduce((accumulator, [name, value]) => {
      if (typeof value === 'string') {
        accumulator[name] = new Prop({ name, value });
      } else {
        accumulator[name] = new Prop({
          name,
          type: Type.types[value.type],
          value: value.value,
          options: value.options,
        });
      }
      return accumulator;
    }, {});
  }

  parseStyle(
    style,
    parsed = {},
    nesting = [],
  ) {
    return Object.entries(style).reduce((accumulator, [attribute, value]) => {
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
        this.parseStyle(style[attribute], accumulator[attribute], [...nesting, attribute]);
      }
      return accumulator;
    }, parsed);
  }
}

export default Parser;
