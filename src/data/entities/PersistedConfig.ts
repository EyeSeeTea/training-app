import { CustomText } from "../../domain/entities/CustomText";
import { Config } from "../../domain/entities/Config";

export type PersistedConfig = Pick<Partial<Config>, "showAllModules" | "logo" | "settingsPermissions"> & {
    customText?: Partial<CustomText>;
};
