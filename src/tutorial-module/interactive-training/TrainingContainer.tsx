import React from "react";
import styled from "styled-components";
import { Box } from "@material-ui/core";

import { ContainerConfig } from "../../domain/entities/Config";
import { InteractiveTrainingModal } from "./InteractiveTrainingModal";
import { SettingsAccess } from "./hooks/useInteractiveTraining";
import { MarkdownViewer } from "../../webapp/components/markdown-viewer/MarkdownViewer";
import { InteractiveTrainingDrawer } from "./InteractiveTrainingDrawer";
import { NotificationBadgeState } from "./hooks/useContentChangeIndicator";

type TrainingContainerProps = {
    containerConfig: ContainerConfig;
    content: string;
    triggerKey: string;
    isMinimized: boolean;
    onMinimize: () => void;
    showTraining: () => void;
    settingsAccess: SettingsAccess;
    defaultContent: React.ReactNode;
    goBack?: () => void;
    goHome?: () => void;
    isLoading?: boolean;
    badgeProps?: NotificationBadgeState;
};

export const TrainingContainer: React.FC<TrainingContainerProps> = props => {
    const {
        containerConfig,
        content,
        isMinimized,
        children,
        settingsAccess,
        defaultContent,
        goHome,
        goBack,
        isLoading = true,
        badgeProps,
        ...containerProps
    } = props;

    const onSettings = React.useCallback(() => {
        if (!settingsAccess.settingsUrl) return;

        window.open(settingsAccess.settingsUrl, "_blank");
    }, [settingsAccess]);

    // Children always render in the same position of the tree, so the host app is mounted
    // immediately and not re-mounted when the training data finishes loading.
    const trainingUi = isLoading ? null : getTrainingUi();
    const isSidebar = trainingUi?.type === "sidebar";

    return (
        <Box display={isSidebar ? "flex" : "block"}>
            {trainingUi?.type === "sidebar" && !trainingUi.isRight ? trainingUi.element : null}
            <Box flexGrow={isSidebar ? 1 : undefined}>{children}</Box>
            {trainingUi?.type === "sidebar" && trainingUi.isRight ? trainingUi.element : null}
            {trainingUi?.type === "dialog" ? trainingUi.element : null}
        </Box>
    );

    function getTrainingUi() {
        switch (containerConfig.type) {
            case "sidebar":
                return {
                    type: "sidebar" as const,
                    isRight: containerConfig.position === "right",
                    element: (
                        <InteractiveTrainingDrawer
                            {...containerProps}
                            isMinimized={isMinimized}
                            onHome={goHome}
                            onBack={goBack}
                            onSettings={settingsAccess.hasAccess ? onSettings : undefined}
                            containerConfig={containerConfig}
                            badgeProps={badgeProps}
                            drawerContent={
                                <TrainingContainerContent content={content} defaultContent={defaultContent} />
                            }
                        />
                    ),
                };
            case "dialog":
                return {
                    type: "dialog" as const,
                    element: (
                        <InteractiveTrainingModal
                            {...containerProps}
                            minimized={isMinimized}
                            onGoHome={goHome}
                            onGoBack={goBack}
                            onSettings={settingsAccess.hasAccess ? onSettings : undefined}
                            containerConfig={containerConfig}
                            badgeProps={badgeProps}
                        >
                            <TrainingContainerContent content={content} defaultContent={defaultContent} />
                        </InteractiveTrainingModal>
                    ),
                };
        }
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
