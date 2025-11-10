import styled from "styled-components";
import { Modal, ModalContent } from "../../webapp/components/modal";
import { MarkdownViewer } from "../../webapp/components/markdown-viewer/MarkdownViewer";
import React from "react";
import { TranslatableText, TranslateMethod } from "../../domain/entities/TranslatableText";

type TrainingModalProps = {
    content?: TranslatableText;
    translate: TranslateMethod;
};

export const InteractiveTrainingModal: React.FC<React.ComponentProps<typeof Modal> & TrainingModalProps> = props => {
    const { content, translate, onMinimize } = props;

    return (
        <StyledModal onMinimize={onMinimize} centerChildren={true}>
            <ModalContent>{content && <MarkdownViewer source={translate(content)} />}</ModalContent>
        </StyledModal>
    );
};

const StyledModal = styled(Modal)`
    position: fixed;
    margin: 6px;
    bottom: 20px;
    right: 40px;
    min-width: 600px;

    .MuiPaper-root {
        padding: ${({ minimized }) => (minimized ? "35px 0px 20px" : "inherit")};
    }
`;
