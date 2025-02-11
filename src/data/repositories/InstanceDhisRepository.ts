import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import FileType from "file-type/browser";
import Resizer from "react-image-file-resizer";
import { InstalledApp } from "../../domain/entities/InstalledApp";
import { InstanceRepository, UploadFileOptions } from "../../domain/repositories/InstanceRepository";
import { D2Api } from "../../types/d2-api";
import { cache, clearCache } from "../../utils/cache";
import { UserSearch } from "../entities/SearchUser";
import { getUid } from "../utils/uid";

export class InstanceDhisRepository implements InstanceRepository {
    constructor(private api: D2Api) {}

    @cache()
    public async getVersion(): Promise<string> {
        const { version } = await this.api.system.info.getData();
        return version;
    }

    public async uploadFile(data: ArrayBuffer, options: UploadFileOptions = {}): Promise<string> {
        const type = await FileType.fromBuffer(data);
        const { mime = "application/unknown", ext } = type ?? {};
        const blob = new Blob([data], { type: mime });
        const name = options.name ?? `Uploaded file${ext ? `.${ext}` : ""}`;

        const { id } = await this.api.files
            .upload({
                id: options.id ?? getUid(await arrayBufferToString(data)),
                name: `[Training App] ${name}`,
                data: await transformFile(blob, mime),
            })
            .getData();

        return `../../documents/${id}/data`;
    }

    public async installApp(appName: string): Promise<boolean> {
        clearCache(this.isAppInstalledByUrl, this);

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
    public async isAppInstalledByUrl(launchUrl: string): Promise<boolean> {
        try {
            await this.api.baseConnection.request({ method: "get", url: launchUrl }).getData();
        } catch (error: any) {
            return false;
        }

        return true;
    }

    @cache()
    public async listInstalledApps(): Promise<InstalledApp[]> {
        const apps = await this.api.get<DhisInstalledApp[]>("/apps").getData();

        return apps.map(app => ({
            name: app.name,
            version: app.name,
            fullLaunchUrl: app.launchUrl,
            launchUrl: app.launchUrl.replace(this.api.baseUrl, ""),
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

async function transformFile(blob: Blob, mime: string): Promise<Blob> {
    if (["image/jpeg", "image/png"].includes(mime)) {
        return new Promise(resolve => {
            Resizer.imageFileResizer(blob, 600, 600, "PNG", 100, 0, blob => resolve(blob as Blob), "blob");
        });
    } else if (process.env.NODE_ENV === "development" && mime === "image/gif") {
        try {
            const ffmpeg = createFFmpeg({ corePath: "https://unpkg.com/@ffmpeg/core/dist/ffmpeg-core.js" });

            await ffmpeg.load();
            ffmpeg.FS("writeFile", "file.gif", await fetchFile(blob));
            await ffmpeg.run(
                "-i",
                "file.gif",
                "-movflags",
                "faststart",
                "-pix_fmt",
                "yuv420p",
                "-vf",
                "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "file.mp4"
            );

            const data = ffmpeg.FS("readFile", "file.mp4");
            return new Blob([data.buffer], { type: "video/mp4" });
        } catch (error: any) {
            return blob;
        }
    }

    return blob;
}

function arrayBufferToString(buffer: ArrayBuffer, encoding = "UTF-8"): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const blob = new Blob([buffer], { type: "text/plain" });
        const reader = new FileReader();

        reader.onload = ev => {
            if (ev.target) {
                resolve(ev.target.result as string);
            } else {
                reject(new Error("Could not convert array to string!"));
            }
        };

        reader.readAsText(blob, encoding);
    });
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
    appState: string;
    key: string;
    launch_path: string;
    default_locale: string;
}
