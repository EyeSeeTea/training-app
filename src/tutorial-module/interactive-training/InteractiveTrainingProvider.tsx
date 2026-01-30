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

    const { pages, containerConfig, d2Api, settingsAccess, landings, modules, ...trainingData } = useTrainingResources({
        baseUrl: baseUrl || "",
        trainingAppKey,
    });

    const { minimizeTraining, showTraining, isMinimized } = useModuleState();
    const { textContent, trigger, translate, targetIds } = useTrainingContent({ pages, locale, d2Api });
    const { onGoBack, onGoHome, currentPage, ...moduleHandling } = useTutorialModuleState({
        modules,
        landings,
        textContent,
    });
    const { triggerKey, appendToTriggerKey } = useScrollableContainerKey({
        targetIds,
        currentPage,
        loadedModule: moduleHandling.loadedModule,
    });

    const containerClass = `training-scope ${highlightElementsWithBindings ? "highlight-training-elements" : ""}`;

    const contextValue = useMemo(() => ({ pages, trigger, events }), [pages, trigger, events]);
    const { trainingScopeRef } = useBindEvents(contextValue);

    const position =
        containerConfig.buttonPosition === "top-right"
            ? {
                  top: "48px",
                  right: "0px",
              }
            : {
                  bottom: "10px",
                  right: "0px",
              };

    return (
        <InteractiveTrainingContext.Provider value={contextValue}>
            <TrainingContainer
                containerConfig={containerConfig}
                content={textContent}
                triggerKey={triggerKey}
                isMinimized={isMinimized}
                onMinimize={minimizeTraining}
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
            {pages.length > 0 && (
                <ActionButtonContainer hidden={!isMinimized}>
                    <ActionButton onClick={showTraining} {...position}>
                        <HelpButton>?</HelpButton>
                    </ActionButton>
                </ActionButtonContainer>
            )}
        </InteractiveTrainingContext.Provider>
    );
};

const ActionButtonContainer = styled.div<{ hidden: boolean }>`
    visibility: ${({ hidden }) => (hidden ? "hidden" : "visible")};

    .MuiFab-root {
        padding: 0;
    }
`;

const HelpButton = styled.div`
    font-size: 20px;
`;
