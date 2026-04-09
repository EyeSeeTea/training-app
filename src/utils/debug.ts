const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === "test";

export const log = (...message: unknown[]) => {
    if (isDevelopment && !isTest) console.debug("[Training]", ...message);
};
