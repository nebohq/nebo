import PropTypes from 'prop-types';
import { evaluate, humanize, isNullish } from './Utils';

class Type {
  constructor({
    name,
    displayName = humanize(name),
    stringLike = false,
    converter = stringLike ? (value) => (isNullish(value) ? '' : value?.toString()) : null,
    validator = PropTypes[name],
    requiredValidator = validator.isRequired,
    defaultString = '',
    defaultOptions = () => null,
  }) {
    if (isNullish(converter)) throw Error('Expected a valid converter');

    Object.assign(this, {
      name,
      displayName,
      converter,
      validator,
      requiredValidator,
      defaultString,
      stringLike,
      defaultOptions,
    });
  }

  convert(value) {
    return this.converter(value);
  }

  toJSON() {
    return this.name;
  }
}

Type.types = {
  string: new Type({
    name: 'string',
    displayName: 'Text',
    stringLike: true,
  }),
  markdown: new Type({
    name: 'markdown',
    validator: PropTypes.string,
    stringLike: true,
  }),
  image: new Type({
    name: 'image',
    validator: PropTypes.string,
    stringLike: true,
  }),
  options: new Type({
    name: 'options',
    validator: (...args) => {
      const param = args[args.length - 1];
      return PropTypes.oneOf(Object.values(param.options))(...args);
    },
    requiredValidator: (...args) => {
      const param = args[args.length - 1];
      return PropTypes.oneOf(Object.values(param.options)).isRequired(...args);
    },
    stringLike: true,
    defaultOptions: () => ({}),
  }),
  bool: new Type({
    name: 'bool',
    displayName: 'Boolean',
    converter: (value) => {
      if (typeof value === 'string') {
        const values = { true: true, false: false };
        return value in values ? values[value] : Boolean(value);
      }
      return Boolean(value);
    },
    defaultString: 'true',
  }),
  number: new Type({
    name: 'number',
    defaultString: '0',
    converter: (value) => {
      if (typeof value === 'number') return value;
      return Number(value);
    },
  }),
  object: new Type({
    name: 'object',
    defaultString: '{}',
    converter: (value) => {
      let result = value;
      if (typeof value === 'string') result = evaluate(value);
      if (typeof result !== 'object') return {};
      return result;
    },
  }),
  array: new Type({
    name: 'array',
    defaultString: '[]',
    converter: (value) => {
      let result = value;
      if (typeof value === 'string') result = evaluate(value);
      return Array.from(result ?? []);
    },
  }),
  func: new Type({
    name: 'func',
    displayName: 'Function',
    defaultString: '() => {}',
    converter: (value) => {
      let result = value;
      if (typeof value === 'string') result = evaluate(value);
      if (typeof result !== 'function') return () => {};
      return result;
    },
  }),
  symbol: new Type({
    name: 'symbol',
    converter: (value) => {
      if (typeof value === 'symbol') return value;
      return isNullish(value) ? null : Symbol.for(value);
    },
    defaultString: '',
  }),
  node: new Type({
    name: 'node',
    displayName: 'Node',
    defaultString: '',
    converter: (value) => value,
  }),
};

export default Type;
