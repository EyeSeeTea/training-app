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

            const defaultValue = defaultCustomText[key as keyof CustomText];
            const hasEqualReferenceValue = value.referenceValue === defaultValue?.referenceValue;
            const hasEmptyOrEqualTranslation =
                isEmpty(value.translations) ||
                Object.values(value.translations || {}).every(
                    translation => !translation || translation.trim() === ""
                ) ||
                isEqual(value.translations, defaultValue?.translations);

            if (hasEqualReferenceValue && hasEmptyOrEqualTranslation) {
                return { ...acc, [key]: undefined };
            }

            return { ...acc, [key]: value };
        }, {});
    }
}
