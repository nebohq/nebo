import Type from './Type';
import { associatePropType } from './Utils';

class Prop {
  static build(existing, attributes) {
    if (existing) {
      return existing.clone(attributes);
    }
    return new this(attributes);
  }

  constructor({
    name = '',
    type = Type.types.string,
    value = '',
    options = null,
  } = {}) {
    Object.assign(this, {
      name, type, value, options,
    });
  }

  clone(attributes = {}) {
    const {
      name, type, value, options,
    } = this;
    return new Prop({
      name, type, value, options, ...attributes,
    });
  }

  get isProp() {
    return true;
  }

  isEmpty() {
    return !this.value;
  }

  toString() {
    return this.value.toString();
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type.toJSON(),
      value: this.value,
      isProp: true,
      options: this.options,
    };
  }
}

associatePropType(Prop, 'Prop');

export default Prop;
