import { Permission } from "./Permission";
import { CustomText, getDefaultCustomText } from "./CustomText";

export type Config = {
    settingsPermissions: Permission;
    showAllModules: boolean;
    logo: string;
    customText: CustomText;
};

export function getDefaultConfig(): Config {
    return {
        showAllModules: true,
        settingsPermissions: { users: [], userGroups: [] },
        customText: getDefaultCustomText(),
        logo: "",
    };
}
