import styled from "styled-components";
import React, { useMemo } from "react";
import { Modal, ModalContent } from "../../webapp/components/modal";
import { MarkdownViewer } from "../../webapp/components/markdown-viewer/MarkdownViewer";
import { TranslatableText, TranslateMethod } from "../../domain/entities/TranslatableText";

type TrainingModalProps = {
    contents: TranslatableText[];
    translate: TranslateMethod;
};

export const InteractiveTrainingModal: React.FC<React.ComponentProps<typeof Modal> & TrainingModalProps> = props => {
    const { contents, translate, onMinimize } = props;

    const content = useMemo(
        () => contents.reduce((acc, content) => `${acc}\n\n${translate(content)}`, ""),
        [contents, translate]
    );

    return (
        <StyledModal onMinimize={onMinimize} centerChildren={true}>
            <ModalContent>{content && <MarkdownViewer source={content} />}</ModalContent>
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
