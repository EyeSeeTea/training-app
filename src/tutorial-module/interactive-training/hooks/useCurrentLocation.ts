import { useEffect, useRef, useState } from "react";

export function useCurrentLocation() {
    const [url, setUrl] = useState(getLocation());
    const observerRef = useRef<ReturnType<typeof createLocationObserver>>();

    useEffect(() => {
        if (!observerRef.current) {
            observerRef.current = createLocationObserver();
        }

        const handleChange = () => {
            setUrl(getLocation());
        };

        return observerRef.current.subscribe(handleChange);
    }, []);

    return url;
}

function getLocation() {
    return window.location.pathname + window.location.hash;
}

function createLocationObserver() {
    const listeners = new Set<() => void>();

    const notify = () => listeners.forEach(fn => fn());

    const patch = () => {
        const { pushState, replaceState } = window.history;
        window.history.pushState = function (...args) {
            pushState.apply(this, args);
            notify();
        };
        window.history.replaceState = function (...args) {
            replaceState.apply(this, args);
            notify();
        };
        window.addEventListener("hashchange", notify);
        window.addEventListener("popstate", notify);
    };

    const unpatch = () => {
        window.removeEventListener("hashchange", notify);
        window.removeEventListener("popstate", notify);
    };

    const subscribe = (callback: () => void) => {
        if (listeners.size === 0) patch();
        listeners.add(callback);
        return () => {
            listeners.delete(callback);
            if (listeners.size === 0) unpatch();
        };
    };

    return { subscribe };
}
