import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EventType } from "../../domain/entities/PageBinding";
import { Optional } from "../../types/utils";
import { InteractiveTrainingContextState } from "./InteractiveTrainingProvider";
import { EventPageIdsByTrainingId, getEventPageIdsByTrainingIdMap, getSectionPageIds } from "./utils";
import { createLocationObserver } from "./LocaionObserver";

type UseBindingEventProps = InteractiveTrainingContextState & {
    highlightElementsWithBindings?: boolean;
};

export function useBindEvents(props: UseBindingEventProps) {
    const { trigger, pages, events = ["click", "focus", "section"], highlightElementsWithBindings } = props;
    const noPages = !pages.length;

    const pathname = useCurrentPathname();
    const trainingScopeRef = useRef<HTMLDivElement>(null);
    const [highlightedElement, setHighlightedElement] = useState<Element>();
    const [lastTriggeredPath, setLastTriggeredPath] = useState("");

    const updateHighlightedElement = useCallback((element: Optional<Element>) => {
        if (!highlightElementsWithBindings) return;
        else setHighlightedElement(element);
    }, []);
    const eventSet = useMemo<Set<EventType>>(
        () => new Set(events.filter(e => e !== "section") as EventType[]),
        [events]
    );

    const eventPageIdsByTrainingId = useMemo(() => getEventPageIdsByTrainingIdMap(pages, eventSet), [pages, eventSet]);
    const sectionPageIds = useMemo(() => {
        return getSectionPageIds(pathname, pages);
    }, [pathname, pages]);

    useEffect(() => {
        const root = trainingScopeRef.current;
        if (!root || noPages) return;
        return setupEventListeners({
            root,
            eventSet,
            eventPageIdsByTrainingId,
            sectionPageIds,
            trigger,
            updateHighlightedElement,
        });
    }, [eventSet, eventPageIdsByTrainingId, sectionPageIds, trigger, noPages]);

    useEffect(() => {
        if (!events.includes("section") || !sectionPageIds.length || noPages) return;
        else if (lastTriggeredPath === pathname) return;
        else {
            setLastTriggeredPath(pathname);
            trigger({ targetIds: sectionPageIds });
        }
    }, [pathname, sectionPageIds, trigger, events]);

    useEffect(() => {
        if (!highlightElementsWithBindings) return;
        else if (!highlightedElement || noPages) return;
        else {
            highlightedElement.classList.add("training-highlight");

            return () => {
                highlightedElement.classList.remove("training-highlight");
            };
        }
    }, [highlightedElement]);

    return { trainingScopeRef };
}

function useCurrentPathname() {
    const [url, setUrl] = useState(() => window.location.pathname + window.location.hash);
    const observerRef = useRef<ReturnType<typeof createLocationObserver>>();

    useEffect(() => {
        if (!observerRef.current) {
            observerRef.current = createLocationObserver();
        }

        const handleChange = () => {
            const newUrl = window.location.pathname + window.location.hash;
            setUrl(newUrl);
        };
        return observerRef.current.subscribe(handleChange);
    }, []);

    return url;
}

type EventListenerTypes = EventType | "hover";
type SetupEventListenersProps = {
    root: HTMLDivElement;
    eventSet: Set<EventType>;
    eventPageIdsByTrainingId: EventPageIdsByTrainingId;
    sectionPageIds: string[];
    trigger: InteractiveTrainingContextState["trigger"];
    updateHighlightedElement: (element: Optional<Element>) => void;
};
function setupEventListeners(props: SetupEventListenersProps) {
    const { root, eventSet, eventPageIdsByTrainingId, trigger, sectionPageIds, updateHighlightedElement } = props;

    // capture: true - intercept events before component handlers
    // passive: true - don't block scrolling (we only observe, never preventDefault)
    const optsPassive: AddEventListenerOptions = { capture: true, passive: true };

    const getPageIdsForTrainingElement = (element: Element, eventType: EventListenerTypes): string[] => {
        const trainingId = element.getAttribute("data-training-id");
        if (!trainingId) return [];

        const pageIds =
            eventPageIdsByTrainingId[eventType]?.[trainingId] ??
            eventPageIdsByTrainingId["all"]?.[trainingId] ??
            sectionPageIds;
        console.log("trainingId", trainingId, eventType, eventPageIdsByTrainingId);
        return pageIds.length > 0 ? pageIds : [];
    };

    const findPageIdsFromTarget = (target: EventTarget | null, eventType: EventListenerTypes): string[] => {
        if (!(target instanceof Element)) return [];

        const selector = `[data-training-id]`;

        const searchUpwards = (element: Element): string[] => {
            const match = element.closest(selector);

            if (!match || !root.contains(match)) {
                updateHighlightedElement(undefined);
                return [];
            }

            const pageIds = getPageIdsForTrainingElement(match, eventType);
            if (pageIds.length > 0) {
                updateHighlightedElement(match);
                return pageIds;
            } else {
                const parent = match.parentElement;
                if (!parent) return [];
                return searchUpwards(parent);
            }
        };

        return searchUpwards(target);
    };

    const handleClick = (e: Event) => {
        const pageIds = findPageIdsFromTarget(e.target, "click");
        if (pageIds.length === 0) return;
        console.log("handleClick fired", e.target);
        trigger({ targetIds: pageIds });
    };

    const handleFocus = (e: Event) => {
        const pageIds = findPageIdsFromTarget(e.target, "focus");
        if (pageIds.length === 0) return;
        console.log("handleFocus fired", e.target);
        trigger({ targetIds: pageIds });
    };

    const handleHover = (e: Event) => {
        findPageIdsFromTarget(e.target, "hover");
    };

    console.log("Registering event listeners on root:", root);
    console.log("Event set:", Array.from(eventSet));

    if (eventSet.has("click")) {
        console.log("Adding click listener");
        root.addEventListener("click", handleClick, optsPassive);
    }
    if (eventSet.has("focus")) {
        console.log("Adding focus listener");
        root.addEventListener("focusin", handleFocus, optsPassive);
    }
    console.log("Adding mouseover listener");
    root.addEventListener("mouseover", handleHover, optsPassive);

    return () => {
        if (eventSet.has("click")) root.removeEventListener("click", handleClick, optsPassive);
        if (eventSet.has("focus")) root.removeEventListener("focusin", handleFocus, optsPassive);
        root.removeEventListener("mouseover", handleHover, optsPassive);
    };
}
