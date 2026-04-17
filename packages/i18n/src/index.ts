import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import dz from './locales/dz.json';

export type SupportedLanguage = 'en' | 'dz';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'dz', label: 'Dzongkha', nativeLabel: 'རྫོང་ཁ།' },
];

export const resources = { en: { translation: en }, dz: { translation: dz } };

export function initI18n(lng: SupportedLanguage = 'en') {
  if (i18n.isInitialized) return i18n;
  i18n.use(initReactI18next).init({
    lng,
    fallbackLng: 'en',
    resources,
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });
  return i18n;
}

export { i18n };
export { en, dz };

// Dzongkha numeral conversion
const DZ_NUMERALS = ['༠', '༡', '༢', '༣', '༤', '༥', '༦', '༧', '༨', '༩'];

export function toDzongkhaNumeral(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => DZ_NUMERALS[parseInt(d)]);
}

export function formatNu(amount: number, useDzNumerals = false): string {
  const formatted = `Nu. ${amount.toLocaleString('en-IN')}`;
  return useDzNumerals ? toDzongkhaNumeral(formatted) : formatted;
}
