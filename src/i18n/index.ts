import en from './en.json';

export type StringKey = keyof typeof en;

/** The current language: English only for now; Italian arrives in a later iteration. */
export function language(): string {
  return 'en';
}

/** UI strings. English only for now; Italian arrives in a later iteration. */
export function t(key: StringKey): string {
  return en[key];
}
