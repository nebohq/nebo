import { humanize, kebabCase } from '../src/Utils';

describe('Utils', () => {
  test('humanize', () => {
    expect(humanize('')).toEqual('');
    expect(humanize('carnivalTacos')).toEqual('Carnival tacos');
    expect(humanize('carnivalTacos', true)).toEqual('Carnival Tacos');
    expect(humanize('carnival tacos are for friends', true)).toEqual('Carnival Tacos Are For Friends');
  });

  test('kebabCase', () => {
    expect(kebabCase('')).toEqual('');
    expect(kebabCase('carnivalTacos')).toEqual('carnival-tacos');
    expect(kebabCase('carnival_tacos')).toEqual('carnival-tacos');
    expect(kebabCase('carnival tacos')).toEqual('carnival-tacos');
  });
});
