import { useTranslation } from "react-i18next";
import { supportedLanguages, type SupportedLanguage } from "../i18n";

const languageLabels: Record<SupportedLanguage, string> = {
  en: "EN",
  ru: "RU",
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLanguage = getCurrentLanguage(i18n.language);

  return (
    <div
      className={`language-switcher language-switcher-${currentLanguage}`}
      aria-label={t("common.language")}
    >
      <span className="language-switcher-thumb" aria-hidden="true" />
      {supportedLanguages.map((language) => (
        <button
          aria-pressed={currentLanguage === language}
          className={currentLanguage === language ? "active" : ""}
          key={language}
          onClick={() => void i18n.changeLanguage(language)}
          type="button"
        >
          {languageLabels[language]}
        </button>
      ))}
    </div>
  );
}

function getCurrentLanguage(language: string): SupportedLanguage {
  return language.startsWith("ru") ? "ru" : "en";
}
