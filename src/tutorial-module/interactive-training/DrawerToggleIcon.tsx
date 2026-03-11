import React from "react";
import { HeaderButton } from "./InteractiveTrainingDrawer";

type DrawerToggleButtonProps = {
    Icon: React.ElementType;
    onClick: () => void;
    tooltip: string;
    tooltipPlacement: "left" | "right";
};

export const DrawerToggleButton: React.FC<DrawerToggleButtonProps> = ({ Icon, onClick, tooltip, tooltipPlacement }) => (
    <HeaderButton text={tooltip} placement={tooltipPlacement}>
        <Icon onClick={onClick} />
    </HeaderButton>
);
