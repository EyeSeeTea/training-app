import { isEmpty, isEqual } from "lodash";

import { UseCase } from "../../webapp/CompositionRoot";
import { ConfigRepository } from "../repositories/ConfigRepository";
import { CustomText, getDefaultCustomText } from "../entities/CustomText";
import { Config, PartialConfig } from "../entities/Config";

export class SaveConfigUseCase implements UseCase {
    constructor(private configRepository: ConfigRepository) {}

    public async execute(config: PartialConfig): Promise<Config> {
        const { customText, ...rest } = config;

        const configUpdates = {
            ...rest,
            ...(customText && { customText: this.cleanCustomText(customText) }),
        };

        return await this.configRepository.save(configUpdates);
    }

    private cleanCustomText(customText: Partial<CustomText>): PartialConfig["customText"] {
        const defaultCustomText = getDefaultCustomText();

        return Object.entries(customText).reduce((acc, [key, value]) => {
            if (isEmpty(value)) return acc;
            else if (isEqual(value, defaultCustomText[key as keyof CustomText]) || !value.referenceValue)
                return { ...acc, [key]: undefined };
            else return { ...acc, [key]: value };
        }, {});
    }
}
