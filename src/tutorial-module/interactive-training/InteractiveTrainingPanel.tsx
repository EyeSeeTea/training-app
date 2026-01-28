import styled from "styled-components";
import React from "react";
import { Box } from "@material-ui/core";
import MinimizeIcon from "@material-ui/icons/Minimize";
import SettingsIcon from "@material-ui/icons/Settings";

import { MarkdownViewer } from "../../webapp/components/markdown-viewer/MarkdownViewer";
import { Tooltip, TooltipText } from "../../webapp/components/tooltip/Tooltip";
import i18n from "../../utils/i18n";

type TrainingModalProps = {
    content: string;
    onMinimize: () => void;
    minimized?: boolean;
    onSettings?: () => void;
};

export const InteractiveTrainingPanel: React.FC<TrainingModalProps> = props => {
    const { content, onMinimize, minimized, onSettings } = props;
    return (
        <StyledPanel minimized={minimized}>
            <CollapseIconContainer>
                {onSettings && (
                    <HeaderButton text={i18n.t("Settings page")}>
                        <SettingsIcon onClick={onSettings} />
                    </HeaderButton>
                )}
                <HeaderButton text={i18n.t("Collapse panel")}>
                    <MinimizeIcon onClick={onMinimize} />
                </HeaderButton>
            </CollapseIconContainer>
            <Content>{content && <MarkdownViewer source={content} />}</Content>
        </StyledPanel>
    );
};

const StyledPanel = styled(Box)<{ minimized?: boolean }>`
    background-color: #276696;
    border-left: 2px solid #2b5b77;
    position: relative;
    visibility: ${({ minimized }) => (minimized ? "hidden" : "visible")};
`;

const CollapseIconContainer = styled.div`
    display: flex;
    padding-top: 12px;
    padding-inline: 12px;
    color: white;
    justify-content: space-between;
`;

const HeaderButton = styled(Tooltip)`
    cursor: pointer;

    svg {
        font-size: 18px !important;
        font-weight: bold;
    }

    ${TooltipText} {
        top: 5px;
    }
`;

const Content = styled(Box)`
    height: calc(100% - 40px);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #fff #6894b5;
    margin-top: 8px;
`;
