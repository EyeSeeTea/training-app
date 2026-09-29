import styled from "styled-components";
import { Modal } from "./Modal";

export const CenteredModal = styled(Modal)`
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
`;
