import { isEqual } from 'lodash';

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

  const { metadata } = schema;
  const [currentMetadata, setCurrentMetadata] = React.useState({});

  React.useEffect(() => {
    if (isEqual(currentMetadata, metadata)) return;

    let head = contentWindow.document.querySelector('head');
    if (!head) {
      head = contentWindow.document.createElement('head');
      document.body.prepend(head);
    }

    const elements = Object.entries(metadata).map(([attribute, value]) => {
      let element;
      if (attribute === 'title') {
        element = head.querySelector('title');
        element ||= contentWindow.document.createElement('title');
        if (element.innerText !== value) element.innerText = value;
      } else {
        element = head.querySelector(`meta[name="${attribute}"]`);
        element ||= contentWindow.document.createElement('meta');
        element.name ||= attribute;
        if (element.content !== value) element.content = value;
      }
      return element;
    });

    elements.forEach((element) => head.appendChild(element));
    setCurrentMetadata((previous) => {
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

      return metadata;
    });
  }, [metadata, currentMetadata]);

  return metadata;
};

export default Head;
export { useHead };
