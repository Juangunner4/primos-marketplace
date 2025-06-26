import i18n from './i18n';

describe('i18n configuration', () => {
  test('loads Portuguese translations', () => {
    expect(i18n.t('welcome_message', { lng: 'pt' })).toBe(
      'Bem-vindo ao Primos Marketplace!'
    );
  });
});
