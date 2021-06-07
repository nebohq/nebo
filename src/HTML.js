import htmlTags from 'html-tags';
import voidHtmlTags from 'html-tags/void';
import Prop from './Prop';
import Type from './Type';
import { kebabCase } from './Utils';

const HTML = (react) => {
  const components = HTML.getComponents(react);
  return htmlTags.reduce((acc, tag) => {
    const component = tag in components ? components[tag] : HTML.getComponent(react, tag);
    component.displayName = tag;
    component.expectedProps ||= {};
    acc[tag] = component;
    return acc;
  }, {});
};

HTML.getComponent = (react, tag) => {
  const elementType = react.forwardRef(({
    className,
    style,
    children,
    ...props
  }, forwardedRef) => {
    const ref = react.useRef(null);

    react.useLayoutEffect(() => {
      if (!ref.current) return;

      const node = ref.current;
      node.classList.remove(...node.classList);
      if (className) node.classList.add(...className.split(' ').filter(Boolean));

      node.style = {};
      Object.entries(style || {}).forEach(([attribute, value]) => {
        node.style.setProperty(kebabCase(attribute), value, 'important');
      });
      if (forwardedRef) forwardedRef.current = ref.current;
    }, [ref.current, style, className]);

    if (voidHtmlTags.includes(tag)) {
      return react.createElement(tag, {
        ref,
        style,
        className,
        ...props,
      }, null);
    }

    return react.createElement(tag, {
      ref,
      style,
      className,
      ...props,
    }, children);
  });
  elementType.isVoid = voidHtmlTags.includes(tag);

  return elementType;
};

HTML.getComponents = (react) => ({
  img: Object.assign(HTML.getComponent(react, 'img'), {
    expectedProps: {
      src: new Prop({ name: 'src', type: Type.types.image, value: '' }),
      alt: new Prop({ name: 'alt', type: Type.types.string, value: '' }),
    },
  }),
  a: Object.assign(HTML.getComponent(react, 'a'), {
    expectedProps: {
      href: new Prop({ name: 'href', type: Type.types.string, value: '' }),
      target: new Prop({
        name: 'target',
        type: Type.types.options,
        value: '_self',
        options: {
          'Current Tab': '_self',
          'New Tab': '_blank',
          Parent: '_parent',
          Top: '_top',
        },
      }),
    },
  }),
});

export default HTML;
