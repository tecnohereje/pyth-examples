import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esTranslation from './es.json';
import enTranslation from './en.json';

const resources = {
  es: {
    translation: esTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // idioma por defecto
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react ya hace sanitize
    }
  });

export default i18n;
