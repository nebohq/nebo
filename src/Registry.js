import { Enumerable } from './Utils';

class Registry extends Enumerable {
  constructor() {
    super();
    this.map = {};
    this.entries = [];
    this.onClearCallback = () => {};
  }

  add(neboComponent, reactComponent) {
    if (neboComponent.id in this.map) {
      const existing = this.map[neboComponent.id];
      Object.assign(existing, { nebo: neboComponent, react: reactComponent });
      return this;
    }

    const entry = new Registry.Entry({
      react: reactComponent,
      nebo: neboComponent,
    });
    this.map[neboComponent.id] = entry;
    this.entries.push(entry);

    return this;
  }

  loadNodes(rootElement) {
    // eslint-disable-next-line no-underscore-dangle
    const fiber = rootElement._reactRootContainer._internalRoot.current;
    const missingElement = document.createElement('div');
    this.entries.forEach((entry) => {
      entry.dom = entry.findNode(fiber) || missingElement;
    });
  }

  iterable() {
    return this.entries;
  }

  enqueueClear() {
    this.shouldClear = true;
  }

  dequeueClear() {
    if (this.shouldClear) this.clear();
  }

  clear() {
    this.map = {};
    this.entries = [];
    if (setTimeout) setTimeout(this.onClearCallback, 0);
  }

  onClear(callback) {
    this.onClearCallback = callback || (() => {});
  }
}

Registry.Entry = class Entry {
  constructor({ react, nebo }) {
    this.react = react;
    this.nebo = nebo;
    this.dom = null;
    this.keyMatcher = new RegExp(`${this.react.key}$`);
  }

  findNode(fiber, foundParent = false) {
    if (fiber === null) return null;
    if (foundParent && fiber.stateNode?.addEventListener) return fiber.stateNode;

    // eslint-disable-next-line no-param-reassign
    if (this.keyMatcher.test(fiber.key)) foundParent = true;

    const child = this.findNode(fiber.child, foundParent);
    if (child) return child;
    return this.findNode(fiber.sibling, foundParent);
  }
};

export default Registry;
