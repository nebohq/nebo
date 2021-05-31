import Renderer from './Renderer';
import Schema from './Schema';
import Type from './Type';
import Prop from './Prop';
import Registry from './Registry';
import { canUseDOM, ContentWindow, isNullish } from './Utils';
import fetchComponent from './Utils/fetchComponent';

const Component = ({
  id = null,
  slug = null,
  schema: passedSchema = null,
  nebo = {},
  children,
  ...props
}) => {
  const { directory } = Component; // set on configure call
  const {
    React: {
      useState, useEffect, useMemo, createElement,
    },
  } = directory;
  const {
    elementType = Component.build(id, directory),
    shouldCache = true,
    shouldFetch: passedShouldFetch = true,
    registry = new Registry(),
    contentWindow = ContentWindow,
  } = nebo;

  const lookupBy = id || slug;
  const computedSchema = useMemo(() => (
    Component.computeDefaultSchema({ passedSchema, directory, lookupBy })
  ), []);
  const [loadedSchema, setLoadedSchema] = useState(canUseDOM ? null : computedSchema);
  const [shouldFetch, setShouldFetch] = useState(useMemo(() => Component.computeDefaultShouldFetch({
    schema: computedSchema, passedShouldFetch, directory, lookupBy,
  }), []));

  useEffect(async () => {
    if (!shouldFetch || !lookupBy) return;

    const componentJSON = await fetchComponent({
      idOrSlug: lookupBy,
      accessToken: directory.accessToken,
    });
    if (!isNullish(fetchComponent)) {
      const fetchedSchema = Schema.parseComponentJSON(componentJSON);
      if (shouldCache) {
        directory.schemas[fetchedSchema.id] = fetchedSchema;
        if (slug) directory.schemas[slug] = fetchedSchema;
      }
      setLoadedSchema(fetchedSchema);
    }
    setShouldFetch(false);
  }, [shouldFetch]);

  useEffect(() => {
    if (loadedSchema === null) return;
    Component.configure(elementType, loadedSchema.id, loadedSchema);
  }, [loadedSchema]);

  useEffect(() => {
    setLoadedSchema(computedSchema);
  }, []);

  if (loadedSchema === null) return null;

  return createElement(Renderer, {
    nebo: {
      schema: loadedSchema,
      shouldCache,
      registry,
      contentWindow,
      shouldFetch: passedShouldFetch,
    },
    ...props,
  }, children);
};

Component.computeDefaultSchema = ({
  passedSchema, directory, lookupBy,
}) => {
  const schema = passedSchema || directory.schemas[lookupBy] || null;
  let computedSchema = schema;
  if (!isNullish(schema)) {
    computedSchema = schema?.isSchema ? schema : Schema.parseComponentJSON(schema);
  }
  return computedSchema;
};

Component.computeDefaultShouldFetch = ({
  schema, passedShouldFetch, directory, lookupBy,
}) => {
  let computedShouldFetch = !schema;
  if (passedShouldFetch) {
    computedShouldFetch = (
      new Date() - directory.schemas.cachedAt[lookupBy]
    ) > directory.cacheForMillis;
  }
  return computedShouldFetch;
};

Component.build = (id, directory) => {
  const component = (({ children, ...props }) => directory.React.createElement(Component, {
    id,
    nebo: { elementType: component },
    ...props,
  }, children));

  Object.assign(component, {
    id,
    isNebo: true,
  });

  if (id in directory.schemas) {
    const schema = directory.schemas[id];
    Component.configure(component, id, schema);
  }

  return component;
};

Component.configure = (elementType, id, schema) => {
  Object.assign(elementType, {
    displayName: schema.root.displayName,
    componentType: schema.type,
    params: schema.params,
    isVoid: Component.isVoid(schema.root),
    schema,
  });

  const propTypes = schema.params.reduce((accumulator, param) => {
    const { type } = param;
    const validator = param.isRequired ? type.requiredValidator : type.validator;
    accumulator[param.name] = (...args) => validator(...args, param);
    return accumulator;
  }, {});

  elementType.propTypes = propTypes;
  elementType.defaultProps = schema.params.reduce((accumulator, param) => {
    accumulator[param.name] = param.type.converter(param.defaultValue);
    return accumulator;
  }, {});

  elementType.expectedProps = Object.keys(propTypes).reduce((acc, propName) => {
    const params = (elementType.schema.params.params || {});
    const param = params[propName];
    const type = param?.type || Type.types.string;
    const value = param?.defaultValue || '';
    acc[propName] = new Prop({
      name: propName,
      type,
      value,
      options: param.options,
    });
    return acc;
  }, {});
};

Component.isVoid = (component) => {
  if (component.body?.type?.name === 'node') {
    return false;
  }
  const children = [...(component.children || [])];
  while (children.length > 0) {
    const child = children.shift();
    if (!Component.isVoid(child)) return false;
  }
  return true;
};

Component.types = {
  component: 'Component',
  page: 'Page',
  section: 'Section',
};

export default Component;
