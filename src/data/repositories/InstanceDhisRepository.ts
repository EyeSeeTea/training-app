import { InstalledApp } from "../../domain/entities/InstalledApp";
import { InstanceRepository } from "../../domain/repositories/InstanceRepository";
import { D2Api } from "../../types/d2-api";
import { cache, clearCache } from "../../utils/cache";
import { UserSearch } from "../entities/SearchUser";
import { fetchInstalledApps } from "../utils/installedApps";

export class InstanceDhisRepository implements InstanceRepository {
    constructor(private api: D2Api) {}

    public async installApp(appName: string): Promise<boolean> {
        const storeApps = await this.listStoreApps();
        const { versions = [] } = storeApps.find(({ name }) => name === appName) ?? {};
        const latestVersion = versions[0]?.id;
        if (!latestVersion) return false;

        try {
            await this.api.appHub.install(latestVersion).getData();
            clearCache(this.listInstalledApps, this);
        } catch (error: any) {
            return false;
        }

        return true;
    }

    public async searchUsers(query: string): Promise<UserSearch> {
        const options = {
            fields: { id: true, displayName: true },
            filter: { displayName: { ilike: query } },
        };

        return this.api.metadata.get({ users: options, userGroups: options }).getData();
    }

    @cache()
    public async listInstalledApps(): Promise<InstalledApp[]> {
        return fetchInstalledApps(this.api);
    }

    private async listStoreApps() {
        try {
            return this.api.appHub.list().getData();
        } catch (error: any) {
            console.error(error);
            return [];
        }
    }
}
