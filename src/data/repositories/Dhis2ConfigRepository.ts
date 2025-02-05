import { ConfigRepository } from "../../domain/repositories/ConfigRepository";
import { D2Api } from "../../types/d2-api";
import { cache } from "../../utils/cache";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { defaultConfig, PersistedConfig } from "../entities/PersistedConfig";
import { User } from "../entities/User";
import { importTranslate, TranslatableText } from "../../domain/entities/TranslatableText";
import _ from "lodash";
import { CustomText } from "../../domain/entities/CustomText";

export class Dhis2ConfigRepository implements ConfigRepository {
    private storageClient: StorageClient;

    constructor(private api: D2Api) {
        this.storageClient = new DataStoreStorageClient("global", api);
    }

    // FIXME: This method is being used in other repositories, something that shouldn't happen (code smell)
    @cache()
    public async getUser(): Promise<User> {
        const d2User = await this.api.currentUser
            .get({
                fields: {
                    id: true,
                    displayName: true,
                    userGroups: { id: true, name: true },
                    userCredentials: {
                        username: true,
                        userRoles: { id: true, name: true, authorities: true },
                    },
                    settings: { keyUiLocale: true },
                },
            })
            .getData();

        return {
            id: d2User.id,
            name: d2User.displayName,
            userGroups: d2User.userGroups,
            ...d2User.userCredentials,
        };
    }

    private async getConfig() {
        return this.storageClient.getObject<PersistedConfig>(Namespaces.CONFIG);
    }

    public async get(): Promise<PersistedConfig> {
        const config = (await this.getConfig()) ?? {};
        return {
            ...defaultConfig,
            ...config,
        };
    }

    public async save(update: PersistedConfig): Promise<PersistedConfig> {
        const config = await this.getConfig();
        const updatedConfig = {
            ...config,
            ...update,
        };

        return this.storageClient
            .saveObject<PersistedConfig>(Namespaces.CONFIG, updatedConfig)
            .then(() => updatedConfig);
    }

    public async importTranslations(language: string, terms: Record<string, string>): Promise<TranslatableText[]> {
        const config = await this.getConfig();

        if (!config?.customText) return [];
        const { customText } = config;

        const translatedText: Partial<CustomText> = {
            ...customText,
            root_title: customText.root_title
                ? importTranslate(customText.root_title, language, terms[customText.root_title.key])
                : undefined,
            root_subtitle: customText.root_subtitle
                ? importTranslate(customText.root_subtitle, language, terms[customText.root_subtitle.key])
                : undefined,
        };

        const updatedConfig = await this.save({ customText: translatedText });

        return this.extractTranslatableText(updatedConfig);
    }

    public async extractTranslations(): Promise<TranslatableText[]> {
        const config = await this.getConfig();
        return this.extractTranslatableText(config ?? {});
    }

    private extractTranslatableText(config: PersistedConfig): TranslatableText[] {
        return _.compact(_.values(config.customText));
    }
}
