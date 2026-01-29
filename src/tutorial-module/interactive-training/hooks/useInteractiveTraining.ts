import { useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";

import { D2Api } from "../../../types/d2-api";
import { TrainingModule, TrainingModulePage } from "../../../domain/entities/TrainingModule";
import { buildTranslate, TranslatableText } from "../../../domain/entities/TranslatableText";
import { Config, ContainerConfig, defaultContainerConfig } from "../../../domain/entities/Config";
import { getCompositionRoot } from "../../../webapp/CompositionRoot";
import { LandingNode } from "../../../domain/entities/LandingPage";
import {
    generateSettingsUrl,
    generateTrainingAppBaseUrl,
    transformD2DocumentUrls,
    updateIconDocumentUrls,
} from "../utils";
import { getLogoInfo, LogoInfo } from "../../../webapp/hooks/useAppConfig";
import { useTrainingNavigation } from "../../../webapp/hooks/useTutorialPage";

type UseTutorialModuleStateProps = {
    landings: LandingNode[];
    modules: TrainingModule[];
    textContent: string;
};

export function useTutorialModuleState(props: UseTutorialModuleStateProps) {
    const { landings, modules, textContent } = props;
    const { goBack, goHome, isRoot, ...navigations } = useTrainingNavigation({ landings });
    const [module, setModule] = useState<TrainingModule>();

    const handleBack = useCallback(() => {
        setModule(undefined);
        goBack();
    }, [goBack]);

    const handleHome = useCallback(() => {
        setModule(undefined);
        goHome();
    }, [goHome]);

    console.log("textContent", textContent, isRoot);
    const showNavButtons = !textContent && !isRoot;

    const onGoBack = useMemo(() => (showNavButtons ? handleBack : undefined), [handleBack, showNavButtons]);
    const onGoHome = useMemo(() => (showNavButtons ? handleHome : undefined), [handleHome, showNavButtons]);

    const loadModule = useCallback(
        (moduleId: string) => {
            const moduleSelected = modules.find(m => m.id === moduleId);
            if (moduleSelected) setModule(moduleSelected);
        },
        [modules]
    );

    return {
        loadedModule: module,
        loadModule,
        onGoBack,
        onGoHome,
        isRoot,
        ...navigations,
    };
}

export function useModuleState() {
    const [isMinimized, setIsMinimized] = useState(true);

    const minimizeTraining = useCallback(() => {
        setIsMinimized(true);
    }, []);

    const showTraining = useCallback(() => {
        setIsMinimized(false);
    }, []);

    return { isMinimized, minimizeTraining, showTraining };
}

type UseTrainingContentProps = {
    pages: TrainingModulePage[];
    locale: string;
    d2Api: D2Api;
};

export function useTrainingContent(props: UseTrainingContentProps) {
    const { pages, locale, d2Api } = props;
    const [contents, setContents] = useState<TranslatableText[]>([]);

    const pageMap = useMemo(() => _.keyBy(pages, p => p.id), [pages]);
    const translateMethod = useMemo(() => buildTranslate(locale), [locale]);

    const textContent = useMemo(() => {
        const translatedContent = contents.reduce((acc, content) => `${acc}\n\n${translateMethod(content)}`, "");
        return transformD2DocumentUrls(translatedContent, d2Api.apiPath);
    }, [contents, translateMethod, d2Api.apiPath]);

    const setContentsImmediate = useCallback(
        (targetIds: string[]) => {
            const targetPages = _(targetIds)
                .map(targetId => pageMap[targetId])
                .compact()
                .value();
            setContents(targetPages);
        },
        [pageMap]
    );

    // debounce because click triggers both focus and then click
    // We want to avoid setting contents twice in quick succession
    const debouncedSetContents = useMemo(() => _.debounce(setContentsImmediate, 120), [setContentsImmediate]);

    useEffect(() => {
        return () => {
            debouncedSetContents.cancel();
        };
    }, [debouncedSetContents]);

    const trigger = useCallback(
        (props: { targetIds: string[] }) => {
            debouncedSetContents(props.targetIds);
        },
        [debouncedSetContents]
    );

    return { textContent, trigger, translateMethod };
}

export type SettingsAccess = {
    hasAccess: boolean;
    settingsUrl: string;
};

type UseTrainingDataProps = { baseUrl: string; trainingAppKey: string };

export function useTrainingResources(props: UseTrainingDataProps) {
    const { baseUrl, trainingAppKey } = props;
    const d2Api = useMemo(() => new D2Api({ baseUrl }), [baseUrl]);
    const compositionRoot = useMemo(() => getCompositionRoot(d2Api), [d2Api]);

    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [landings, setLandings] = useState<LandingNode[]>([]);

    const [containerConfig, setContainerConfig] = useState<ContainerConfig>(defaultContainerConfig);
    const [appConfig, setAppConfig] = useState<Config>();
    const [logoInfo, setLogoInfo] = useState<LogoInfo>();
    const [settingsAccess, setSettingsAccess] = useState<SettingsAccess>({
        hasAccess: false,
        settingsUrl: "",
    });

    const pages = useMemo(() => {
        if (modules.length === 0) return [];
        return _(modules)
            .flatMap(module => module.contents.steps)
            .flatMap(step => step.pages.filter(({ bindings = [] }) => bindings.length > 0))
            .value();
    }, [modules]);

    useEffect(() => {
        compositionRoot.usecases.modules
            .list()
            .then(modules => setModules(updateIconDocumentUrls(modules, d2Api.apiPath)))
            .catch(error => {
                console.error(`Error fetching modules:`, error);
                setModules([]);
            });

        compositionRoot.usecases.landings
            .list()
            .then(landings => setLandings(updateIconDocumentUrls(landings, d2Api.apiPath)))
            .catch(error => {
                console.error(`Error fetching modules:`, error);
                setModules([]);
            });

        compositionRoot.usecases.config
            .get()
            .then(config => {
                setAppConfig(config);
                setContainerConfig(config.containerConfig);

                const logo = getLogoInfo(appConfig?.logo);
                if (!appConfig?.logo) {
                    setLogoInfo({
                        ...logo,
                        logoPath: `${generateTrainingAppBaseUrl(baseUrl, trainingAppKey)}/${logo.logoPath}`,
                    });
                } else setLogoInfo(logo);

                return compositionRoot.usecases.user.checkSettingsPermissions(config);
            })
            .then(hasAccess => {
                if (hasAccess) {
                    setSettingsAccess({
                        hasAccess,
                        settingsUrl: generateSettingsUrl(baseUrl, trainingAppKey),
                    });
                }
            })
            .catch(error => {
                console.error(`Error fetching container config:`, error);
                setContainerConfig(defaultContainerConfig);
            });
    }, [compositionRoot]);

    return { pages, containerConfig, d2Api, settingsAccess, modules, landings, appConfig, logoInfo };
}
