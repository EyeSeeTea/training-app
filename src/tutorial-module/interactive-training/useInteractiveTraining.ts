import { useContext, useEffect, useMemo, useRef } from "react";
import { InteractiveTrainingContext } from "./InteractiveTrainingProvider";

type TrainingEvent =
    | { kind: "click"; targetId: string }
    | { kind: "focus"; targetId: string }
    | { kind: "change"; targetId: string; value?: unknown }
    | { kind: "mouseover"; targetId: string }
    | { kind: "mouseout"; targetId: string };

type TrainingEventKind = TrainingEvent["kind"];

type UseInteractiveTrainingScopeOptions = {
    events?: TrainingEventKind[];
    debounceMs?: number;
    disabled?: boolean;
    capture?: boolean;
    matchAllWhenNoTrigger?: boolean;
};

export function useInteractiveTrainingScope<T extends HTMLElement = HTMLElement>({
    events = ["click", "focus", "change", "mouseover", "mouseout"],
    debounceMs = 150,
    disabled = false,
    capture = true,
    matchAllWhenNoTrigger = true,
}: UseInteractiveTrainingScopeOptions = {}) {
    const ctx = useContext(InteractiveTrainingContext);
    if (!ctx) {
        throw new Error("useInteractiveTrainingScope must be used within InteractiveTrainingProvider");
    }
    const { trigger } = ctx;

    const ref = useRef<T | null>(null);

    const eventsKey = useMemo(() => events.join("|"), [events]);
    const eventSet = useMemo(() => new Set(events), [eventsKey]);

    useEffect(() => {
        const root = ref.current;
        console.log("root", root);
        if (!root || disabled) return;

        const optsPassive: AddEventListenerOptions = { capture, passive: true };
        const optsActive: AddEventListenerOptions = { capture, passive: false };

        const matchesTrigger = (el: Element, type: TrainingEventKind) => {
            if (!el.hasAttribute("data-training-id")) return false;
            const attr = el.getAttribute("data-training-trigger");
            if (attr == null) return matchAllWhenNoTrigger;
            return attr.split(/\s+/).includes(type);
        };

        const closestTagged = (start: EventTarget | null, type: TrainingEventKind) => {
            console.log("closestTagged called", { start, type, root });
            let node = start as Element | null;
            let depth = 0;
            while (node && node !== root) {
                console.log(`closestTagged depth ${depth}:`, {
                    node,
                    tagName: node instanceof Element ? node.tagName : "not-element",
                    hasDataTrainingId: node instanceof Element ? node.hasAttribute("data-training-id") : false,
                    dataTrainingId: node instanceof Element ? node.getAttribute("data-training-id") : null,
                    dataTrainingTrigger: node instanceof Element ? node.getAttribute("data-training-trigger") : null,
                    matches: node instanceof Element ? matchesTrigger(node, type) : false,
                });
                if (node instanceof Element && matchesTrigger(node, type)) return node as HTMLElement;
                node = node.parentElement;
                depth++;
            }
            console.log("closestTagged checking root", {
                root,
                rootMatches: matchesTrigger(root, type),
                rootHasDataTrainingId: root.hasAttribute("data-training-id"),
                rootDataTrainingId: root.getAttribute("data-training-id"),
            });
            return matchesTrigger(root, type) ? (root as HTMLElement) : null;
        };

        const isDisabled = (el: HTMLElement) =>
            (el as HTMLButtonElement).disabled === true || el.getAttribute("aria-disabled") === "true";

        const getValue = (t: EventTarget | null) => {
            const el = t as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
            return el?.value;
        };

        let inputTimer: number | undefined;
        const debounce = (fn: () => void) => {
            if (!debounceMs) return fn();
            if (inputTimer) window.clearTimeout(inputTimer);
            inputTimer = window.setTimeout(fn, debounceMs);
        };

        const onClick = (e: Event) => {
            console.log("onClick fired", e.target);
            const el = closestTagged(e.target, "click");
            if (!el || isDisabled(el)) return;
            trigger({ kind: "click", targetId: el.dataset.trainingId! });
        };

        const onFocusIn = (e: Event) => {
            console.log("onFocusIn fired", e.target);
            const el = closestTagged(e.target, "focus");
            if (!el) return;
            trigger({ kind: "focus", targetId: el.dataset.trainingId! });
        };

        const onChangeLike = (e: Event) => {
            console.log("onChangeLike fired", e.target);
            const el = closestTagged(e.target, "change");
            if (!el) return;
            const val = getValue(e.target);
            const id = el.dataset.trainingId!;
            debounce(() => trigger({ kind: "change", targetId: id, value: val }));
        };

        const onMouseOver = (e: Event) => {
            console.log("onMouseOver fired", e.target);
            const el = closestTagged(e.target, "mouseover");
            if (!el) return;
            trigger({ kind: "mouseover", targetId: el.dataset.trainingId! });
        };

        const onMouseOut = (e: Event) => {
            console.log("onMouseOut fired", e.target);
            const el = closestTagged(e.target, "mouseout");
            if (!el) return;
            trigger({ kind: "mouseout", targetId: el.dataset.trainingId! });
        };

        const onKeyDown = (e: KeyboardEvent) => {
            console.log("onKeyDown fired", e.target);
            if (!eventSet.has("click")) return;
            const el = closestTagged(e.target, "click");
            if (!el || isDisabled(el)) return;
            const buttonLike = el.tagName === "BUTTON" || el.getAttribute("role") === "button" || el.tabIndex >= 0;
            if (!buttonLike) return;
            if (e.key === "Enter" || e.key === " ") {
                trigger({ kind: "click", targetId: el.dataset.trainingId! });
            }
        };

        // register
        console.log("Registering event listeners on root:", root);
        console.log("Event set:", Array.from(eventSet));
        if (eventSet.has("click")) {
            console.log("Adding click listener");
            root.addEventListener("click", onClick, optsPassive);
        }
        if (eventSet.has("focus")) {
            console.log("Adding focus listener");
            root.addEventListener("focusin", onFocusIn, optsPassive);
        }
        if (eventSet.has("change")) {
            console.log("Adding change listeners");
            root.addEventListener("input", onChangeLike, optsPassive);
            root.addEventListener("change", onChangeLike, optsPassive);
        }
        if (eventSet.has("mouseover")) {
            console.log("Adding mouseover listener");
            root.addEventListener("mouseover", onMouseOver, optsPassive);
        }
        if (eventSet.has("mouseout")) {
            console.log("Adding mouseout listener");
            root.addEventListener("mouseout", onMouseOut, optsPassive);
        }
        console.log("Adding keydown listener");
        root.addEventListener("keydown", onKeyDown, optsActive);

        return () => {
            if (eventSet.has("click")) root.removeEventListener("click", onClick, optsPassive);
            if (eventSet.has("focus")) root.removeEventListener("focusin", onFocusIn, optsPassive);
            if (eventSet.has("change")) {
                root.removeEventListener("input", onChangeLike, optsPassive);
                root.removeEventListener("change", onChangeLike, optsPassive);
            }
            if (eventSet.has("mouseover")) root.removeEventListener("mouseover", onMouseOver, optsPassive);
            if (eventSet.has("mouseout")) root.removeEventListener("mouseout", onMouseOut, optsPassive);
            root.removeEventListener("keydown", onKeyDown, optsActive);
            if (inputTimer) window.clearTimeout(inputTimer);
        };
    }, [ref, trigger, disabled, capture, debounceMs, matchAllWhenNoTrigger, eventsKey]);

    return { ref, ...training };
}

export const training = {
    click: (id: string) => ({ "data-training-id": id, "data-training-trigger": "click" } as const),
    focus: (id: string) => ({ "data-training-id": id, "data-training-trigger": "focus" } as const),
    change: (id: string) => ({ "data-training-id": id, "data-training-trigger": "change" } as const),
    mouseover: (id: string) => ({ "data-training-id": id, "data-training-trigger": "mouseover" } as const),
    mouseout: (id: string) => ({ "data-training-id": id, "data-training-trigger": "mouseout" } as const),
    bind: (id: string, triggers: TrainingEventKind[]) =>
        ({ "data-training-id": id, "data-training-trigger": triggers.join(" ") } as const),
};
