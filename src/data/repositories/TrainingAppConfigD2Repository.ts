import { TrainingAppConfig, TrainingAppConfigEntry } from "../../domain/entities/TrainingAppConfig";
import { TrainingAppConfigRepository } from "../../domain/repositories/TrainingAppConfigRepository";
import { D2Api } from "../../types/d2-api";
import { dataStoreNamespace, Namespaces } from "../clients/storage/Namespaces";
import { PersistedConfig } from "../entities/PersistedConfig";

export class TrainingAppConfigD2Repository implements TrainingAppConfigRepository {
    constructor(private api: D2Api) {}

    public async get(): Promise<TrainingAppConfig> {
        const dataStore = this.api.dataStore(dataStoreNamespace);
        const keys = await dataStore.getKeys().getData();

        const entries: TrainingAppConfigEntry[] = [];
        for (const key of keys) {
            const value = await dataStore.get<object>(key).getData();
            if (value !== undefined) entries.push({ key, value });
        }

        const config = await dataStore.get<PersistedConfig>(Namespaces.CONFIG).getData();
        const permissions = config?.settingsPermissions;
        const settingsPermissions = permissions
            ? { users: permissions.users ?? [], userGroups: permissions.userGroups ?? [] }
            : undefined;

        return { entries, settingsPermissions };
    }

    public async saveEntry(entry: TrainingAppConfigEntry): Promise<void> {
        await this.api.dataStore(dataStoreNamespace).save(entry.key, entry.value).getData();
    }
}
