import { getModuleLaunchUrl, TrainingModule } from "../../domain/entities/TrainingModule";
import { Maybe } from "../../types/utils";
import { ModuleUnavailableReason } from "../components/module-unavailable/ModuleUnavailable";
import { ModulesStatus } from "../contexts/app-context";

export type ModuleFrame =
    | { type: "iframe"; src: string }
    | { type: "none" }
    | { type: "unavailable"; reason: ModuleUnavailableReason };

/** Uses the URL key because `appState.module` lags behind the URL during navigation. */
export function getModuleFrame(options: {
    baseUrl: string;
    moduleKey: Maybe<string>;
    modules: Pick<TrainingModule, "id" | "dhisLaunchUrl">[];
    modulesStatus: ModulesStatus;
}): ModuleFrame {
    const { baseUrl, moduleKey, modules, modulesStatus } = options;

    // Home shows the server root behind the backdrop.
    if (!moduleKey) return { type: "iframe", src: baseUrl };

    const module = modules.find(({ id }) => id === moduleKey);

    if (module) {
        const src = getModuleLaunchUrl(baseUrl, module);
        return src ? { type: "iframe", src } : { type: "none" };
    }

    switch (modulesStatus) {
        case "loading":
            return { type: "none" };
        case "loaded":
            return { type: "unavailable", reason: "not-found" };
        case "failed":
            return { type: "unavailable", reason: "load-failed" };
    }
}
