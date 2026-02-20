const normalizeLocale = (lang?: string) => {
  if (!lang) return undefined;
  if (lang.startsWith("ar")) return "ar";
  if (lang.startsWith("fr")) return "fr";
  return "en";
};

export const formatNumber = (value: number | null | undefined, lang?: string) => {
  const locale = normalizeLocale(lang);
  const formatter = new Intl.NumberFormat(locale);
  return formatter.format(value ?? 0);
};

export const formatNumericText = (text: string | null | undefined, lang?: string) => {
  if (!text) return "";
  return text.replace(/\d+/g, (match) => formatNumber(Number(match), lang));
};

export const getDocumentLocale = () => {
  if (typeof document !== "undefined") {
    const docLang = document.documentElement.lang || document.documentElement.getAttribute("lang");
    if (docLang) return normalizeLocale(docLang);
  }
  if (typeof navigator !== "undefined") {
    return normalizeLocale(navigator.language);
  }
  return undefined;
};
