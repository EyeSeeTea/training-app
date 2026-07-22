import { getPromotedSingleSection, getUserRootLandings, LandingNode } from "../../domain/entities/LandingPage";
import { useCallback, useMemo, useState } from "react";
import { Maybe } from "../../types/utils";
import { User } from "../../data/entities/User";

type UseTrainingNavigationProps = {
    landings: LandingNode[];
    currentUser: User;
};

type NavigationState = {
    currentPage: Maybe<LandingNode>;
    isRoot: boolean;
    canGoBack: boolean;
};

export function getNavigationState(props: { history: LandingNode[]; userLandings: LandingNode[] }): NavigationState {
    const { history, userLandings } = props;

    const resolvedPage = history[0] ?? (userLandings.length > 1 ? undefined : userLandings[0]);
    const promotedSection = getPromotedSingleSection(resolvedPage);

    return {
        currentPage: promotedSection ?? resolvedPage,
        isRoot: !promotedSection && history.length === 0,
        canGoBack: history.length > 0,
    };
}

export function useTrainingNavigation(props: UseTrainingNavigationProps) {
    const { landings, currentUser } = props;

    const [history, updateHistory] = useState<LandingNode[]>([]);

    const userLandings = useMemo(() => {
        return getUserRootLandings(landings, currentUser);
    }, [currentUser, landings]);

    const { currentPage, isRoot, canGoBack } = useMemo(
        () => getNavigationState({ history, userLandings }),
        [history, userLandings]
    );

    const openPage = useCallback((page: LandingNode) => {
        updateHistory(history => [page, ...history]);
    }, []);

    const goBack = useCallback(() => {
        updateHistory(history => history.slice(1));
    }, []);

    const goHome = useCallback(() => {
        updateHistory([]);
    }, []);

    // show empty main landing if no user landings
    // similar to how it looks like upon initial install
    const isMainLandingVisible = userLandings.length > 1 || userLandings.length === 0;

    return {
        isRoot,
        canGoBack,
        currentPage,
        userLandings,
        isMainLandingVisible,
        openPage,
        goBack,
        goHome,
    };
}
