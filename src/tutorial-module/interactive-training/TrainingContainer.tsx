import React from "react";
import styled from "styled-components";

import { ContainerConfig, SideBarConfig } from "../../domain/entities/Config";
import { InteractiveTrainingModal } from "./InteractiveTrainingModal";
import { InteractiveTrainingPanel } from "./InteractiveTrainingPanel";

type TrainingContainerProps = {
    containerConfig: ContainerConfig;
    content: string;
    isMinimized: boolean;
    onMinimize: () => void;
};

export const TrainingContainer: React.FC<TrainingContainerProps> = props => {
    const { containerConfig, content, isMinimized, onMinimize, children } = props;

    switch (containerConfig.type) {
        case "sidebar":
            return (
                <PaneledContainer
                    className={isMinimized ? "" : "show-panel"}
                    isRight={containerConfig.position === "right"}
                    width={containerConfig.width}
                    unit={containerConfig.unit}
                >
                    <div>{children}</div>
                    <InteractiveTrainingPanel minimized={isMinimized} content={content} onMinimize={onMinimize} />
                </PaneledContainer>
            );
        case "dialog":
            return (
                <>
                    {children}
                    <InteractiveTrainingModal minimized={isMinimized} content={content} onMinimize={onMinimize} />
                </>
            );
    }
};

const PaneledContainer = styled.div<{
    isRight: boolean;
    width: number;
    unit: SideBarConfig["unit"];
}>`
    &.show-panel {
        display: flex;
        flex-direction: ${({ isRight }) => (isRight ? "row" : "row-reverse")};
        width: 100%;

        & > :first-child {
            flex: 1 1 auto;
            min-width: 0;
        }

        & > :last-child {
            flex: 0 0 ${({ width, unit }) => `${width}${unit}`};
            max-width: ${({ width, unit }) => `${width}${unit}`};
            position: sticky;
            top: 0;
            align-self: flex-start;
            height: 100vh;
        }
    }
`;
