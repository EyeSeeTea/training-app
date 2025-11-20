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
    let isPatched = false;

    function notify() {
        listeners.forEach(function (fn) {
            fn();
        });
    }

    function patch() {
        if (isPatched) return;
        isPatched = true;

        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;

        window.history.pushState = function (...args) {
            originalPushState.apply(this, args);
            notify();
        };

        window.history.replaceState = function (...args) {
            originalReplaceState.apply(this, args);
            notify();
        };

        window.addEventListener("hashchange", notify);
        window.addEventListener("popstate", notify);
    }

    function subscribe(callback: () => void) {
        patch();
        listeners.add(callback);

        return function unsubscribe() {
            listeners.delete(callback);
        };
    }

    return { subscribe };
}
