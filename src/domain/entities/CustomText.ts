import i18n from "../../utils/i18n";
import { TranslatableText } from "./TranslatableText";

export type CustomText = {
    rootTitle: TranslatableText;
    rootSubtitle: TranslatableText;
    rootSelectFromAllModules: TranslatableText;
};

export const CustomTextFields: (keyof CustomText)[] = ["rootTitle", "rootSubtitle", "rootSelectFromAllModules"];
export type CustomTextInfo = { [K in keyof CustomText]: string };

export function getDefaultCustomText(): CustomText {
    return {
        rootTitle: {
            key: "root-title",
            referenceValue: "Welcome to training on DHIS2",
            translations: {
                fr: i18n.t("Welcome to training on DHIS2", { lng: "fr" }),
                es: i18n.t("Welcome to training on DHIS2", { lng: "es" }),
            },
        },
        rootSubtitle: {
            key: "root-subtitle",
            referenceValue: "What do you want to learn in DHIS2?",
            translations: {
                fr: i18n.t("What do you want to learn in DHIS2?", { lng: "fr" }),
                es: i18n.t("What do you want to learn in DHIS2?", { lng: "es" }),
            },
        },
        rootSelectFromAllModules: {
            key: "module-selection",
            referenceValue: "Select a module below to learn how to use applications in DHIS2:",
            translations: {
                fr: i18n.t("Select a module below to learn how to use applications in DHIS2:", { lng: "fr" }),
                es: i18n.t("Select a module below to learn how to use applications in DHIS2:", { lng: "es" }),
            },
        },
    };
}
