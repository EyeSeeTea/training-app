import React, { useMemo, useState } from "react";
import _ from "lodash";

import { useAppContext } from "../contexts/app-context";
import { Config, getDefaultConfig, PartialConfig } from "../../domain/entities/Config";
import { Maybe } from "../../types/utils";

export function useAppConfig() {
    const { usecases } = useAppContext();
    const [appConfig, setAppConfig] = React.useState<Config>(getDefaultConfig());
    const [hasSettingsAccess, setHasSettingsAccess] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const logoInfo = useMemo(() => getLogoInfo(appConfig?.logo), [appConfig]);

    const save = React.useCallback(
        (config: PartialConfig) => {
            return usecases.config.save(config).then(setAppConfig);
        },
        [usecases.config]
    );

    const reload = React.useCallback(async () => {
        try {
            const config = await usecases.config.get();
            setAppConfig(config);
            const hasAccess = await usecases.user.checkSettingsPermissions(config);
            setHasSettingsAccess(hasAccess);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setHasLoaded(true);
        }
    }, [usecases.config, usecases.user]);

    React.useEffect(() => {
        reload();
    }, [usecases.config, usecases.user, reload]);

    return {
        appConfig,
        save,
        hasSettingsAccess,
        logoInfo,
        hasLoaded,
        reload,
    };
}

export interface LogoInfo {
    logoPath: string;
    logoText: string;
}

function getLogoInfo(logo?: Maybe<string>): LogoInfo {
    const logoPath = logo || process.env["REACT_APP_LOGO_PATH"] || "img/logo-eyeseetea.png";
    const filename = logoPath.split("/").reverse()[0] || "";
    const name = filename.substring(0, filename.lastIndexOf("."));
    const logoText = _.startCase(name);
    return { logoPath, logoText };
}
