import { D2Api } from "../../types/d2-api";
import { InstalledApp } from "../../domain/entities/InstalledApp";

export async function fetchInstalledApps(api: D2Api): Promise<InstalledApp[]> {
    const apps = await api.get<DhisInstalledApp[]>("/apps").getData();

    return apps.map(app => ({
        name: app.name,
        version: app.version,
        fullLaunchUrl: app.launchUrl,
        launchUrl: (app.pluginLaunchUrl ?? app.launchUrl).replace(api.baseUrl, ""),
    }));
}

type DhisInstalledApp = {
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
};
