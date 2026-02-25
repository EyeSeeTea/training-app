import React, { createContext, PropsWithChildren, useMemo } from "react";
import styled from "styled-components";

import { TrainingModulePage } from "../../domain/entities/TrainingModule";
import { ActionButton } from "../../webapp/components/action-button/ActionButton";
import { Maybe } from "../../types/utils";
import { useBindEvents } from "./hooks/useBindEvents";
import "./InteractiveTrainingProvider.css";
import { TrainingContainer } from "./TrainingContainer";
import {
    useModuleState,
    useTrainingContent,
    useTrainingResources,
    useTutorialModuleState,
} from "./hooks/useInteractiveTraining";
import { TrainingLanding } from "./TrainingLanding";
import { useScrollableContainerKey } from "./hooks/useScrollableContainerKey";

const trainingEventKinds = ["click", "focus", "section"];
type TrainingEventKind = typeof trainingEventKinds[number];

export type InteractiveTrainingContextState = {
    pages: TrainingModulePage[];
    trigger: (props: { targetIds: string[] }) => void;
    events: TrainingEventKind[];
};
export const InteractiveTrainingContext = createContext<Maybe<InteractiveTrainingContextState>>(undefined);

type TutorialModuleProps = PropsWithChildren<{
    baseUrl?: string;
    locale?: string;
    events?: TrainingEventKind[];
    highlightElementsWithBindings?: boolean;
    trainingAppKey?: string;
}>;

const defaultAppKey = "Training-App";

export const InteractiveTrainingProvider: React.FC<TutorialModuleProps> = props => {
    const {
        baseUrl,
        locale = "en",
        events = trainingEventKinds,
        highlightElementsWithBindings,
        trainingAppKey = defaultAppKey,
        children,
    } = props;

    const {
        pages,
        containerConfig,
        d2Api,
        settingsAccess,
        landings,
        modules,
        isLoading,
        currentUser,
        ...trainingData
    } = useTrainingResources({
        baseUrl: baseUrl || "",
        trainingAppKey,
    });

    const { minimizeTraining, showTraining, isMinimized } = useModuleState();
    const { textContent, trigger, translate, targetIds } = useTrainingContent({ pages, locale, d2Api, trainingAppKey });
    const { onGoBack, onGoHome, currentPage, ...moduleHandling } = useTutorialModuleState({
        modules,
        landings,
        textContent,
        currentUser,
    });
    const { triggerKey, appendToTriggerKey } = useScrollableContainerKey({
        targetIds,
        currentPage,
        loadedModule: moduleHandling.loadedModule,
    });

    const containerClass = `training-scope ${highlightElementsWithBindings ? "highlight-training-elements" : ""}`;

    const contextValue = useMemo(() => ({ pages, trigger, events }), [pages, trigger, events]);
    const { trainingScopeRef } = useBindEvents(contextValue);

    return (
        <InteractiveTrainingContext.Provider value={contextValue}>
            <TrainingContainer
                isLoading={isLoading}
                containerConfig={containerConfig}
                content={textContent}
                triggerKey={triggerKey}
                isMinimized={isMinimized}
                onMinimize={minimizeTraining}
                showTraining={showTraining}
                settingsAccess={settingsAccess}
                goBack={onGoBack}
                goHome={onGoHome}
                defaultContent={
                    <TrainingLanding
                        {...trainingData}
                        {...moduleHandling}
                        currentPage={currentPage}
                        landings={landings}
                        modules={modules}
                        translate={translate}
                        onHome={onGoHome}
                        appendToTriggerKey={appendToTriggerKey}
                    />
                }
            >
                <div ref={trainingScopeRef} className={containerClass}>
                    {children}
                </div>
            </TrainingContainer>
        </InteractiveTrainingContext.Provider>
    );
};
