import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";
import styled from "styled-components";

import { TrainingModule, TrainingModulePage } from "../../domain/entities/TrainingModule";
import { getCompositionRoot } from "../../webapp/CompositionRoot";
import { buildTranslate, TranslatableText } from "../../domain/entities/TranslatableText";
import { ActionButton } from "../../webapp/components/action-button/ActionButton";
import { D2Api } from "../../types/d2-api";
import { Maybe } from "../../types/utils";
import { useBindEvents } from "./useBindEvents";
import "./InteractiveTrainingProvider.css";
import { bind } from "./useInteractiveTrainingContext";
import { ContainerConfig, defaultContainerConfig } from "../../domain/entities/Config";
import { TrainingContainer } from "./TrainingContainer";

type TrainingEventKind = "click" | "focus" | "section";

export type InteractiveTrainingContextState = {
    pages: TrainingModulePage[];
    trigger: (props: { targetIds: string[] }) => void;
    events?: TrainingEventKind[];
};
export const InteractiveTrainingContext = createContext<Maybe<InteractiveTrainingContextState>>(undefined);

type TutorialModuleProps = {
    baseUrl?: string;
    locale?: string;
    events?: TrainingEventKind[];
    highlightElementsWithBindings?: boolean;
};
export const InteractiveTrainingProvider: React.FC<TutorialModuleProps> = props => {
    const { baseUrl, locale = "en", events, highlightElementsWithBindings, children } = props;

    const { pages, containerConfig, d2Api } = useTrainingData({ baseUrl: baseUrl || "" });

    const [moduleState, setModuleState] = useState<"default" | "minimized">("minimized");
    const [contents, setContents] = useState<TranslatableText[]>([]);

    const pageMap = useMemo(() => _.keyBy(pages, p => p.id), [pages]);
    const translateMethod = useMemo(() => buildTranslate(locale), [locale]);

    const textContent = useMemo(() => {
        const translatedContent = contents.reduce((acc, content) => `${acc}\n\n${translateMethod(content)}`, "");
        return baseUrl ? transformDocumentUrls(translatedContent, d2Api.apiPath) : translatedContent;
    }, [contents, translateMethod, baseUrl, d2Api.apiPath]);

    const trigger = useCallback(
        (props: { targetIds: string[] }) => {
            const { targetIds } = props;
            const targetPages = _(targetIds)
                .map(targetId => pageMap[targetId])
                .compact()
                .value();
            setContents(targetPages);
        },
        [pageMap]
    );

    const minimizeTraining = useCallback(() => {
        setModuleState("minimized");
    }, []);

    const isMinimized = moduleState === "minimized";
    const containerClass = `training-scope ${highlightElementsWithBindings ? "highlight-training-elements" : ""}`;

    const contextValue = useMemo(() => ({ pages, trigger, events }), [pages, trigger, events]);
    const { trainingScopeRef } = useBindEvents(contextValue);

    return (
        <InteractiveTrainingContext.Provider value={contextValue}>
            <TrainingContainer
                containerConfig={containerConfig}
                content={textContent}
                isMinimized={isMinimized}
                onMinimize={minimizeTraining}
            >
                <div
                    ref={trainingScopeRef}
                    className={containerClass}
                    {...bind("interacting-training-default-container")}
                >
                    {children}
                </div>
            </TrainingContainer>
            {pages.length > 0 && (
                <ActionButtonContainer hidden={!isMinimized}>
                    <ActionButton onClick={() => setModuleState("default")} />
                </ActionButtonContainer>
            )}
        </InteractiveTrainingContext.Provider>
    );
};

type UseTrainingData = { baseUrl: string };
function useTrainingData(props: UseTrainingData) {
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

const ActionButtonContainer = styled.div<{ hidden: boolean }>`
    visibility: ${({ hidden }) => (hidden ? "hidden" : "visible")};
`;

function transformDocumentUrls(content: string, apiBaseUrl: string): string {
    return content.replace(/\.\.\/..\/(documents\/[^)\s"']+)/g, `${apiBaseUrl}/$1`);
}
