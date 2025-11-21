import styled from "styled-components";
import React from "react";
import { Box } from "@material-ui/core";
import MinimizeIcon from "@material-ui/icons/Minimize";

import { MarkdownViewer } from "../../webapp/components/markdown-viewer/MarkdownViewer";
import { Tooltip, TooltipText } from "../../webapp/components/tooltip/Tooltip";
import i18n from "../../utils/i18n";

type TrainingModalProps = {
    content: string;
    onMinimize: () => void;
};

export const InteractiveTrainingPanel: React.FC<TrainingModalProps> = props => {
    const { content, onMinimize } = props;
    return (
        <StyledPanel>
            <CollapseIconContainer>
                <MinimizeButton text={i18n.t("Collapse panel")}>
                    <MinimizeIcon onClick={onMinimize} />
                </MinimizeButton>
            </CollapseIconContainer>
            <Content>{content && <MarkdownViewer source={content} />}</Content>
        </StyledPanel>
    );
};

const StyledPanel = styled(Box)`
    background-color: #276696;
    border-left: 2px solid #2b5b77;
    position: relative;
`;

const CollapseIconContainer = styled.div`
    position: absolute;
    top: 8px;
    right: 8px;
    color: white;
`;

const MinimizeButton = styled(Tooltip)`
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
    padding: 16px;
`;
