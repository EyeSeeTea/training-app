import styled from "styled-components";
import React from "react";

import { Modal, ModalContent } from "../../webapp/components/modal";

export const InteractiveTrainingModal: React.FC<React.ComponentProps<typeof Modal>> = props => {
    const { children, ...modalProps } = props;

    return (
        <StyledModal {...modalProps} centerChildren={true} allowDrag={true} resetPositionOnMinimize={false}>
            <ModalContent>{children}</ModalContent>
        </StyledModal>
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
