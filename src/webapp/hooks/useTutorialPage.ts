import { LandingNode } from "../../domain/entities/LandingPage";
import { useCallback, useMemo, useState } from "react";

type UseTrainingPageProps = {
    landings: LandingNode[];
};

export function useTrainingNavigation(props: UseTrainingPageProps) {
    const { landings } = props;

    const [history, updateHistory] = useState<LandingNode[]>([]);
    const isRoot = history.length === 0;

    const currentPage = useMemo<LandingNode | undefined>(() => {
        return history[0] ?? landings[0];
    }, [history, landings]);

    const openPage = useCallback((page: LandingNode) => {
        updateHistory(history => [page, ...history]);
    }, []);

    const goBack = useCallback(() => {
        updateHistory(history => history.slice(1));
    }, []);

    const goHome = useCallback(() => {
        updateHistory([]);
    }, []);

    return {
        isRoot,
        currentPage,
        openPage,
        goBack,
        goHome,
    };
}
