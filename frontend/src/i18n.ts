import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/en.json';
import es from './locales/es/es.json';
import pt from './locales/pt/pt.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;