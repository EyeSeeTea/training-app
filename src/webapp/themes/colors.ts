import { Dictionary } from "../../types/utils";

export type Color = "primary" | "secondary";
export type ColorPalette = "main" | "light" | "dark";

const theme: Dictionary<Dictionary<string>> = {
    main: {
        primary: "#43CBCB",
        secondary: "#ff8f02",
    },
    light: {
        primary: "#7efffe",
        secondary: "#ffc046",
    },
    dark: {
        primary: "#009a9a",
        secondary: "#c56000",
    },
};

export const getColor = (color = "primary", palette = "main") => {
    return theme[palette][color] ?? theme.main.primary;
};