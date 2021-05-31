import Type from './Type';
import { associatePropType, Enumerable } from './Utils';

class Parameters extends Enumerable {
  constructor(parameters = []) {
    super();
    this.regularExpressions = Parameters.regularExpressions;
    this.params = this.fromJSON(parameters);
    this.sources = {};
  }

  fromJSON(parameters) {
    return parameters.reduce((accumulator, parameter) => {
      accumulator[parameter.name] = new Parameters.Parameter({
        name: parameter.name,
        isRequired: parameter.isRequired,
        defaultValue: parameter.defaultValue,
        type: Type.types[parameter.type],
        options: parameter.options,
      });
      return accumulator;
    }, {});
  }

  load(component) {
    Object.values(this.params).forEach((param) => {
      param.sources = [];
    });

    [this.params, this.sources] = this.parse(component, this.params);

    Object.values(this.params).forEach((param) => {
      if (param.sources.length === 0) delete this.params[param.name];
    });

    return this;
  }

  parse(component, params = {}, sourceMap = {}) {
    const sources = Object.values(component.props).map((prop) => (
      new Parameters.Source({ component, prop, type: 'prop' })
    ));

    sources.push(new Parameters.Source({
      component,
      type: 'body',
      prop: component.body,
    }));

    const getStyleSources = (style, foundSources = []) => {
      Object.values(style).forEach((prop) => {
        if (prop?.isProp) {
          sources.push(new Parameters.Source({ component, type: 'style', prop }));
        } else {
          getStyleSources(prop, foundSources);
        }
      });
      return foundSources;
    };
    sources.push(...getStyleSources(component.style || {}));

    sources.forEach((source) => {
      const paramNames = this.extract(source.prop.value);
      paramNames.forEach((param) => {
        let parameter = params[param];
        if (!parameter) {
          parameter = new Parameters.Parameter({
            name: param,
            defaultValue: source.prop.type.defaultString,
          });
          params[param] = parameter;
        }
        parameter.sources.push(source);

        sourceMap[component.id] ||= {};
        sourceMap[component.id][`${source.type}--${source.prop.name}`] ||= [];
        sourceMap[component.id][`${source.type}--${source.prop.name}`].push(parameter);
      });
    });

    component.children.forEach((child) => this.parse(child, params, sourceMap));

    return [params, sourceMap];
  }

  getBy({ id: componentId, type: sourceType, name: propName }) {
    const componentParams = this.sources[componentId] || {};
    const key = `${sourceType}--${propName}`;
    return componentParams[key] || [];
  }

  iterable() {
    return Object.values(this.params);
  }

  extract(string) {
    const params = Parameters.getContainers(string ?? '');
    return params.flatMap((group) => {
      const single = group.content.match(this.regularExpressions.param);
      if (single) return single.groups.name;

      const nestedParams = [...group.content.matchAll(this.regularExpressions.nestedParams)];
      return nestedParams.map((match) => match.groups.name);
    });
  }

  toJSON() {
    return Object.values(this.params).map((param) => param.toJSON());
  }
}

Parameters.getContainers = (input) => {
  const stack = [];
  const matches = [];

  for (let i = 0; i < input.length; i += 1) {
    if (input[i] === '{' && input[i + 1] === '{') {
      stack.push(i);
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (stack.length > 0 && input[i] === '}' && input[i + 1] === '}') {
      const start = stack.pop();
      if (stack.length === 0) {
        matches.push({
          content: input.slice(start + 2, i),
          input: input.slice(start, i + 2),
        });
      }
      i += 1;
    }
  }
  return matches;
};

Parameters.regularExpressions = {
  param: /^\s*(?<name>[a-zA-Z_][a-zA-Z0-9_]*)\s*$/,
  nestedParams: /{{\s*(?<name>[a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g,
};

Parameters.Parameter = class Parameter {
  constructor({
    name,
    type = Type.types.string,
    isRequired = false,
    defaultValue = type.defaultString,
    sources = [],
    options = null,
  }) {
    Object.assign(this, {
      name, type, isRequired, defaultValue, sources, options: options || type.defaultOptions(),
    });
  }

  set value(value) {
    this.defaultValue = value;
  }

  get value() {
    return this.defaultValue;
  }

  toJSON() {
    let { options } = this;
    if (Array.isArray(options)) {
      options = [...options];
    } else if (typeof options === 'object') {
      options = { ...options };
    }
    return {
      name: this.name,
      type: this.type.toJSON(),
      isRequired: this.isRequired,
      defaultValue: this.defaultValue,
      options,
    };
  }
};

associatePropType(Parameters.Parameter, 'Parameter');

Parameters.Source = class Source {
  constructor({ component, type, prop }) {
    if (!(type in Parameters.Source.permittedTypes)) throw new Error('Unknown source type');

    this.component = component;
    this.type = type;
    this.prop = prop;
  }
};

Parameters.Source.permittedTypes = {
  body: [Type.types.markdown, Type.types.string, Type.types.node],
  prop: Object.values(Type.types).filter((type) => type.name !== 'node'),
  style: [Type.types.string, Type.types.options],
};

export default Parameters;
