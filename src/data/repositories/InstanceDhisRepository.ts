import { InstalledApp } from "../../domain/entities/InstalledApp";
import { InstanceRepository } from "../../domain/repositories/InstanceRepository";
import { D2Api } from "../../types/d2-api";
import { cache } from "../../utils/cache";
import { UserSearch } from "../entities/SearchUser";

export class InstanceDhisRepository implements InstanceRepository {
    constructor(private api: D2Api) {}

    public async installApp(appName: string): Promise<boolean> {
        const storeApps = await this.listStoreApps();
        const { versions = [] } = storeApps.find(({ name }) => name === appName) ?? {};
        const latestVersion = versions[0]?.id;
        if (!latestVersion) return false;

        try {
            await this.api.appHub.install(latestVersion).getData();
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
        const apps = await this.api.get<DhisInstalledApp[]>("/apps").getData();

        return apps.map(app => ({
            name: app.name,
            version: app.name,
            fullLaunchUrl: app.launchUrl,
            launchUrl: (app.pluginLaunchUrl ?? app.launchUrl).replace(this.api.baseUrl, ""),
        }));
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

interface DhisInstalledApp {
    version: string;
    name: string;
    appType: "APP" | "RESOURCE" | "DASHBOARD_WIDGET" | "TRACKER_DASHBOARD_WIDGET";
    appStorageSource: string;
    folderName: string;
    icons: Record<string, string>;
    developer: Record<string, string>;
    activities: Record<string, unknown>;
    launchUrl: string;
    pluginLaunchUrl?: string;
    appState: string;
    key: string;
    launch_path: string;
    plugin_launch_path?: string;
    default_locale: string;
}
