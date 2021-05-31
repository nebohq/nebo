class Enumerable {
  forEach(...args) {
    return this.iterable().forEach(...args);
  }

  find(...args) {
    return this.iterable().find(...args);
  }

  map(...args) {
    return this.iterable().map(...args);
  }

  filter(...args) {
    return this.iterable().filter(...args);
  }

  reduce(...args) {
    return this.iterable().reduce(...args);
  }

  some(func = () => true) {
    return this.iterable().some(func);
  }
}

export default Enumerable;
