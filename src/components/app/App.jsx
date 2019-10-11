import React, { useEffect, useState } from "react";
import { HeaderBar } from "@dhis2/ui-widgets";
import { MuiThemeProvider } from "@material-ui/core/styles";
import JssProvider from "react-jss/lib/JssProvider";
import { createGenerateClassName } from "@material-ui/core/styles";
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { useDataQuery, useConfig } from "@dhis2/app-runtime";
import _ from "lodash";
import i18n from "@dhis2/d2-i18n";
import { init } from "d2";
import { SnackbarProvider } from "d2-ui-components";

import "./App.css";
import { muiTheme } from "./themes/dhis2.theme";
import muiThemeLegacy from "./themes/dhis2-legacy.theme";
import Root from "../../pages/root/Root";
import Share from "../share/Share";

const generateClassName = createGenerateClassName({
    dangerouslyUseGlobalCSS: false,
    productionPrefix: "c",
});

const isLangRTL = code => {
    const langs = ["ar", "fa", "ur"];
    const prefixed = langs.map(c => `${c}-`);
    return _(langs).includes(code) || prefixed.filter(c => code && code.startsWith(c)).length > 0;
};

const configI18n = ({ keyUiLocale: uiLocale }) => {
    i18n.changeLanguage(uiLocale);
    document.documentElement.setAttribute("dir", isLangRTL(uiLocale) ? "rtl" : "ltr");
};

const App = () => {
    const { baseUrl } = useConfig();
    const [d2, setD2] = useState(null);
    const [showShareButton, setShowShareButton] = useState(false);
    const { loading, error, data } = useDataQuery({
        userSettings: { resource: "/userSettings" },
    });
    useEffect(() => {
        const run = async () => {
            const appConfig = await fetch("app-config.json", {
                credentials: "same-origin",
            }).then(res => res.json());
            const d2 = await init({ baseUrl: baseUrl + "/api" });

            setD2(d2);
            setShowShareButton(_(appConfig).get("appearance.showShareButton") || false);

            initFeedbackTool(d2, appConfig);
        };

        run();
    }, []);

    if (loading || !d2) return <div>Loading...</div>;

    if (error)
        return (
            <div>
                <a rel="noopener noreferrer" target="_blank" href={baseUrl}>
                    {"Login"}
                </a>
                {` ${baseUrl}`}
            </div>
        );

    configI18n(data.userSettings);

    return (
        <JssProvider generateClassName={generateClassName}>
            <MuiThemeProvider theme={muiTheme}>
                <OldMuiThemeProvider muiTheme={muiThemeLegacy}>
                    <SnackbarProvider>
                        <HeaderBar appName={"Skeleton app"} />

                        <div id="app" className="content">
                            <Root />
                        </div>

                        <Share visible={showShareButton} />
                    </SnackbarProvider>
                </OldMuiThemeProvider>
            </MuiThemeProvider>
        </JssProvider>
    );
};

function initFeedbackTool(d2, appConfig) {
    const appKey = _(appConfig).get("appKey");

    if (appConfig && appConfig.feedback) {
        const feedbackOptions = {
            ...appConfig.feedback,
            i18nPath: "feedback-tool/i18n",
        };
        window.$.feedbackDhis2(d2, appKey, feedbackOptions);
    }
}

export default App;
