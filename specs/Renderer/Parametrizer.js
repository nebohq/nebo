import { MockDate } from '../setup';
import Parametrizer from '../../src/Renderer/Parametrizer';
import Schema from '../../src/Schema';
import Parameters from '../../src/Parameters';
import Type from '../../src/Type';
import { isNullish } from '../../src/Utils';

describe(Parametrizer, () => {
  const setup = ({
    propValue,
    propType = Type.types.string,
    params: passedParams = {},
    passedProps = {},
  }) => {
    if (typeof propValue === 'undefined') throw new Error('Expected propValue to be defined');

    const component = new Schema.Component({ name: 'HTML.div' });
    component.body.value = propValue;
    component.body.type = propType;
    const params = new Parameters().load(component);
    Object.entries(passedParams).forEach(([name, { value, type }]) => {
      if (!(name in params.params)) return;
      const param = params.params[name];
      if (!isNullish(value)) param.defaultValue = value;
      if (!isNullish(type)) param.type = type;
    });

    return Parametrizer({
      id: component.id,
      prop: component.body,
      params,
      sourceType: 'body',
      passedProps,
    });
  };

  describe('For a string-like prop', () => {
    test('with an internal function', () => {
      expect(setup({ propValue: '{{ 1 + 2 }}' })).toEqual('3');

      MockDate.set('05/24/1991');
      expect(setup({
        propValue: '© Nebo {{ new Date().getFullYear() }}',
      })).toEqual('© Nebo 1991');

      expect(setup({
        propValue: '{{ 1 + 3 }} © Nebo {{ new Date().getFullYear() }}',
      })).toEqual('4 © Nebo 1991');

      MockDate.reset();
    });

    test('with a single parameter', () => {
      expect(setup({
        propValue: '{{helloWorld}}',
      })).toEqual('');
      expect(setup({
        propValue: '{{helloWorld}}',
        passedProps: { helloWorld: '3' },
      })).toEqual('3');

      expect(setup({
        propValue: '{{ helloWorld }}',
        params: {
          helloWorld: { value: '34' },
        },
      })).toEqual('34');

      expect(setup({
        propValue: '{{ helloWorld }} {{ helloWorld }}',
        params: {
          helloWorld: { value: '34' },
        },
      })).toEqual('34 34');

      expect(setup({
        propValue: '{{ helloWorld }}',
        params: {
          helloWorld: { value: null },
        },
      })).toEqual('');

      expect(setup({
        propValue: '{{ helloWorld }}',
        params: {
          helloWorld: { value: 3, type: Type.types.number },
        },
      })).toEqual('3');
    });

    test('with a parametrized internal function', () => {
      expect(setup({
        propValue: '{{{{ helloWorld }}(5) + 3}}',
        params: {
          helloWorld: { value: (val) => val, type: Type.types.func },
        },
      })).toEqual('8');

      expect(setup({
        propValue: '{{{{ helloWorld }}(5) + 3}}',
        params: {
          helloWorld: { value: null, type: Type.types.func },
        },
      })).toEqual('NaN');

      expect(setup({
        propValue: '{{ {{helloWorld}}(5) + {{ byeWorld }} }}',
        params: {
          helloWorld: { value: (val) => val, type: Type.types.func },
          byeWorld: { value: 3, type: Type.types.number },
        },
      })).toEqual('8');

      expect(setup({
        propValue: '{{ {{helloWorld}}(5) + {{ byeWorld }} }}',
        params: {
          helloWorld: { value: (val) => val, type: Type.types.func },
          byeWorld: { value: 3, type: Type.types.number },
        },
        passedProps: { byeWorld: 5 },
      })).toEqual('10');
    });
  });

  describe('For a non-string prop', () => {
    test('with an internal function', () => {
      expect(setup({
        propValue: '{{ 1 + 2 }}',
        propType: Type.types.number,
      })).toEqual(3);

      MockDate.set('05/24/1991');
      expect(setup({
        propValue: '{{ new Date().getFullYear() }}',
        propType: Type.types.number,
      })).toEqual(1991);

      expect(setup({
        propValue: '{{ 1 + 3 }} {{ new Date().getFullYear() }}',
        propType: Type.types.number,
      })).toEqual(4);

      MockDate.reset();
    });

    test('with a single parameter', () => {
      expect(setup({
        propValue: '{{helloWorld}}',
        propType: Type.types.number,
      })).toEqual(0);

      expect(setup({
        propValue: '{{helloWorld}}',
        propType: Type.types.number,
        passedProps: { helloWorld: '3' },
      })).toEqual(3);

      expect(setup({
        propValue: '{{helloWorld}}',
        propType: Type.types.number,
        passedProps: { helloWorld: 3 },
      })).toEqual(3);

      expect(setup({
        propValue: '{{ helloWorld }}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: '34' },
        },
      })).toEqual(34);

      expect(setup({
        propValue: '{{ helloWorld }} {{ helloWorld }}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: '34' },
        },
      })).toEqual(34);

      expect(setup({
        propValue: '{{ helloWorld }}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: null },
        },
      })).toEqual(0);

      expect(setup({
        propValue: '{{ helloWorld }}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: 3, type: Type.types.number },
        },
      })).toEqual(3);
    });

    test('with a parametrized internal function', () => {
      expect(setup({
        propValue: '{{{{ helloWorld }}(5) + 3}}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: (val) => val, type: Type.types.func },
        },
      })).toEqual(8);

      expect(setup({
        propValue: '{{{{ helloWorld }}(5) + 3}}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: null, type: Type.types.func },
        },
      })).toBeNaN();

      expect(setup({
        propValue: '{{ {{helloWorld}}(5) + {{ byeWorld }} }}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: (val) => val, type: Type.types.func },
          byeWorld: { value: 3, type: Type.types.number },
        },
      })).toEqual(8);

      expect(setup({
        propValue: '{{ {{helloWorld}}(5) + {{ byeWorld }} }}',
        propType: Type.types.number,
        params: {
          helloWorld: { value: (val) => val, type: Type.types.func },
          byeWorld: { value: 3, type: Type.types.number },
        },
        passedProps: { byeWorld: 5 },
      })).toEqual(10);
    });
  });
});
