import React, { createContext } from "react";

import { TrainingModule } from "../../domain/entities/TrainingModule";
import { getCompositionRoot } from "../../webapp/CompositionRoot";
import { buildTranslate, TranslatableText } from "../../domain/entities/TranslatableText";
import { ActionButton } from "../../webapp/components/action-button/ActionButton";

import { LoadingProvider, SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { D2Api } from "../../types/d2-api";
import { Maybe } from "../../types/utils";
import { InteractiveTrainingModal } from "./InteractiveTrainingModal";

type InteractiveTrainingContextState = {
    modules: TrainingModule[];
    trigger: (props: { targetId: string; kind?: string; value?: unknown }) => void;
};
export const InteractiveTrainingContext = createContext<Maybe<InteractiveTrainingContextState>>(undefined);

export type TutorialModuleProps = {
    baseUrl?: string;
    locale?: string;
};

export type UseTutorialModuleProps = { baseUrl: string };
function useTraining(props: UseTutorialModuleProps) {
    const { baseUrl } = props;
    const compositionRoot = React.useMemo(() => getCompositionRoot(new D2Api({ baseUrl: baseUrl })), [baseUrl]);
    const [modules, setModules] = React.useState<TrainingModule[]>();

    React.useEffect(() => {
        compositionRoot.usecases.modules
            .list()
            .then(setModules)
            .catch(() => {
                console.error(`No modules found`);
            });
    }, [compositionRoot]);

    return modules;
}

export const InteractiveTrainingProvider: React.FC<TutorialModuleProps> = props => {
    const { baseUrl, locale = "en", children } = props;
    const [content, setContent] = React.useState<TranslatableText>();
    const [moduleState, setModuleState] = React.useState<"default" | "minimized">("default");
    const modules = useTraining({ baseUrl: baseUrl || "" });

    const translateMethod = React.useMemo(() => buildTranslate(locale), [locale]);

    const trigger = React.useCallback(
        (props: { targetId: string; kind?: string }) => {
            const { targetId } = props;
            const [moduleId, stepId] = targetId.split(".");
            const module = modules?.find(module => module.id === moduleId);
            console.log("trigger", props, modules, targetId);
            if (module) {
                const step = module.contents.steps.find(step => step.id === stepId) || module.contents.steps[0];
                if (step) {
                    setContent(step.pages[0]);
                }
            }
        },
        [modules]
    );

    if (!modules) return null;
    if (moduleState === "minimized") return <ActionButton onClick={() => setModuleState("default")} />;

    return (
        <InteractiveTrainingContext.Provider
            value={{
                modules,
                trigger,
            }}
        >
            <LoadingProvider>
                <SnackbarProvider>
                    {children}
                    <InteractiveTrainingModal translate={translateMethod} minimized={false} content={content} />
                </SnackbarProvider>
            </LoadingProvider>
        </InteractiveTrainingContext.Provider>
    );
};
