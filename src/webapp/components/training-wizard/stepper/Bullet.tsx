import DoneIcon from "@material-ui/icons/Done";
import React, { MouseEvent } from "react";
import styled from "styled-components";
import { getColor } from "../../../themes/colors";

const BaseBullet: React.FC<BulletProps> = ({ className, stepKey, completed, onClick }) => {
    return (
        <div className={className} onClick={onClick}>
            {completed ? <StyledDoneIcon /> : stepKey}
        </div>
    );
};

export interface BulletProps {
    className?: string;
    stepKey: number;
    current?: boolean;
    completed?: boolean;
    last?: boolean;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export const Bullet = styled(BaseBullet)`
    font-weight: 700;
    border: 0px;
    padding: 5px;
    border-radius: 100px;
    height: 20px;
    width: 20px;
    display: inline-block;
    line-height: 20px;
    cursor: ${props => (props.onClick ? "pointer" : "inherit")};
    user-select: none;
    align-self: center;

    color: #276696;
    background-color: ${props => (props.current || props.completed ? getColor("primary") : "#fff")};

    ::after {
        display: ${props => (props.completed && !props.last ? "inline-block" : "none")};
        content: "";
        position: absolute;
        bottom: 12px;
        height: 3px;
        width: 80%;
        background-color: ${getColor("primary")};
        margin-left: 10px;
    }
`;

const StyledDoneIcon = styled(DoneIcon)`
    font-size: 18px !important;
    color: #fff;
    font-weight: bold;
`;
