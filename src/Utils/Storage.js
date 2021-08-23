import ContentWindow from './ContentWindow';

const { localStorage } = ContentWindow;
const Storage = (storageKey, {
  parser: passedParser = (value) => value,
  override = null,
  cacheFor: cacheForMillis,
}) => {
  const getKeyAsObject = (key) => (
    JSON.parse(localStorage.getItem(key) || 'null') || {}
  );

  let parser = passedParser;
  const storage = override || getKeyAsObject(storageKey);

  const objectsCachedAt = new Proxy(
    Object.entries(getKeyAsObject(`${storageKey}.cachedAt`)).reduce((acc, [type, time]) => {
      acc[type] = new Date(Date.parse(time));
      return acc;
    }, {}),
    {
      get: (target, property) => {
        if (property in target) return target[property];

        return new Date(0); // beginning of time
      },
      set: (target, property, value) => {
        target[property] = value;
        localStorage.setItem(`${storageKey}.cachedAt`, JSON.stringify(target));
        return true;
      },
    },
  );

  const isCacheExpired = (key, atTime = new Date()) => (
    (atTime - objectsCachedAt[key]) > cacheForMillis
  );
  const expireCache = (key) => {
    delete objectsCachedAt[key];
  };

  return new Proxy(storage, {
    get: (target, property) => {
      if (property === 'cachedAt') return objectsCachedAt;
      if (property === 'parser') return parser;
      if (property === 'isExpired') return isCacheExpired;
      if (property === 'expire') return expireCache;

      return property in target ? parser(target[property]) : undefined;
    },

    set: (target, property, value) => {
      if (property === 'parser') {
        parser = value;
        return true;
      }

      target[property] = value;
      objectsCachedAt[property] = new Date();

      let jsonValue = target;
      if (typeof target === 'object') {
        jsonValue = Object.entries(target).reduce((acc, [propName, propValue]) => {
          if (typeof propValue === 'object' && 'toJSON' in propValue) {
            acc[propName] = propValue.toJSON();
          } else {
            acc[propName] = propValue;
          }
          acc[propName] = propValue || propValue;
          return acc;
        }, {});
      }
      localStorage.setItem(storageKey, JSON.stringify(jsonValue));

      return true;
    },
  });
};

export default Storage;
