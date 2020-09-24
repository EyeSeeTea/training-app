import styled from "styled-components";

export const ModalContent = styled.div<{ bigger?: boolean }>`
    padding: 15px;

    margin: 0;
    overflow-x: hidden;
    overflow-y: scroll;
    overflow-y: overlay;
    scrollbar-width: thin;
    scrollbar-color: #fff transparent;

    ::-webkit-scrollbar {
        width: 6px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 6px;
    }

    ::-webkit-scrollbar-thumb {
        background: #fff;
        border-radius: 6px;
    }
`;
