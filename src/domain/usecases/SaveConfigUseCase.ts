import { UseCase } from "../../webapp/CompositionRoot";
import { ConfigRepository } from "../repositories/ConfigRepository";
import { CustomText } from "../entities/CustomText";
import { Config } from "../entities/Config";
import { Permission } from "../entities/Permission";

export type PartialConfig = Pick<Partial<Config>, "showAllModules" | "logo"> & {
    settingsPermissions?: Partial<Permission>;
    customText?: Partial<CustomText>;
};

export class SaveConfigUseCase implements UseCase {
    constructor(private configRepository: ConfigRepository) {}

    public async execute(update: PartialConfig): Promise<void> {
        const config = await this.configRepository.get();

        const updatedConfig: Config = {
            settingsPermissions: {
                users: update.settingsPermissions?.users ?? config.settingsPermissions?.users ?? [],
                userGroups: update.settingsPermissions?.userGroups ?? config.settingsPermissions?.userGroups ?? [],
            },
            showAllModules: update.showAllModules ?? config.showAllModules,
            logo: update.logo ?? config.logo,
            customText: {
                rootTitle: update.customText?.rootTitle ?? config.customText.rootTitle,
                rootSubtitle: update.customText?.rootSubtitle ?? config.customText.rootSubtitle,
            },
        };

        return await this.configRepository.save(updatedConfig);
    }
}
