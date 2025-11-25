import { useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";

import { D2Api } from "../../../types/d2-api";
import { TrainingModule, TrainingModulePage } from "../../../domain/entities/TrainingModule";
import { buildTranslate, TranslatableText } from "../../../domain/entities/TranslatableText";
import { ContainerConfig, defaultContainerConfig } from "../../../domain/entities/Config";
import { getCompositionRoot } from "../../../webapp/CompositionRoot";

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

    return { textContent, trigger };
}

type UseTrainingDataProps = { baseUrl: string };

export function useTrainingData(props: UseTrainingDataProps) {
    const { baseUrl } = props;
    const d2Api = useMemo(() => new D2Api({ baseUrl }), [baseUrl]);
    const compositionRoot = useMemo(() => getCompositionRoot(d2Api), [d2Api]);
    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [containerConfig, setContainerConfig] = useState<ContainerConfig>(defaultContainerConfig);

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
            .then(modules => setModules(modules ?? []))
            .catch(error => {
                console.error(`Error fetching modules:`, error);
                setModules([]);
            });

        compositionRoot.usecases.config
            .get()
            .then(config => setContainerConfig(config.containerConfig))
            .catch(error => {
                console.error(`Error fetching container config:`, error);
                setContainerConfig(defaultContainerConfig);
            });
    }, [compositionRoot]);

    return { pages, containerConfig, d2Api };
}

function transformD2DocumentUrls(content: string, apiBaseUrl: string): string {
    return content.replace(/\.\.\/..\/(documents\/[^)\s"']+)/g, `${apiBaseUrl}/$1`);
}
