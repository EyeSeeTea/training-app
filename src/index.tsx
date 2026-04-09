import { Provider } from "@dhis2/app-runtime";
import i18n from "./utils/i18n";
import axios from "axios";
import { init } from "d2";
import _ from "lodash";
import React from "react";
import ReactDOM from "react-dom";
import { D2Api } from "./types/d2-api";
import App from "./webapp/pages/App";

const isDev = import.meta.env.DEV;

// El skeleton no incluye instrumentation extra tipo why-did-you-render.
// Para mantenerlo sin romper ESM en el navegador, lo cargamos solo en DEV.
if (isDev) {
    void import("./webapp/utils/wdyr");
}

async function getBaseUrl() {
    if (isDev) {
        return "/dhis2"; // Proxied by Vite dev server.
    } else {
        return getInjectedBaseUrl() || (await getBaseUrlFromManifest());
    }
}

// Get from manifest.webapp: activities.dhis.href
async function getBaseUrlFromManifest(): Promise<string> {
    const { data: manifest } = await axios.get<any>("manifest.webapp");
    const href = manifest?.activities?.dhis?.href;

    if (!href || href === "*") {
        throw new Error("Base URL not found in manifest.webapp");
    }

    return href;
}

// Injected by backend in public.html meta tag "dhis2-base-url"
function getInjectedBaseUrl(): string | null {
    const baseUrl = document.querySelector('meta[name="dhis2-base-url"]')?.getAttribute("content");
    return baseUrl && baseUrl !== "__DHIS2_BASE_URL__" ? baseUrl : null;
}

const isLangRTL = (code: string) => {
    const langs = ["ar", "fa", "ur"];
    const prefixed = langs.map(c => `${c}-`);
    return _(langs).includes(code) || prefixed.filter(c => code && code.startsWith(c)).length > 0;
};

const configI18n = ({ keyUiLocale }: { keyUiLocale: string }) => {
    i18n.changeLanguage(keyUiLocale);
    document.documentElement.setAttribute("dir", isLangRTL(keyUiLocale) ? "rtl" : "ltr");
};

async function main() {
    const baseUrl = await getBaseUrl();

    try {
        const d2 = await init({ baseUrl: baseUrl + "/api", schemas: [] });
        const api = new D2Api({ baseUrl });
        if (isDev) Object.assign(window, { d2, api });

        const userSettings = await api.get<{ keyUiLocale: string }>("/userSettings").getData();
        configI18n(userSettings);
        const config = { baseUrl, apiVersion: 30 };

        ReactDOM.render(
            <React.StrictMode>
                <Provider config={config} plugin={false} parentAlertsAdd={() => {}} showAlertsInPlugin={false}>
                    <App locale={userSettings.keyUiLocale} baseUrl={baseUrl} />
                </Provider>
            </React.StrictMode>,
            document.getElementById("root")
        );
    } catch (err: any) {
        console.error(err);
        const feedback = err.toString().match("Unable to get schemas") ? (
            <h3 style={{ margin: 20 }}>
                <a rel="noopener noreferrer" target="_blank" href={baseUrl}>
                    Login
                </a>
                {` ${baseUrl}`}
            </h3>
        ) : (
            <h3>{err.toString()}</h3>
        );
        ReactDOM.render(<div>{feedback}</div>, document.getElementById("root"));
    }
}

main();
