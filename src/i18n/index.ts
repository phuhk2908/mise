import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import vi from "./locales/vi.json";
import en from "./locales/en.json";

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

const locales = Localization.getLocales();
const deviceLocale = locales[0]?.languageCode ?? "vi";
const defaultLng = deviceLocale === "en" ? "en" : "vi";

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLng,
  fallbackLng: "vi",
  interpolation: {
    escapeValue: false,
  },
});

export function changeLanguage(lng: "vi" | "en") {
  i18n.changeLanguage(lng);
}

export function getCurrentLanguage(): "vi" | "en" {
  return (i18n.language as "vi" | "en") ?? "vi";
}

export default i18n;
