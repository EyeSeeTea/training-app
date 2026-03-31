import { D2Api } from "../../types/d2-api";
import { InstalledApp } from "../../domain/entities/InstalledApp";
import { DhisInstalledApp } from "../repositories/InstanceDhisRepository";

export async function fetchInstalledApps(api: D2Api): Promise<InstalledApp[]> {
    const apps = await api.get<DhisInstalledApp[]>("/apps").getData();

    return apps.map(app => ({
        name: app.name,
        version: app.version,
        fullLaunchUrl: app.launchUrl,
        launchUrl: (app.pluginLaunchUrl ?? app.launchUrl).replace(api.baseUrl, ""),
    }));
}
