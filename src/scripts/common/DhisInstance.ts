import http from "http";
import https from "https";
import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { SocksProxyAgent } from "socks-proxy-agent";
import { D2Api } from "../../types/d2-api";

/**
 * A DHIS2 instance for CLI scripts: a D2Api for JSON requests plus a raw HTTP client for
 * binary transfers (d2-api's file methods do not handle binary data under Node).
 *
 * The SOCKS proxy, if any, is taken from the ALL_PROXY environment variable.
 */
export class DhisInstance {
    public readonly api: D2Api;
    private http: AxiosInstance;

    constructor(public readonly url: string, auth: Auth) {
        const agent = getAgent(url);
        this.api = new D2Api({ baseUrl: url, auth, backend: "xhr", agent });
        this.http = axios.create({
            baseURL: `${url}/api`,
            auth,
            httpAgent: agent,
            httpsAgent: agent,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
    }

    static fromUrl(urlWithAuth: string, authString: string | undefined): DhisInstance {
        const urlObj = new URL(urlWithAuth);
        const decode = decodeURIComponent;
        const auth = authString
            ? parseAuth(authString)
            : { username: decode(urlObj.username), password: decode(urlObj.password) };
        if (!auth.username || !auth.password) {
            throw new Error(`No credentials for ${urlObj.origin}: use http[s]://USERNAME:PASSWORD@HOST or --*-auth`);
        }
        const baseUrl = (urlObj.origin + urlObj.pathname).replace(/\/+$/, "");
        return new DhisInstance(baseUrl, auth);
    }

    public async download(path: string): Promise<Buffer> {
        const response = await this.http.get<ArrayBuffer>(path, { responseType: "arraybuffer" });
        return Buffer.from(response.data);
    }

    /** Upload a file as a fileResource and return its (server-generated) ID */
    public async uploadFileResource(options: UploadOptions): Promise<string> {
        const form = new FormData();
        form.append("file", options.data, { filename: options.filename, contentType: options.contentType });
        form.append("domain", options.domain);

        const response = await this.http.post<FileResourceResponse>("/fileResources", form, {
            headers: form.getHeaders(),
        });
        const id = response.data.response?.fileResource?.id;
        if (!id) throw new Error(`fileResource upload returned no ID: ${JSON.stringify(response.data)}`);
        return id;
    }
}

type Auth = { username: string; password: string };

interface UploadOptions {
    data: Buffer;
    filename: string;
    contentType: string;
    domain: "DOCUMENT";
}

interface FileResourceResponse {
    response?: { fileResource?: { id?: string } };
}

function parseAuth(authString: string): Auth {
    const index = authString.indexOf(":");
    if (index < 0) throw new Error("Auth must be USERNAME:PASSWORD");
    return { username: authString.slice(0, index), password: authString.slice(index + 1) };
}

function getAgent(url: string): http.Agent {
    const proxyUrl = process.env.ALL_PROXY;
    if (proxyUrl) return new SocksProxyAgent(proxyUrl);
    return url.startsWith("https:") ? new https.Agent({ keepAlive: false }) : new http.Agent({ keepAlive: false });
}
