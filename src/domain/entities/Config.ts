import { Permission } from "./Permission";
import { CustomText, getDefaultCustomText } from "./CustomText";

export type Config = {
    settingsPermissions: Permission;
    showAllModules: boolean;
    logo: string;
    customText: CustomText;
};

export type PartialConfig = Pick<Partial<Config>, "showAllModules" | "logo"> & {
    settingsPermissions?: Partial<Permission>;
    customText?: Partial<CustomText>;
};

export function getDefaultConfig(): Config {
    return {
        showAllModules: true,
        settingsPermissions: { users: [], userGroups: [] },
        customText: getDefaultCustomText(),
        logo: "",
    };
}
