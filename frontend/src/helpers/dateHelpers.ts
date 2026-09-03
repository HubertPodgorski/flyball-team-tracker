import { pl } from "date-fns/locale/pl";
import { enUS } from "date-fns/locale/en-US";
import { format } from "date-fns";
import i18next from "../i18n";

const locales = { en: enUS, pl };

export const formatDate = (date: string | Date, dateFormat: string) =>
  format(date, dateFormat, {
    locale: locales[i18next.language === "en" ? "en" : "pl"],
  });
