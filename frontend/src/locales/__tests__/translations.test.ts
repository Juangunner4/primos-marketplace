import en from '../en/en.json';
import es from '../es/es.json';

describe('translation keys', () => {
  test('es matches en keys', () => {
    const enKeys = Object.keys(en).sort();
    const esKeys = Object.keys(es).sort();
    expect(esKeys).toEqual(enKeys);
  });
});
