import { useContext } from "react";
import { InteractiveTrainingContext } from "../InteractiveTrainingProvider";

export function useInteractiveTrainingContext() {
    const context = useContext(InteractiveTrainingContext);
    if (!context) {
        throw new Error("useInteractiveTrainingContext must be used within InteractiveTrainingProvider");
    }
    return context;
}

export function bind(id: string) {
    return { "data-training-id": id };
}
