import styled, { css } from "styled-components";
import React from "react";
import { Box, Drawer } from "@material-ui/core";
import BackIcon from "@material-ui/icons/ArrowBack";
import SettingsIcon from "@material-ui/icons/Settings";
import HomeIcon from "@material-ui/icons/Home";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import { SideBarConfig } from "../../domain/entities/Config";
import { Tooltip, TooltipText } from "../../webapp/components/tooltip/Tooltip";
import i18n from "../../utils/i18n";
import { ScrollableContainer } from "./ScrollableContainer";

const DRAWER_COLLAPSED_WIDTH = 40;

type TrainingModalProps = {
    isMinimized: boolean;
    onMinimize: () => void;
    showTraining: () => void;
    onBack?: () => void;
    onHome?: () => void;
    onSettings?: () => void;
    triggerKey: string;
    containerConfig: SideBarConfig;
    drawerContent: React.ReactNode;
};

export const InteractiveTrainingDrawer: React.FC<TrainingModalProps> = props => {
    const {
        isMinimized,
        onMinimize,
        showTraining,
        onBack,
        onHome,
        onSettings,
        children,
        triggerKey,
        containerConfig,
        drawerContent,
    } = props;

    const isRight = containerConfig.position === "right";
    const sidePanelButtonText = isMinimized ? i18n.t("Expand panel") : i18n.t("Collapse panel");
    const sidePanelButtonTooltipPlacement = isRight === isMinimized ? "left" : "right";

    const drawer = (
        <StyledDrawer
            variant="permanent"
            anchor={containerConfig.position}
            open={!isMinimized}
            width={containerConfig.width}
            unit={containerConfig.unit}
        >
            <DrawerHeader isRight={isRight}>
                {!isMinimized && (
                    <HeaderOptions>
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
                    </HeaderOptions>
                )}

                <HeaderButton text={sidePanelButtonText} placement={sidePanelButtonTooltipPlacement}>
                    {isMinimized ? (
                        isRight ? (
                            <ChevronLeftIcon onClick={showTraining} />
                        ) : (
                            <ChevronRightIcon onClick={showTraining} />
                        )
                    ) : isRight ? (
                        <ChevronRightIcon onClick={onMinimize} />
                    ) : (
                        <ChevronLeftIcon onClick={onMinimize} />
                    )}
                </HeaderButton>
            </DrawerHeader>
            {!isMinimized && <Content triggerKey={triggerKey}>{drawerContent}</Content>}
        </StyledDrawer>
    );

    return (
        <Box display="flex">
            {!isRight && drawer}
            <Box flexGrow={1}>{children}</Box>
            {isRight && drawer}
        </Box>
    );
};

const Content = styled(ScrollableContainer)`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #fff #6894b5;
    margin-top: 8px;
`;

const HeaderOptions = styled.div`
    display: flex;
    gap: 8px;
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

const DrawerHeader = styled.div<{ isRight?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block-start: 12px;
    padding-inline: 12px;
    color: white;
    flex-direction: ${({ isRight }) => (isRight ? "row-reverse" : "row")};
`;

const StyledDrawer = styled(Drawer)<{ open?: boolean; width: number; unit: SideBarConfig["unit"] }>`
    width: ${({ width, unit }) => `${width}${unit}`};
    flex-shrink: 0;
    box-sizing: border-box;
    color: white;

    ${({ open, width, unit }) => (open ? openedStyles({ width, unit }) : closedStyles)}
`;

const openedStyles = ({ width, unit }: { width: number; unit: SideBarConfig["unit"] }) => css`
    width: ${width}${unit};
    transition: width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
    overflow-x: hidden;
    & .MuiDrawer-paper {
        width: ${width}${unit};
        transition: width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
        overflow-x: hidden;
        background-color: #276696;
        border-left: 2px solid #2b5b77;
    }
`;

const closedStyles = css`
    transition: width 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
    width: ${DRAWER_COLLAPSED_WIDTH}px;
    & .MuiDrawer-paper {
        transition: width 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
        width: ${DRAWER_COLLAPSED_WIDTH}px;
        background-color: #276696;
        border-left: 2px solid #2b5b77;
    }
`;
