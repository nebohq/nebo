import { Converter } from 'showdown';
import { merge } from 'lodash';
import Registry from './Registry';
import {
  displaySizes, classNames, ContentWindow, capitalize,
} from './Utils';
import Parametrizer from './Renderer/Parametrizer';
import Stylesheet, { useStylesheet } from './Renderer/Stylesheet';
import { useHead } from './Head';

const Renderer = ({
  nebo, children, className, style, ...props
}) => {
  const { directory } = Renderer; // set on configure call
  const {
    schema,
    shouldCache = true,
    shouldFetch = true,
    registry = new Registry(),
    contentWindow = ContentWindow,
    parametrizer = Renderer.parametrize,
  } = nebo;

  const { size } = Renderer.useMatchMedia(directory, contentWindow.matchMedia);
  const stylesheet = useStylesheet(Renderer.React)({
    schema,
    parametrizer,
    schemaCache: directory.schemas,
    passedProps: props,
    passedStylesheet: nebo.stylesheet,
  });
  useHead({ schema, contentWindow });
  registry.dequeueClear();

  return [
    Renderer.convert({
      component: schema.root,
      options: {
        directory,
        registry,
        size,
        params: schema.params,
        parametrizer,
        contentWindow,
        shouldCache,
        shouldFetch,
        stylesheet,
      },
      passed: {
        style,
        children,
        props,
        className,
      },
    }),
    stylesheet.shouldRender(schema.root) && Stylesheet.Component(Renderer.React)({
      key: `stylesheet-${stylesheet.componentId}`,
      stylesheet,
    }),
  ].filter(Boolean);
};

Renderer.useMatchMedia = (directory, matchMedia) => {
  const sizes = directory.React.useMemo(() => Object.entries(displaySizes).map((
    [size, properties],
  ) => {
    const query = [
      size !== 'sm' && `(min-width: ${properties.min}px)`,
      properties.max && `(max-width: ${properties.max}px)`,
    ].filter(Boolean).join(' and ');
    const media = matchMedia(query);
    return {
      name: size,
      media,
      query,
      properties,
    };
  }, {}), []);

  const [currentSize, setSize] = directory.React.useState(() => (
    sizes.find(({ media }) => media.matches)
  ));

  directory.React.useEffect(() => {
    sizes.forEach((size) => {
      size.listener = () => {
        if (size.media.matches) setSize(size);
      };
      size.media.addEventListener('change', size.listener);
    });

    return () => sizes.forEach(({ media, listener }) => (
      media.removeEventListener('change', listener)
    ));
  }, []);

  return { size: currentSize };
};

Renderer.convert = ({
  component, options, passed,
}) => {
  const {
    id, name, children,
  } = component;
  const { directory, registry } = options;
  const {
    props: passedProps,
    children: passedChildren,
    style: passedStyle,
    className: passedClassName,
  } = passed;

  const convertedChildren = children.map((child) => (
    Renderer.convert({
      options,
      component: child,
      passed: { ...passed, style: null, className: null },
    })
  ));

  const convertedBody = Renderer.convertBody({
    options, component, passedProps, passedChildren,
  });
  convertedChildren.push(...convertedBody);

  const convertedProps = Renderer.convertProps({ component, options, passedProps });
  const propStyle = convertedProps.style || {};
  delete convertedProps.style;
  const {
    className: convertedClassName,
    style: convertedStyle,
  } = Renderer.convertStyleAndClassName({
    component, options, passedProps,
  });

  const reactElementType = directory.get(name);
  const componentClassName = classNames(convertedClassName, passedClassName);
  const componentStyle = { ...convertedStyle, ...propStyle, ...passedStyle };

  const reactComponent = directory.React.createElement(
    reactElementType,
    {
      key: id,
      ...(Object.keys(componentStyle).length > 0 && { style: componentStyle }),
      ...(componentClassName && { className: componentClassName }),
      ...(reactElementType.isNebo && {
        nebo: {
          elementType: reactElementType,
          contentWindow: options.contentWindow,
          shouldCache: options.shouldCache,
          shouldFetch: options.shouldFetch,
          stylesheet: options.stylesheet,
        },
      }),
      ...convertedProps,
    },
    convertedChildren.length > 0 ? convertedChildren : null,
  );
  registry.add(component, reactComponent);
  return reactComponent;
};

Renderer.convertBody = ({
  component, options, passedProps, passedChildren,
}) => {
  const { id, body } = component;
  const { directory, parametrizer, params } = options;

  if (body.type.name === 'markdown') {
    if (body.isEmpty()) return [];

    const text = parametrizer({
      params,
      id,
      sourceType: 'body',
      prop: body,
      passedProps,
    });

    const markdown = Renderer.makeHTMLFromMarkdown(text);
    return [
      directory.React.createElement('span', {
        key: `${id}--body`,
        dangerouslySetInnerHTML: { __html: markdown.replace(/^<p>|<\/p>$/g, '') },
      }),
    ];
  }

  if (body.type.name === 'node' && passedChildren) {
    return [passedChildren];
  }

  return [
    parametrizer({
      params,
      id,
      sourceType: 'body',
      prop: body,
      passedProps,
    }),
  ].filter(Boolean);
};

Renderer.convertProps = ({ component, options, passedProps }) => {
  const { id, props } = component;
  const { parametrizer, params } = options;

  return Object.keys(props || {}).reduce((accumulator, propName) => {
    const prop = props[propName];
    accumulator[propName] = parametrizer({
      id,
      params,
      sourceType: 'prop',
      prop,
      passedProps,
    });
    return accumulator;
  }, {});
};

Renderer.convertStyleAndClassName = ({ component, options, passedProps }) => {
  const {
    parametrizer, params, size, stylesheet,
  } = options;

  const parametrize = (prop) => parametrizer({
    id: component.id,
    params,
    sourceType: 'style',
    prop,
    passedProps,
  });

  const mediaStyleSet = (component.style?.media || {})[size?.name || 'md'] || {};
  const componentStyles = stylesheet.get(component);

  const convertStyle = (
    style,
    existing = {},
    nesting = [],
  ) => Object.entries(style).reduce((acc, [attribute, prop]) => {
    if (['className', 'media'].includes(attribute)) return acc;

    if (prop?.isProp || typeof prop === 'string') {
      const pieces = [...nesting, attribute];
      const name = pieces.map((piece, i) => (i === 0 ? piece : capitalize(piece))).join('');
      const value = parametrize(prop);
      if (value && value !== prop.value.toString()) acc[name] = value;
    } else {
      convertStyle(style[attribute], existing, [...nesting, attribute]);
    }
    return acc;
  }, existing);

  let className = component.style?.className && parametrize(component.style?.className);
  if (mediaStyleSet.className) className = parametrize(component.style?.className);
  if (componentStyles) className = `${className ? `${className} ` : ''}${componentStyles.className}`;

  return {
    className,
    style: merge(
      convertStyle(component.style),
      convertStyle(mediaStyleSet),
    ),
  };
};

Renderer.parametrize = Parametrizer;

Renderer.makeHTMLFromMarkdown = (text) => new Converter({
  parseImgDimensions: true,
  omitExtraWLInCodeBlocks: true,
  underline: true,
  noHeaderId: true,
  strikethrough: true,
}).makeHtml(text);

export default Renderer;
