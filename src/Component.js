import { ContentWindow, isNullish, fetchComponent } from './Utils';
import Schema from './Schema';
import Renderer from './Renderer';
import Registry from './Registry';

const Component = ({
  id = null,
  slug = null,
  schema: passedSchema = null,
  nebo = {},
  children,
  ...props
}) => {
  const lookupBy = id || slug || passedSchema?.id;
  const { registry = new Registry(), contentWindow = ContentWindow } = nebo;

  const [activeSchema, setActiveSchema] = Component.useSchema({ lookupBy, passedSchema });
  const [shouldFetch, setShouldFetch] = Component.useShouldFetch({
    forceFetch: nebo.shouldFetch,
    activeSchema,
    lookupBy,
  });

  Component.React.useEffect(() => {
    if (!shouldFetch || !lookupBy) return;

    (async () => {
      const schemaJSON = await fetchComponent({
        idOrSlug: lookupBy,
        accessToken: Component.directory.accessToken,
      });
      setActiveSchema(Schema.parseComponentJSON(schemaJSON));
      setShouldFetch(false);
    })();
  }, [shouldFetch, lookupBy]);

  if (!activeSchema) return null;

  return Component.React.createElement(Renderer, {
    nebo: {
      schema: activeSchema,
      registry,
      contentWindow,
      shouldFetch: nebo.shouldFetch,
    },
    ...props,
  }, children);
};

Component.useSchema = ({ lookupBy, passedSchema }) => {
  const { schemas: schemaCache } = Component.directory;
  const computedSchema = Component.React.useMemo(() => {
    let schema = passedSchema || schemaCache[lookupBy] || null;
    if (!isNullish(schema)) schema = schema?.isSchema ? schema : Schema.parseComponentJSON(schema);

    return schema;
  }, [lookupBy, passedSchema]);

  const [activeSchema, setSchema] = Component.React.useState(() => {
    const keys = Component.cache({ schema: computedSchema });
    if (computedSchema.id === passedSchema?.id) Component.expire({ keys });

    return computedSchema;
  });
  const setActiveSchema = (schema) => {
    setSchema((previous) => {
      if (previous === schema) return previous;

      Component.cache({ schema });
      return schema;
    });
  };

  Component.React.useEffect(() => {
    setActiveSchema(computedSchema);
  }, [computedSchema]);

  return [activeSchema, setActiveSchema];
};

Component.useShouldFetch = ({ forceFetch, activeSchema, lookupBy }) => {
  const computedShouldFetch = Component.React.useMemo(() => {
    if (typeof forceFetch !== 'undefined') return activeSchema ? forceFetch : true;

    return !activeSchema || Component.directory.schemaCache.isExpired(lookupBy);
  }, [forceFetch, !activeSchema, lookupBy]);
  const [shouldFetch, setShouldFetch] = Component.React.useState(computedShouldFetch);

  Component.React.useEffect(() => {
    setShouldFetch(computedShouldFetch);
  }, [computedShouldFetch]);

  return [shouldFetch, setShouldFetch];
};

Component.cache = ({ schema }) => {
  if (!schema) return [];

  const { schemas: schemaCache, neboComponents } = Component.directory;
  const cacheKeys = [schema.id, schema.slug];
  cacheKeys.forEach((key) => {
    schemaCache[key] = schema;
  });
  const subschemaCacheKeys = schema.subschemas.flatMap((subschema) => (
    Component.cache({ schema: subschema })
  ));

  neboComponents.store(schema.id, { schema, cacheKeys });
  return [...cacheKeys, ...subschemaCacheKeys];
};

Component.expire = ({ keys }) => {
  const { schemas: schemaCache } = Component.directory;
  keys.forEach((key) => schemaCache.expire(key));
  return keys;
};

Component.types = {
  component: 'Component',
  page: 'Page',
  section: 'Section',
};

export default Component;
