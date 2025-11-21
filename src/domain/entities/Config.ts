import { Permission } from "./Permission";
import { CustomText, getDefaultCustomText } from "./CustomText";
import { Maybe, RecursivePartial } from "../../types/utils";

export type Config = {
    settingsPermissions: Permission;
    showAllModules: boolean;
    logo: string;
    customText: CustomText;
    containerConfig: ContainerConfig;
};

export type PartialConfig = RecursivePartial<Config>;

export function getDefaultConfig({ isDefault }: { isDefault?: Maybe<boolean> } = {}): Config {
    return {
        showAllModules: true,
        settingsPermissions: { users: [], userGroups: [] },
        customText: getDefaultCustomText({ isDefault }),
        logo: "",
        containerConfig: defaultContainerConfig,
    };
}

export type SideBarConfig = {
    type: "sidebar";
    position: "left" | "right";
    width: number;
    unit: "px" | "%";
};
type DialogConfig = { type: "dialog" };
export type ContainerConfig = SideBarConfig | DialogConfig;

export const defaultContainerConfig: SideBarConfig = { type: "sidebar", position: "right", width: 30, unit: "%" };
