import styled from "styled-components";
import React from "react";

import { Modal, ModalContent } from "../../webapp/components/modal";
import { ScrollableContainer } from "./ScrollableContainer";

type InteractiveTrainingModalProps = React.ComponentProps<typeof Modal> & { triggerKey: string };

export const InteractiveTrainingModal: React.FC<InteractiveTrainingModalProps> = props => {
    const { children, triggerKey, ...modalProps } = props;

    return (
        <ScrollableContainer triggerKey={triggerKey} targetContainerSelector={"[data-component='modal-content']"}>
            <StyledModal {...modalProps} centerChildren={true} allowDrag={true} resetPositionOnMinimize={false}>
                <ModalContent>{children}</ModalContent>
            </StyledModal>
        </ScrollableContainer>
    );
};

const StyledModal = styled(Modal)`
    position: fixed;
    margin: 6px;
    bottom: 20px;
    right: 40px;
    min-width: 600px;

    visibility: ${({ minimized }) => (minimized ? "hidden" : "visible")};

    .MuiPaper-root {
        padding: ${({ minimized }) => (minimized ? "35px 0px 20px" : "inherit")};
    }
`;
