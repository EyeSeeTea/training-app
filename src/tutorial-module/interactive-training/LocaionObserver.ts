export function createLocationObserver() {
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

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (...args) {
            originalPushState.apply(this, args);
            notify();
        };

        history.replaceState = function (...args) {
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
