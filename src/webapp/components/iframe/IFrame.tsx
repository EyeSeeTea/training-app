import CircularProgress from "@material-ui/core/CircularProgress";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDisplayGlobalShellHeader } from "../../hooks/useDisplayGlobalShellHeader";

const IFRAME_LOADED_EVENT = "training-app:iframe-loaded";

export const IFrame: React.FC<IFrameProps> = ({ className, src, title = "IFrame" }) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const [isLoaded, setLoaded] = useState(false);
    useDisplayGlobalShellHeader("none");

    useEffect(() => {
        setLoaded(false);

        const iframe = ref.current;
        if (!iframe) return;

        const onLoad = () => {
            setLoaded(true);
            // Re-apply Global Shell header hiding after iframe navigations.
            window.dispatchEvent(new Event(IFRAME_LOADED_EVENT));
        };

        iframe.addEventListener("load", onLoad);
        return () => iframe.removeEventListener("load", onLoad);
    }, [src]);

    return (
        <Container className={className}>
            <StyledIFrame ref={ref} src={src} title={title} frameBorder="0" />
            {!isLoaded ? <Spinner size={65} thickness={2} /> : null}
        </Container>
    );
};

export interface IFrameProps {
    src: string;
    title?: string;
    className?: string;
}

const Container = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
`;

const StyledIFrame = styled.iframe`
    width: 100%;
    height: 100%;
    border: 0;
`;

const Spinner = styled(CircularProgress)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
`;
