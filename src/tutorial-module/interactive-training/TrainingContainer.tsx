import React from "react";
import styled from "styled-components";

import { ContainerConfig, SideBarConfig } from "../../domain/entities/Config";
import { InteractiveTrainingModal } from "./InteractiveTrainingModal";
import { InteractiveTrainingPanel } from "./InteractiveTrainingPanel";
import { SettingsAccess } from "./hooks/useInteractiveTraining";
import { MarkdownViewer } from "../../webapp/components/markdown-viewer/MarkdownViewer";

type TrainingContainerProps = {
    containerConfig: ContainerConfig;
    content: string;
    triggerKey: string;
    isMinimized: boolean;
    onMinimize: () => void;
    settingsAccess: SettingsAccess;
    defaultContent: React.ReactNode;
    goBack?: () => void;
    goHome?: () => void;
};

export const TrainingContainer: React.FC<TrainingContainerProps> = props => {
    const {
        containerConfig,
        content,
        triggerKey,
        isMinimized,
        onMinimize,
        children,
        settingsAccess,
        defaultContent,
        goHome,
        goBack,
    } = props;

    const onSettings = React.useCallback(() => {
        if (!settingsAccess.settingsUrl) return;

        window.open(settingsAccess.settingsUrl, "_blank");
    }, [settingsAccess]);

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
                    <InteractiveTrainingPanel
                        minimized={isMinimized}
                        onMinimize={onMinimize}
                        onBack={goBack}
                        onHome={goHome}
                        onSettings={settingsAccess.hasAccess ? onSettings : undefined}
                        triggerKey={triggerKey}
                    >
                        <TrainingContainerContent content={content} defaultContent={defaultContent} />
                    </InteractiveTrainingPanel>
                </PaneledContainer>
            );
        case "dialog":
            return (
                <>
                    {children}
                    <InteractiveTrainingModal
                        minimized={isMinimized}
                        onMinimize={onMinimize}
                        onGoHome={goHome}
                        onGoBack={goBack}
                        onSettings={settingsAccess.hasAccess ? onSettings : undefined}
                        triggerKey={triggerKey}
                    >
                        <TrainingContainerContent content={content} defaultContent={defaultContent} />
                    </InteractiveTrainingModal>
                </>
            );
    }
};

const TrainingContainerContent: React.FC<{ content: string; defaultContent: React.ReactNode }> = props => {
    const { content, defaultContent } = props;

    const hasContent = Boolean(content);
    return (
        <>
            {hasContent && <MarkdownViewer source={content} />}
            <ToggleContainer isVisible={!hasContent}>{defaultContent}</ToggleContainer>
        </>
    );
};

export const ToggleContainer = styled.div<{ isVisible: boolean }>`
    display: ${p => (p.isVisible ? "block" : "none")};
`;

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
            min-width: 450px;
            position: sticky;
            top: 0;
            align-self: flex-start;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
    }
`;
