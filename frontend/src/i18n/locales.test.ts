import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

// A pluralized key missing a category its language needs falls back to no
// translation at all - i18next renders the raw key path instead.
const PLURAL_SUFFIXES = ["_zero", "_one", "_two", "_few", "_many", "_other"];

type LocaleValue = string | string[] | { [key: string]: LocaleValue };

const flatten = (tree: Record<string, LocaleValue>, prefix = ""): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    // Arrays are lists of display strings (e.g. About page bullet points),
    // not individually pluralizable keys - nothing here needs their content.
    if (typeof value === "string") {
      acc[path] = value;
    } else if (!Array.isArray(value)) {
      Object.assign(acc, flatten(value, path));
    }

    return acc;
  }, {});

const pluralBaseKeys = (flat: Record<string, string>): Set<string> => {
  const bases = new Set<string>();

  for (const key of Object.keys(flat)) {
    const suffix = PLURAL_SUFFIXES.find((candidate) => key.endsWith(candidate));

    if (suffix) bases.add(key.slice(0, -suffix.length));
  }

  return bases;
};

describe("locale plural completeness", () => {
  it.each([
    { locale: "en", tree: en },
    { locale: "pl", tree: pl },
  ])("every pluralized key in $locale has all the categories that locale's grammar needs", ({ locale, tree }) => {
    const flat = flatten(tree);
    const bases = pluralBaseKeys(flat);
    const requiredCategories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;

    for (const base of bases) {
      const missing = requiredCategories.filter((category) => !(`${base}_${category}` in flat));

      expect(missing, `${locale}: "${base}" is missing plural categories`).toEqual([]);
    }
  });
});

// Reduces every key to what a t() call actually looks up: a plural suffix
// collapses to its base, since which suffixes exist is grammar-dependent
// and already checked above - what matters here is the same base translates
// in both locales.
const translationIdentifiers = (flat: Record<string, string>): Set<string> => {
  const bases = pluralBaseKeys(flat);
  const plain = Object.keys(flat).filter(
    (key) => !PLURAL_SUFFIXES.some((suffix) => key.endsWith(suffix))
  );

  return new Set([...plain, ...bases]);
};

describe("locale key parity", () => {
  it("en and pl translate exactly the same set of keys", () => {
    const enKeys = translationIdentifiers(flatten(en));
    const plKeys = translationIdentifiers(flatten(pl));

    expect([...enKeys].filter((key) => !plKeys.has(key)), "missing from pl").toEqual([]);
    expect([...plKeys].filter((key) => !enKeys.has(key)), "missing from en").toEqual([]);
  });
});
