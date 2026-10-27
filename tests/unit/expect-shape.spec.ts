import { expect, test } from '@playwright/test';
import { expectShape, type Contract } from '@src/api/api-client';

const contract: Contract = {
  name: 'string',
  count: 'integer',
  ratio: 'number',
  active: 'boolean',
  meta: 'object',
  tags: 'array',
};

const valid = () => ({ name: 'a', count: 2, ratio: 0.5, active: true, meta: {}, tags: [] as unknown[] });

test('accepts a matching payload and ignores extra fields', () => {
  expect(expectShape({ ...valid(), extra: 'fine' }, contract)).toEqual([]);
});

const wrongTypes: [string, unknown, string][] = [
  ['count', 2.5, 'number'],
  ['count', '2', 'string'],
  ['ratio', '0.5', 'string'],
  ['active', 1, 'number'],
  ['meta', [], 'array'],
  ['meta', null, 'null'],
  ['tags', {}, 'object'],
  ['name', undefined, 'undefined'],
];

for (const [field, value, reported] of wrongTypes) {
  test(`reports ${field}=${JSON.stringify(value) ?? 'undefined'} as ${reported}`, () => {
    expect(expectShape({ ...valid(), [field]: value }, contract)).toEqual([`wrong type for ${field}: ${reported}`]);
  });
}

test('integer fields accept whole numbers written as floats', () => {
  expect(expectShape({ ...valid(), count: 3.0 }, contract)).toEqual([]);
});

test('reports every problem, in contract order', () => {
  expect(expectShape({ count: 'x', ratio: 1 }, contract)).toEqual([
    'missing field: name',
    'wrong type for count: string',
    'missing field: active',
    'missing field: meta',
    'missing field: tags',
  ]);
});
