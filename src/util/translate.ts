import { translations as englishTranslations } from "../translations/en";
import { translations as spanishTranslations } from "../translations/es";

const translations: Record<string, any> = {
    "en": englishTranslations,
    "es": spanishTranslations,
}

export const getTranslator = (language: string) => {
    const translate = (textCode: string): string => {
        const languageTranslations = translations[language] || translations['es'];
        return languageTranslations[textCode] || translations['es'][textCode] || "";
    };
    return translate;
};

