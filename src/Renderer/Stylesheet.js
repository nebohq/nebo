import { capitalize, displaySizes, kebabCase } from '../Utils';

class Stylesheet {
  constructor({ componentId }) {
    this.componentId = componentId;
    this.styleSheets = new Map();
    this.listener = () => {};
  }

  addListener(listener) {
    this.listener = listener;
  }

  add(component, parametrize) {
    const defaultStyle = this.convert(component.id, component.style || {}, parametrize);

    const queries = new Map(defaultStyle ? [[null, defaultStyle]] : []);
    Object.entries(displaySizes).forEach(([size, properties]) => {
      const media = component.style?.media || {};
      if (!(size in media)) return;

      const query = [
        size !== 'sm' && `(min-width: ${properties.min}px)`,
        properties.max && `(max-width: ${properties.max}px)`,
      ].filter(Boolean).join(' and ');

      const stylesheet = this.convert(component.id, media[size], parametrize);
      if (!stylesheet) return;
      queries.set(query, stylesheet);
    });

    if (queries.size === 0) return null;

    const stylesheet = {
      className: `component-${component.id}`,
      content: [...queries].map(([query, styles]) => {
        if (!query) return styles;

        return `@media ${query} {\n${styles}\n}`;
      }).join('\n\n'),
    };

    this.styleSheets.set(component.id, stylesheet);
    this.contentCache = null;
    this.listener(this);
    return stylesheet;
  }

  get content() {
    this.contentCache ||= [...this.styleSheets.values()].map((sheet) => sheet.content).join('\n\n\n');
    return this.contentCache;
  }

  convert(componentId, style, parametrize) {
    return this.toCSS(`component-${componentId}`, this.flatten({ style, parametrize }));
  }

  toCSS(className, styles) {
    const lines = Object.entries(styles).reduce((stylesheet, [attribute, value]) => {
      stylesheet.push(`${kebabCase(attribute)}: ${value};`);
      return stylesheet;
    }, []);
    if (lines.length === 0) return null;

    return `.${className} {\n\t${lines.join('\n\t')}\n}`;
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
        if (value) acc[name] = value;
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
}

Stylesheet.Component = (React) => ({ key, stylesheet }) => {
  const [content, setContent] = React.useState(() => stylesheet.content);
  React.useLayoutEffect(() => {
    setContent(() => stylesheet.content);
    stylesheet.addListener(({ content }) => setContent(content));

    return () => { stylesheet.addListener(() => {}); };
  }, [stylesheet, key]);

  if (stylesheet.styleSheets.size === 0) return null;

  return React.createElement('style', {
    key,
    type: 'text/css',
    dangerouslySetInnerHTML: {
      __html: content,
    },
  });
};

export default Stylesheet;
