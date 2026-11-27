import _ from "lodash";
import { InstalledApp } from "../../domain/entities/InstalledApp";
import { Permission } from "../../domain/entities/Permission";
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

    public async getUsersAndGroups(ids: { userIds: string[]; userGroupIds: string[] }): Promise<Permission> {
        const { userIds, userGroupIds } = ids;

        const [users, userGroups] = await Promise.all([
            _.isEmpty(userIds)
                ? []
                : this.api.models.users
                      .get({ fields: { id: true, name: true }, filter: { id: { in: userIds } }, paging: false })
                      .getData()
                      .then(res => res.objects),
            _.isEmpty(userGroupIds)
                ? []
                : this.api.models.userGroups
                      .get({ fields: { id: true, name: true }, filter: { id: { in: userGroupIds } }, paging: false })
                      .getData()
                      .then(res => res.objects),
        ]);

        return { users, userGroups };
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
