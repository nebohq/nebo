const Head = ({ schema }) => {
  const { metadata = {} } = schema;
  const { React } = Head;

  return Object.entries(metadata).map(([attribute, value]) => {
    let component;
    if (attribute === 'title') {
      component = React.createElement('title', { key: `meta-${attribute}` }, value);
    } else {
      component = React.createElement('meta', {
        key: `meta-${attribute}`,
        name: attribute,
        content: value,
      });
    }
    return component;
  });
};

const useHead = ({ schema, contentWindow }) => {
  const { React } = Head;

  const head = React.useMemo(() => {
    let element = contentWindow.document.querySelector('head');
    if (!element) {
      element = contentWindow.document.createElement('head');
      document.prepend(element);
    }
    return element;
  }, []);

  const [_metadataState, setMetadataState] = React.useState({
    current: {},
    previous: null,
  });

  React.useEffect(() => {
    setMetadataState((state) => {
      if (state && useHead.isEqual(schema.metadata, state.current)) return state;

      const newState = {
        current: { ...schema.metadata },
        previous: state.current,
      };

      useHead.updateHead(head, newState);

      return newState;
    });
  }, [schema.metadata]);

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setMetadataState((state) => {
        useHead.updateHead(head, state);
        return state;
      });
    });
    observer.observe(head, { subtree: true, childList: true });
  }, []);

  return schema.metadata;
};

useHead.updateHead = (head, { current: metadata, previous }) => {
  const document = head.ownerDocument;
  const elements = Object.entries(metadata).map(([attribute, value]) => {
    let element;
    if (attribute === 'title') {
      element = head.querySelector('title');
      element ||= document.createElement('title');
      if (element.innerText !== value) element.innerText = value;
    } else {
      element = head.querySelector(`meta[name="${attribute}"]`);
      element ||= document.createElement('meta');
      element.name ||= attribute;
      if (element.content !== value) element.content = value;
    }
    return element;
  });

  elements.forEach((element) => {
    if (head.contains(element)) return;
    head.appendChild(element);
  });

  const previousAttributes = Object.keys(previous);
  const currentAttributes = new Set(Object.keys(metadata));
  const removedAttributes = previousAttributes.filter((attribute) => (
    !currentAttributes.has(attribute)
  ));

  removedAttributes.forEach((attribute) => {
    let element;
    if (attribute === 'title') {
      element = head.querySelector('title');
    } else {
      element = head.querySelector(`meta[name="${attribute}"]`);
    }
    element?.remove();
  });
};

useHead.isEqual = (previous, current) => {
  const [previousEntries, currentEntries] = [previous, current].map((metadata) => (
    Object.entries(metadata)
  ));

  if (previousEntries.length !== currentEntries.length) return false;

  return !previousEntries.some(([attribute, value]) => current[attribute] !== value);
};

export default Head;
export { useHead };
