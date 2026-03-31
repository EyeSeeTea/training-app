import { useEffect } from "react";

const IFRAME_LOADED_EVENT = "training-app:iframe-loaded";

export function useDisplayGlobalShellHeader(display: "none" | "block") {
    useEffect(() => {
        const renderAppAsIframe = window.self !== window.top;

        if (renderAppAsIframe) {
            try {
                const parentDoc = window.parent.document;
                const selectors = [
                    "header.global-shell-header",
                    '[class*="global-shell-header"]',
                    'header[data-test="headerbar"]',
                    "header.jsx-3716963661",
                ];

                const apply = (value: "none" | "block" = display) => {
                    for (const selector of selectors) {
                        const header = parentDoc.querySelector(selector);
                        if (header) {
                            (header as HTMLElement).style.setProperty("display", value, "important");
                        }
                    }
                };

                // The Global Shell may re-render and overwrite styles; re-apply briefly.
                // We run this on mount and also after each iframe load (navigation).
                let intervalId: number | undefined;
                let timeoutId: number | undefined;

                const startReapplyWindow = () => {
                    if (intervalId) window.clearInterval(intervalId);
                    if (timeoutId) window.clearTimeout(timeoutId);

                    intervalId = window.setInterval(() => apply(), 100);
                    timeoutId = window.setTimeout(() => {
                        if (intervalId) window.clearInterval(intervalId);
                        intervalId = undefined;
                        timeoutId = undefined;
                    }, 4000);

                    apply();
                };

                window.addEventListener(IFRAME_LOADED_EVENT, startReapplyWindow);
                startReapplyWindow();

                return () => {
                    window.removeEventListener(IFRAME_LOADED_EVENT, startReapplyWindow);
                    if (intervalId) window.clearInterval(intervalId);
                    if (timeoutId) window.clearTimeout(timeoutId);
                    // If we hid the header while the iframe was mounted, restore it when unmounting
                    // so pages like Settings (without iframe) get the Global Shell header back.
                    if (display === "none") {
                        apply("block");
                    }
                };
            } catch (error) {
                console.warn("Could not hide Global Shell header:", error);
            }
        }
    }, [display]);
}
