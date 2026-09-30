import { useMemo } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import { Maybe } from "../../types/utils";
import { useAppContext } from "../contexts/app-context";
import { AppRoute, ReactRouterRoute } from "./AppRoute";

export interface CurrentRoute {
    route: Maybe<AppRoute>;
    params: Record<string, string>;
}

export function useCurrentRoute(routerRoutes: ReactRouterRoute[]): CurrentRoute {
    const { routes } = useAppContext();
    const { pathname } = useLocation();

    return useMemo(() => {
        const match = matchRoutes(routerRoutes, pathname)?.[0];
        const path = match?.route.path ?? "";
        return { route: routes.find(({ paths }) => paths.includes(path)), params: match?.params ?? {} };
    }, [routes, routerRoutes, pathname]);
}
