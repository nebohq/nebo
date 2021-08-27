import { capitalize, displaySizes, kebabCase } from '../Utils';

class Stylesheet {
  constructor({ componentId }) {
    this.componentId = componentId;
    this.stylesheets = new Map();
    this.contentCache = null;
    this.extractor = new Stylesheet.StyleExtractor();
    this.formatter = new Stylesheet.Formatter();
    this.emitter = new Proxy({}, {
      get: (target, property) => {
        if (!(property in target)) target[property] = [];
        return target[property];
      },
    });
  }

  shouldRender(component) {
    return component.id === this.componentId;
  }

  build({
    schema,
    parametrizer,
    schemaCache,
    passedProps,
  }) {
    const components = [schema.root];
    while (components.length > 0) {
      const component = components.pop();
      const parametrize = (prop) => parametrizer({
        id: component.id,
        params: schema.params,
        sourceType: 'style',
        prop,
        passedProps,
      });
      this.add(component, parametrize);

      if (component.name in schemaCache) {
        this.build({
          schema: schemaCache[component.name],
          parametrizer,
          schemaCache,
          passedProps,
        });
      }

      components.push(...component.children);
    }

    this.emitter.change.forEach((listener) => listener(this));
    return this;
  }

  get content() {
    this.contentCache ||= [...this.stylesheets.values()].map((sheet) => sheet.content).join('\n\n');
    return this.contentCache;
  }

  isEmpty() {
    return this.stylesheets.size === 0;
  }

  get(component) {
    return this.stylesheets.get(component.id);
  }

  addEventListener(event, listener) {
    this.emitter[event].push(listener);
  }

  removeEventListener(event, listener) {
    const index = this.emitter[event].findIndex(listener);
    if (index === -1) return;

    this.emitter[event].splice(index, 1);
  }

  add(component, parametrize) {
    const styleDescription = this.extractor.convert(component, parametrize);

    const stylesheet = {
      content: this.formatter.format(styleDescription),
      className: styleDescription.className,
    };
    if (!stylesheet.content) return stylesheet;

    this.stylesheets.set(component.id, stylesheet);
    this.contentCache = null;

    return stylesheet;
  }
}

Stylesheet.Formatter = class Formatter {
  format(styleDescription) {
    return [...styleDescription.styleByQuery].map(([query, styles]) => (
      this.toCSSLine(styleDescription.className, query, styles)
    )).filter(Boolean).join('\n');
  }

  toCSSLine(className, query, styles) {
    const lines = Object.entries(styles).reduce((stylesheet, [attribute, value]) => {
      stylesheet.push(`${kebabCase(attribute)}: ${value};`);
      return stylesheet;
    }, []);
    if (lines.length === 0) return null;

    const depth = query ? 2 : 1;
    const queryCSS = `.${className} {\n${this.getPadding(depth)}${lines.join(`\n${this.getPadding(depth)}`)}\n${this.getPadding(depth - 1)}}`;

    if (!query) return queryCSS;

    return `@media ${query} {\n\t${queryCSS}\n}`;
  }

  getPadding(depth) {
    let padding = '';
    for (let i = 0; i < depth; i += 1) {
      padding += '\t';
    }
    return padding;
  }
};

Stylesheet.StyleExtractor = class StyleExtractor {
  convert(component, parametrize) {
    const defaultStyle = this.flatten({ style: component.style || {}, parametrize });

    const queries = new Map(defaultStyle ? [[null, defaultStyle]] : []);
    Object.entries(displaySizes).forEach(([size, properties]) => {
      const media = component.style?.media || {};
      if (!(size in media)) return;

      const query = [
        size !== 'sm' && `(min-width: ${properties.min}px)`,
        properties.max && `(max-width: ${properties.max}px)`,
      ].filter(Boolean).join(' and ');

      const stylesheet = this.flatten({ style: media[size], parametrize });
      if (!stylesheet) return;

      queries.set(query, stylesheet);
    });

    if (queries.size === 0) return null;

    return {
      className: `component-${component.id}`,
      styleByQuery: queries,
    };
  }

  flatten({
    style,
    parametrize,
    existing = {},
    nesting = [],
  }) {
    return Object.entries(style).reduce((acc, [attribute, prop]) => {
      if (['className', 'media'].includes(attribute)) return acc;

      if (prop?.isProp || typeof prop === 'string') {
        const pieces = [...nesting, attribute];
        const name = pieces.map((piece, i) => (i === 0 ? piece : capitalize(piece))).join('');
        const value = parametrize(prop);
        // DO NOT CONVERT PARAMETRIZEABLE VALUES
        if (value && prop.value.toString() === value) acc[name] = value;
      } else {
        this.flatten({
          style: style[attribute],
          existing,
          parametrize,
          nesting: [...nesting, attribute],
        });
      }
      return acc;
    }, existing);
  }
};

Stylesheet.Component = (React) => {
  Stylesheet.Component.cache ||= new Map();
  if (Stylesheet.Component.cache.has(React)) return Stylesheet.Component.cache.get(React);

  const cachedComponent = ({ key, stylesheet }) => {
    const [content, setContent] = React.useState(() => stylesheet.content);
    React.useLayoutEffect(() => {
      const listener = ({ content: newContent }) => setContent(newContent);

      stylesheet.addEventListener('change', listener);

      return () => { stylesheet.removeEventListener('change', listener); };
    }, [stylesheet, key]);

    if (stylesheet.isEmpty()) return null;

    return React.createElement('style', {
      key,
      type: 'text/css',
      dangerouslySetInnerHTML: {
        __html: content,
      },
    });
  };

  Stylesheet.Component.cache.set(React, cachedComponent);
  return cachedComponent;
};

const useStylesheet = (React) => {
  useStylesheet.cache ||= new Map();
  if (useStylesheet.cache.has(React)) return useStylesheet.cache.get(React);

  const cachedHook = ({
    schema,
    parametrizer,
    schemaCache,
    passedProps,
    passedStylesheet,
  }) => {
    const [stylesheet, _setStylesheet] = React.useState(() => (
      passedStylesheet || new Stylesheet({ componentId: schema.root.id })
    ).build({
      schema,
      parametrizer,
      schemaCache,
      passedProps,
    }));

    React.useEffect(() => {
      stylesheet.build({
        schema,
        parametrizer,
        schemaCache,
        passedProps,
      });
    }, [schema, parametrizer, passedProps]);

    return stylesheet;
  };
  useStylesheet.cache.set(React, cachedHook);
  return cachedHook;
};

export default Stylesheet;
export { useStylesheet };
