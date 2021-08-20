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
    Component.cache({ schema: computedSchema, self: false });
    return computedSchema;
  });
  const setActiveSchema = (schema) => {
    Component.cache({ schema });
    setSchema(schema);
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

Component.cache = ({ schema, self = true, subschemas = true }) => {
  if (!schema) return;

  const { schemas: schemaCache, neboComponents } = Component.directory;

  if (self) {
    schemaCache[schema.id] = schema;
    schemaCache[schema.slug] = schema;
  }
  if (subschemas) {
    schema.subschemas.forEach((subschema) => {
      Component.cache({ schema: subschema, subschemas: false });
    });
  }

  neboComponents.store(schema.id, { schema, cacheKeys: [schema.id, schema.slug] });
};

Component.types = {
  component: 'Component',
  page: 'Page',
  section: 'Section',
};

export default Component;
