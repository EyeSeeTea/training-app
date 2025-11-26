import React, { createContext, useMemo } from "react";
import styled from "styled-components";

import { TrainingModulePage } from "../../domain/entities/TrainingModule";
import { ActionButton } from "../../webapp/components/action-button/ActionButton";
import { Maybe } from "../../types/utils";
import { useBindEvents } from "./hooks/useBindEvents";
import "./InteractiveTrainingProvider.css";
import { TrainingContainer } from "./TrainingContainer";
import { useModuleState, useTrainingContent, useTrainingData } from "./hooks/useInteractiveTraining";

const trainingEventKinds = ["click", "focus", "section"];
type TrainingEventKind = typeof trainingEventKinds[number];

export type InteractiveTrainingContextState = {
    pages: TrainingModulePage[];
    trigger: (props: { targetIds: string[] }) => void;
    events: TrainingEventKind[];
};
export const InteractiveTrainingContext = createContext<Maybe<InteractiveTrainingContextState>>(undefined);

type TutorialModuleProps = {
    baseUrl?: string;
    locale?: string;
    events?: TrainingEventKind[];
    highlightElementsWithBindings?: boolean;
};

export const InteractiveTrainingProvider: React.FC<TutorialModuleProps> = props => {
    const { baseUrl, locale = "en", events = trainingEventKinds, highlightElementsWithBindings, children } = props;

    const { pages, containerConfig, d2Api } = useTrainingData({ baseUrl: baseUrl || "" });
    const { minimizeTraining, showTraining, isMinimized } = useModuleState();

    const { textContent, trigger } = useTrainingContent({ pages, locale, d2Api });

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
                <div ref={trainingScopeRef} className={containerClass}>
                    {children}
                </div>
            </TrainingContainer>
            {pages.length > 0 && (
                <ActionButtonContainer hidden={!isMinimized}>
                    <ActionButton onClick={showTraining} />
                </ActionButtonContainer>
            )}
        </InteractiveTrainingContext.Provider>
    );
};

const ActionButtonContainer = styled.div<{ hidden: boolean }>`
    visibility: ${({ hidden }) => (hidden ? "hidden" : "visible")};
`;
