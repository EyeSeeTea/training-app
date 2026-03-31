import { useEffect } from "react";

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
                const intervalId = window.setInterval(apply, 100);
                const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 4000);
                apply();

                return () => {
                    window.clearInterval(intervalId);
                    window.clearTimeout(timeoutId);
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
