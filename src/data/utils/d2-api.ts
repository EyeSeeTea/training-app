import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { Instance } from "../entities/Instance";
import { InstalledApp } from "../../domain/entities/InstalledApp";
import { memoizeAsync } from "../../utils/cache";

export function getMajorVersion(version: string): number {
    const apiVersion = _.get(version.split("."), 1);
    if (!apiVersion) throw new Error(`Invalid version: ${version}`);
    return Number(apiVersion);
}

export function getD2APiFromInstance(instance: Instance) {
    return new D2Api({ baseUrl: instance.url, auth: instance.auth, backend: "fetch" });
}

export async function isAppInstalledByUrl(
    api: D2Api,
    installedApps: InstalledApp[],
    launchUrl: string
): Promise<boolean> {
    const isPathRelative = launchUrl.startsWith("/");
    const [baseAppPath] = launchUrl.split("#");

    // Normalize by removing trailing /, #, #/, /#, and '/index.html'
    const normalizePath = (path: string) => path.replace(/[/#]+$/, "").replace(/\/index.html\.[^/]*$/, "");
    const normalizedLaunchPath = normalizePath(baseAppPath ?? launchUrl);

    const isAppInstalled = installedApps.some(app => {
        if (!app.launchUrl) return false;
        return normalizePath(app.launchUrl).endsWith(normalizedLaunchPath);
    });

    // We need this check to handle DHIS2 apps such as Messages and User settings that exist within the DHIS2 instance but are not listed as installed apps
    if (isPathRelative && !isAppInstalled) {
        try {
            const response = await api.baseConnection.request({ method: "get", url: launchUrl }).getData();
            return response !== undefined && response !== null && response !== "";
        } catch (error: any) {
            return false;
        }
    }

    return isAppInstalled;
}

export const getVersion = memoizeAsync(async (api: D2Api): Promise<string> => {
    const { version } = await api.system.info.getData();
    return version;
});
