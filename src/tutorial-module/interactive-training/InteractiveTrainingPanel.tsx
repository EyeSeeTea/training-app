import styled from "styled-components";
import React from "react";
import { Box } from "@material-ui/core";
import MinimizeIcon from "@material-ui/icons/Minimize";
import SettingsIcon from "@material-ui/icons/Settings";

import { Tooltip, TooltipText } from "../../webapp/components/tooltip/Tooltip";
import i18n from "../../utils/i18n";
import BackIcon from "@material-ui/icons/ArrowBack";
import HomeIcon from "@material-ui/icons/Home";
import { ScrollableContainer } from "./ScrollableContainer";

type TrainingModalProps = {
    onMinimize: () => void;
    onBack?: () => void;
    onHome?: () => void;
    minimized?: boolean;
    onSettings?: () => void;
    triggerKey: string;
};

export const InteractiveTrainingPanel: React.FC<TrainingModalProps> = props => {
    const { onMinimize, onBack, onHome, minimized, onSettings, children, triggerKey } = props;

    return (
        <StyledPanel minimized={minimized}>
            <CollapseIconContainer>
                <HeaderLeft>
                    {onBack && (
                        <HeaderButton text={i18n.t("Back")}>
                            <BackIcon onClick={onBack} />
                        </HeaderButton>
                    )}
                    {onSettings && (
                        <HeaderButton text={i18n.t("Settings page")}>
                            <SettingsIcon onClick={onSettings} />
                        </HeaderButton>
                    )}
                    {onHome && (
                        <HeaderButton text={i18n.t("Home")}>
                            <HomeIcon onClick={onHome} />
                        </HeaderButton>
                    )}
                </HeaderLeft>
                <HeaderButton text={i18n.t("Collapse panel")}>
                    <MinimizeIcon onClick={onMinimize} />
                </HeaderButton>
            </CollapseIconContainer>
            <Content triggerKey={triggerKey}>{children}</Content>
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

const Content = styled(ScrollableContainer)`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #fff #6894b5;
    margin-top: 8px;
`;

const HeaderLeft = styled.div`
    display: flex;
    gap: 8px;
`;
