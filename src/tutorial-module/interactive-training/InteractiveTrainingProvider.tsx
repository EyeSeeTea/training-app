import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";

import { TrainingModule, TrainingModulePage } from "../../domain/entities/TrainingModule";
import { getCompositionRoot } from "../../webapp/CompositionRoot";
import { buildTranslate, TranslatableText } from "../../domain/entities/TranslatableText";
import { ActionButton } from "../../webapp/components/action-button/ActionButton";
import { D2Api } from "../../types/d2-api";
import { Maybe } from "../../types/utils";
import { InteractiveTrainingModal } from "./InteractiveTrainingModal";
import { useBindEvents } from "./useBindEvents";
import "./InteractiveTrainingProvider.css";
import { bind } from "./useInteractiveTrainingContext";

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

    const pages = useTrainingPages({ baseUrl: baseUrl || "" });

    const [contents, setContents] = useState<TranslatableText[]>([]);
    const [moduleState, setModuleState] = useState<"default" | "minimized">("minimized");

    const isMinimized = moduleState === "minimized";
    const highlightClass = highlightElementsWithBindings ? "highlight-training-elements" : "";

    const pageMap = useMemo(() => _.keyBy(pages, p => p.id), [pages]);
    const translateMethod = useMemo(() => buildTranslate(locale), [locale]);

    const trigger = useCallback(
        (props: { targetIds: string[] }) => {
            const { targetIds } = props;
            const targetPages = _(targetIds)
                .map(targetId => pageMap[targetId])
                .compact()
                .value();
            console.log("trigger", props, targetPages, targetIds);
            setContents(targetPages);
        },
        [pageMap]
    );

    const minimizeTraining = useCallback(() => {
        setModuleState("minimized");
    }, []);

    const contextValue = useMemo(() => ({ pages, trigger, events }), [pages, trigger, events]);
    const { trainingScopeRef } = useBindEvents(contextValue);

    return (
        <InteractiveTrainingContext.Provider value={contextValue}>
            <div
                ref={trainingScopeRef}
                className={`training-scope ${highlightClass}`}
                {...bind("interacting-training-default-container binding")}
            >
                {children}
            </div>
            {pages.length > 0 && (
                <>
                    {isMinimized ? (
                        <ActionButton onClick={() => setModuleState("default")} />
                    ) : (
                        <InteractiveTrainingModal
                            translate={translateMethod}
                            minimized={isMinimized}
                            contents={contents}
                            onMinimize={minimizeTraining}
                        />
                    )}
                </>
            )}
        </InteractiveTrainingContext.Provider>
    );
};

type UseTrainingPages = { baseUrl: string };
function useTrainingPages(props: UseTrainingPages) {
    const { baseUrl } = props;
    const compositionRoot = useMemo(() => getCompositionRoot(new D2Api({ baseUrl: baseUrl })), [baseUrl]);
    const [modules, setModules] = useState<TrainingModule[]>([]);

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
                console.error(`No modules found:`, error);
                setModules([]);
            });
    }, [compositionRoot]);

    return pages;
}
