import Type from '../src/Type';

describe(Type, () => {
  describe('types conversions', () => {
    const setup = (type) => (value) => Type.types[type].convert(value);

    test('string', () => {
      const convert = setup('string');
      expect(convert(5)).toEqual('5');
      expect(convert(false)).toEqual('false');
      expect(convert('taco')).toEqual('taco');
      expect(convert(null)).toEqual('');
    });

    test('bool', () => {
      const convert = setup('bool');
      expect(convert(false)).toEqual(false);
      expect(convert(true)).toEqual(true);
      expect(convert('55')).toEqual(true);
      expect(convert('')).toEqual(false);
      expect(convert('true')).toEqual(true);
      expect(convert('false')).toEqual(false);
    });

    test('number', () => {
      const convert = setup('number');
      expect(convert(3)).toEqual(3);
      expect(convert('3')).toEqual(3);
      expect(convert('')).toEqual(0);
      expect(convert(() => {})).toBeNaN();
    });

    test('object', () => {
      const convert = setup('object');
      expect(convert('{ foo: "bar" }')).toEqual({ foo: 'bar' });
      expect(convert({ foo: 'bar' })).toEqual({ foo: 'bar' });
      expect(convert(null)).toEqual(null);
      expect(convert(55)).toEqual({});
    });

    test('array', () => {
      const convert = setup('array');
      expect(convert('["a", "b", 3]')).toEqual(['a', 'b', 3]);
      expect(convert(['a', 'b', 3])).toEqual(['a', 'b', 3]);
      expect(convert('"foobar"')).toEqual(['f', 'o', 'o', 'b', 'a', 'r']);
      expect(convert(3)).toEqual([]);
      expect(convert(null)).toEqual([]);
    });

    test('func', () => {
      const convert = setup('func');
      expect(convert('() => 5')()).toEqual(5);
      expect(convert(() => 5)()).toEqual(5);
      expect(typeof convert(null)).toEqual('function');
    });

    test('symbol', () => {
      const convert = setup('symbol');
      expect(convert(Symbol.for('a'))).toEqual(Symbol.for('a'));
      expect(convert('a')).toEqual(Symbol.for('a'));
      expect(convert(5)).toEqual(Symbol.for('5'));
      expect(convert(null)).toEqual(null);
    });

    test('node', () => {
      const convert = setup('node');
      expect(convert(5)).toEqual(5);
      expect(convert('taco')).toEqual('taco');
      expect(convert([])).toEqual([]);
    });
  });
});
