import { canUseDOM } from '../Utils';

const useHead = ({ metadata, React, contentWindow }) => {
  const { useEffect, useState } = React;
  const [currentMetadata, setCurrentMetadata] = useState({});

  useEffect(() => {
    if (!canUseDOM) return;
    if (useHead.isMetadataEqual(currentMetadata, metadata)) return;

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

  useHead.state = new useHead.State(metadata, React);
  return useHead.state;
};

useHead.isMetadataEqual = (current, updated) => {
  const [currentEntries, updatedEntries] = [current, updated].map((metadata) => (
    Object.entries(metadata)
  ));

  if (currentEntries.length !== updatedEntries.length) return false;

  return !currentEntries.some(([attribute, value]) => updated[attribute] !== value);
};

useHead.State = class State {
  constructor(metadata, React) {
    this.metadata = metadata;
    this.React = React;
  }

  toString() {
    const HTMLElements = Object.entries(this.metadata).map(([attribute, value]) => {
      let elementHTML;
      if (attribute === 'title') {
        elementHTML = `<title>${value}</title>`;
      } else {
        elementHTML = `<meta name="${attribute}" content="${value}" />`;
      }
      return elementHTML;
    });

    return HTMLElements.join('\n');
  }

  toComponent() {
    const components = Object.entries(this.metadata).map(([attribute, value]) => {
      let component;
      if (attribute === 'title') {
        component = this.React.createElement('title', { key: `meta-${attribute}` }, value);
      } else {
        component = this.React.createElement('meta', {
          key: `meta-${attribute}`,
          name: attribute,
          content: value,
        });
      }
      return component;
    });

    return this.React.createElement(this.React.Fragment, {}, components);
  }
};

useHead.state = null;

export default useHead;
