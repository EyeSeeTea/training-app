import React from "react";
import styled, { css } from "styled-components";

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

    if (containerConfig.type === "sidebar") {
        return (
            <PaneledContainer
                isMinimized={isMinimized}
                isRight={containerConfig.position === "right"}
                width={containerConfig.width}
                unit={containerConfig.unit}
            >
                <div>{children}</div>
                {!isMinimized && <InteractiveTrainingPanel content={content} onMinimize={onMinimize} />}
            </PaneledContainer>
        );
    } else {
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
    isMinimized: boolean;
}>`
    ${({ isMinimized, isRight, width, unit }) =>
        !isMinimized &&
        css`
            display: flex;
            flex-direction: ${isRight ? "row" : "row-reverse"};
            width: 100%;

            & > :first-child {
                flex: 1 1 auto;
                min-width: 0;
            }

            & > :last-child {
                flex: 0 0 ${width}${unit};
                max-width: ${width}${unit};
                height: 100vh;
            }
        `}
`;
