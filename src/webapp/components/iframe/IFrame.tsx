import { useLoading } from "@eyeseetea/d2-ui-components";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useDisplayGlobalShellHeader } from "../../hooks/useDisplayGlobalShellHeader";

const IFRAME_LOADED_EVENT = "training-app:iframe-loaded";

export const IFrame: React.FC<IFrameProps> = ({ className, src, title = "IFrame" }) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const loading = useLoading();
    useDisplayGlobalShellHeader("none");

    useEffect(() => {
        loading.show();
        const iframe = ref.current;
        if (!iframe) {
            loading.hide();
            return;
        }

        const onLoad = () => {
            loading.hide();
            // Re-apply Global Shell header hiding after iframe navigations.
            window.dispatchEvent(new Event(IFRAME_LOADED_EVENT));
        };

        iframe.addEventListener("load", onLoad);
        return () => iframe.removeEventListener("load", onLoad);
    }, [loading]);

    return (
        <StyledIFrame
            className={className}
            ref={ref}
            src={src}
            title={title}
            style={{ width: "100%", height: "100%" }}
            frameBorder="0"
        />
    );
};

export interface IFrameProps {
    src: string;
    title?: string;
    className?: string;
}

const StyledIFrame = styled.iframe`
    position: absolute;
`;
