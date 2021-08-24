import { isEqual } from 'lodash';
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
      ...(!!nebo.stylesheet && { stylesheet: nebo.stylesheet }),
    },
    ...props,
  }, children);
};

Component.useSchema = ({ lookupBy, passedSchema }) => {
  const { schemas: schemaCache } = Component.directory;
  const [isClient, setIsClient] = Component.React.useState(false);
  Component.React.useEffect(() => {
    setIsClient(true);
  }, []);

  const computedSchema = Component.React.useMemo(() => {
    const cachedSchema = schemaCache[lookupBy];
    let schema = isClient ? (cachedSchema || passedSchema) : (passedSchema || cachedSchema);
    if (!isNullish(schema)) schema = schema?.isSchema ? schema : Schema.parseComponentJSON(schema);

    return schema;
  }, [lookupBy, passedSchema, isClient]);

  const [activeSchema, setSchema] = Component.React.useState(() => {
    Component.cache({ schema: computedSchema, self: false });
    return computedSchema;
  });

  const setActiveSchema = (schema) => {
    setSchema((previous) => {
      if (isEqual(previous, schema)) return previous;

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

Component.cache = ({ schema, self = true }) => {
  if (!schema) return [];

  const { schemas: schemaCache, neboComponents } = Component.directory;
  const cacheKeys = [];
  if (self) {
    cacheKeys.push(schema.id, schema.slug);
    cacheKeys.forEach((key) => {
      schemaCache[key] = schema;
    });
  }
  schema.subschemas.forEach((subschema) => {
    if (subschema.id === schema.id) return;
    Component.cache({ schema: subschema });
  });
  neboComponents.store(schema.id, { schema, cacheKeys });

  return cacheKeys;
};

Component.types = {
  component: 'Component',
  page: 'Page',
  section: 'Section',
};

export default Component;
