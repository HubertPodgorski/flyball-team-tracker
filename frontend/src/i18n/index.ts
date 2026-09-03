import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

// Mirrors AuthContext's getInitialUser() read - kept standalone to avoid a
// circular import, since i18n needs to initialize before React renders.
const getInitialLanguage = (): "en" | "pl" => {
  try {
    const userLocalstorage = localStorage.getItem("user");

    if (!userLocalstorage) return "pl";

    const { user } = JSON.parse(userLocalstorage);

    return user?.language === "en" ? "en" : "pl";
  } catch {
    return "pl";
  }
};

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
  },
  lng: getInitialLanguage(),
  fallbackLng: "pl",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
