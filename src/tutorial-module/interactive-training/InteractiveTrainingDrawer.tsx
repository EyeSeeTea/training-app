import styled, { css } from "styled-components";
import React from "react";
import { Box, Drawer } from "@material-ui/core";
import BackIcon from "@material-ui/icons/ArrowBack";
import SettingsIcon from "@material-ui/icons/Settings";
import HomeIcon from "@material-ui/icons/Home";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import MinimizeIcon from "@material-ui/icons/Minimize";
import AddIcon from "@material-ui/icons/Add";

import { SideBarConfig } from "../../domain/entities/Config";
import { Tooltip, TooltipText } from "../../webapp/components/tooltip/Tooltip";
import i18n from "../../utils/i18n";
import { ScrollableContainer } from "./ScrollableContainer";
import { ActionButton } from "../../webapp/components/action-button/ActionButton";

const DRAWER_COLLAPSED_WIDTH = 40;

type SideDrawerProps = {
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

export const InteractiveTrainingDrawer: React.FC<SideDrawerProps> = props => {
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
    const isHideMode = containerConfig.collapseMode === "hide";
    const sidePanelButtonText = isMinimized ? i18n.t("Expand panel") : i18n.t("Collapse panel");
    const sidePanelButtonTooltipPlacement = isHideMode
        ? "left"
        : isRight
        ? isMinimized
            ? "left"
            : "right"
        : isMinimized
        ? "right"
        : "left";
    const headerOptionsTooltipPlacement = isHideMode ? "right" : isRight ? "left" : "right";

    const ChevronIcon = getChevronIcon(isRight, isMinimized);
    const onChevronClick = isMinimized ? showTraining : onMinimize;

    const drawer = (
        <StyledDrawer
            variant={isHideMode ? "persistent" : "permanent"}
            anchor={containerConfig.position}
            open={!isMinimized}
            width={containerConfig.width}
            unit={containerConfig.unit}
            showMini={!isHideMode}
        >
            <DrawerHeader isRight={isHideMode ? false : isRight}>
                {!isMinimized && (
                    <HeaderOptions>
                        {onBack && (
                            <HeaderButton text={i18n.t("Back")} placement={headerOptionsTooltipPlacement}>
                                <BackIcon onClick={onBack} />
                            </HeaderButton>
                        )}
                        {onSettings && (
                            <HeaderButton text={i18n.t("Settings page")} placement={headerOptionsTooltipPlacement}>
                                <SettingsIcon onClick={onSettings} />
                            </HeaderButton>
                        )}
                        {onHome && (
                            <HeaderButton text={i18n.t("Home")} placement={headerOptionsTooltipPlacement}>
                                <HomeIcon onClick={onHome} />
                            </HeaderButton>
                        )}
                    </HeaderOptions>
                )}

                <HeaderButton text={sidePanelButtonText} placement={sidePanelButtonTooltipPlacement}>
                    {isHideMode ? (
                        isMinimized ? (
                            <AddIcon onClick={showTraining} />
                        ) : (
                            <MinimizeIcon onClick={onMinimize} />
                        )
                    ) : (
                        <ChevronIcon onClick={onChevronClick} />
                    )}
                </HeaderButton>
            </DrawerHeader>

            {!isMinimized && <Content triggerKey={triggerKey}>{drawerContent}</Content>}
        </StyledDrawer>
    );

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
        <Box display="flex">
            {!isRight && drawer}
            <Box flexGrow={1}>{children}</Box>
            {isRight && drawer}
            {isHideMode && isMinimized && (
                <ActionButtonContainer hidden={false}>
                    <ActionButton onClick={showTraining} {...position}>
                        <HelpButton>?</HelpButton>
                    </ActionButton>
                </ActionButtonContainer>
            )}
        </Box>
    );
};

function getChevronIcon(isRight: boolean, isMinimized: boolean) {
    const expandRight = isRight && isMinimized;
    const collapseLeft = !isRight && !isMinimized;
    return expandRight || collapseLeft ? ChevronLeftIcon : ChevronRightIcon;
}

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
        z-index: 9999;
        left: ${({ placement }) => (placement === "right" ? "150%" : "unset")};
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

const StyledDrawer = styled(Drawer)<{ open: boolean; width: number; unit: SideBarConfig["unit"]; showMini: boolean }>`
    flex-shrink: 0;
    color: white;

    ${({ open, width, unit, showMini }) => {
        if (open) return openedStyles({ width, unit });
        if (showMini) return closedStyles;
        return "";
    }}
`;

const drawerPaperStyles = css`
    background-color: #276696;
    border-left: 2px solid #2b5b77;
`;

const openedStyles = ({ width, unit }: { width: number; unit: SideBarConfig["unit"] }) => css`
    width: ${width}${unit};
    min-width: 450px;
    transition: width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
    overflow-x: hidden;

    & .MuiDrawer-paper {
        width: ${width}${unit};
        min-width: 450px;
        transition: width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
        overflow-x: hidden;
        ${drawerPaperStyles}
    }
`;

const closedStyles = css`
    transition: width 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
    width: ${DRAWER_COLLAPSED_WIDTH}px;
    overflow: visible;

    & .MuiDrawer-paper {
        transition: width 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms;
        width: ${DRAWER_COLLAPSED_WIDTH}px;
        overflow: visible;
        ${drawerPaperStyles}
    }
`;

const ActionButtonContainer = styled.div<{ hidden: boolean }>`
    visibility: ${({ hidden }) => (hidden ? "hidden" : "visible")};

    .MuiFab-root {
        padding: 0;
    }
`;

const HelpButton = styled.div`
    font-size: 20px;
`;
