import http from "http";
import https from "https";
import axios, { AxiosInstance } from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";
import { D2Api } from "../../types/d2-api";

export interface D2Clients {
    api: D2Api;
    /** Raw HTTP client (base URL: <DHIS2>/api) for requests d2-api cannot do under Node (binary data) */
    httpClient: AxiosInstance;
}

/**
 * Build the clients for a DHIS2 instance from a URL with optional credentials
 * (http[s]://[USERNAME:PASSWORD@]HOST[:PORT][/PATH]). The SOCKS proxy, if any, is taken from ALL_PROXY.
 */
export function getD2ApiFromUrl(url: string, authString: string | undefined): D2Clients {
    const urlObj = new URL(url);
    const auth = authString
        ? parseAuth(authString)
        : { username: decodeURIComponent(urlObj.username), password: decodeURIComponent(urlObj.password) };
    if (!auth.username || !auth.password) {
        throw new Error(`No credentials for ${urlObj.origin}: use http[s]://USERNAME:PASSWORD@HOST or the auth option`);
    }

    const baseUrl = (urlObj.origin + urlObj.pathname).replace(/\/+$/, "");
    const agent = getAgent(baseUrl);
    const api = new D2Api({ baseUrl, auth, backend: "xhr", agent });
    const httpClient = axios.create({
        baseURL: `${baseUrl}/api`,
        auth,
        httpAgent: agent,
        httpsAgent: agent,
        maxContentLength: Infinity,
    });

    return { api, httpClient };
}

type Auth = { username: string; password: string };

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
