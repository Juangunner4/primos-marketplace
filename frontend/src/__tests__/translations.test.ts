import en from '../locales/en/en.json';
import es from '../locales/es/es.json';

describe('translation files', () => {
  it('contain matching keys between en and es', () => {
    const enKeys = new Set(Object.keys(en));
    const esKeys = new Set(Object.keys(es));

    expect(esKeys).toEqual(enKeys);
  });
});
