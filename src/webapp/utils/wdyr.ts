/// <reference types="@welldone-software/why-did-you-render" />

import React from "react";

if (import.meta.env.DEV) {
    // En Vite/ESM no existe `require` en el navegador.
    // Usamos import dinámico para mantener la funcionalidad en dev solamente.
    import("@welldone-software/why-did-you-render").then(mod => {
        const whyDidYouRender = (mod as any).default ?? mod;
        whyDidYouRender(React, {
            trackAllPureComponents: true,
        });
    });
}
