import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EventType } from "../../domain/entities/PageBinding";
import { Optional } from "../../types/utils";
import { InteractiveTrainingContextState } from "./InteractiveTrainingProvider";
import { EventPageIdsByTrainingId, getEventPageIdsByTrainingIdMap, getSectionPageIds } from "./utils";
import { createLocationObserver } from "./LocaionObserver";

type UseBindingEventProps = InteractiveTrainingContextState & {
    highlightElementsWithBindings?: boolean;
};
type EventElement = { element: Element; trigger?: EventType };

export function useBindEvents(props: UseBindingEventProps) {
    const { trigger: doTrigger, pages, events = ["click", "focus", "section"], highlightElementsWithBindings } = props;
    const noPages = !pages.length;

    const pathname = useCurrentPathname();
    const trainingScopeRef = useRef<HTMLDivElement>(null);
    const [highlightedElement, setHighlightedElement] = useState<Element>();
    const [currentEvent, setCurrentEvent] = useState<EventElement>();
    const [lastTriggeredPath, setLastTriggeredPath] = useState("");

    const eventSet = useMemo<Set<EventType>>(
        () => new Set(events.filter(e => e !== "section") as EventType[]),
        [events]
    );
    const eventPageIdsByTrainingId = useMemo(() => getEventPageIdsByTrainingIdMap(pages, eventSet), [pages, eventSet]);
    const sectionPageIds = useMemo(() => {
        return getSectionPageIds(pathname, pages);
    }, [pathname, pages]);

    const updateHighlightedElement = useCallback((element: Optional<Element>) => {
        if (!highlightElementsWithBindings) return;
        else setHighlightedElement(element);
    }, []);
    const handleTrigger = useCallback(
        (props: EventElement & { targetIds: string[] }) => {
            const { targetIds, ...nextEvent } = props;
            if (checkNextEventPriority(currentEvent, nextEvent)) {
                doTrigger({ targetIds });
                setCurrentEvent(nextEvent);
            }
        },
        [currentEvent, doTrigger]
    );

    useEffect(() => {
        const root = trainingScopeRef.current;
        if (!root || noPages) return;
        return setupEventListeners({
            root,
            eventSet,
            eventPageIdsByTrainingId,
            sectionPageIds,
            handleTrigger: handleTrigger,
            updateHighlightedElement,
        });
    }, [eventSet, eventPageIdsByTrainingId, sectionPageIds, doTrigger, noPages]);

    useEffect(() => {
        if (!events.includes("section") || !sectionPageIds.length || noPages) return;
        else if (lastTriggeredPath === pathname) return;
        else {
            setLastTriggeredPath(pathname);
            doTrigger({ targetIds: sectionPageIds });
        }
    }, [pathname, sectionPageIds, doTrigger, events]);

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
    handleTrigger: (props: EventElement & { targetIds: string[] }) => void;
    updateHighlightedElement: (element: Optional<Element>) => void;
};
function setupEventListeners(props: SetupEventListenersProps) {
    const { root, eventSet, eventPageIdsByTrainingId, handleTrigger, sectionPageIds, updateHighlightedElement } = props;

    // capture: true - intercept events before component handlers
    // passive: true - don't block scrolling (we only observe, never preventDefault)
    const optsPassive: AddEventListenerOptions = { capture: true, passive: true };

    const getPageIdsForTrainingElement = (
        element: Element,
        eventType: EventListenerTypes
    ): Optional<{ pageIds: string[]; trigger?: EventListenerTypes }> => {
        const trainingId = element.getAttribute("data-training-id");
        if (!trainingId) return undefined;

        const pageIds = eventPageIdsByTrainingId[eventType]?.[trainingId];
        if (pageIds) return { pageIds, trigger: eventType };
        const pageIds2 = eventPageIdsByTrainingId["all"]?.[trainingId];
        if (pageIds2) return { pageIds: pageIds2, trigger: "all" };
        else return { pageIds: sectionPageIds };
    };

    const findAndHighlightElementPageIdsFromTarget = (
        target: EventTarget | null,
        eventType: EventListenerTypes
    ): Optional<EventElement & { targetIds: string[] }> => {
        if (!(target instanceof Element)) return undefined;

        const selector = `[data-training-id]`;

        const searchUpwards = (element: Element): Optional<EventElement & { targetIds: string[] }> => {
            const match = element.closest(selector);

            if (!match || !root.contains(match)) {
                updateHighlightedElement(undefined);
                return undefined;
            }

            const { pageIds: targetIds, trigger } = getPageIdsForTrainingElement(match, eventType) || {};
            if (targetIds?.length) {
                updateHighlightedElement(match);
                return { element: match, targetIds, trigger: trigger === "hover" ? undefined : trigger };
            } else {
                const parent = match.parentElement;
                if (!parent) return undefined;
                return searchUpwards(parent);
            }
        };

        return searchUpwards(target);
    };

    const handleClick = (e: Event) => {
        const { element, targetIds } = findAndHighlightElementPageIdsFromTarget(e.target, "click") ?? {};
        if (!targetIds?.length || !element) return;

        console.log("handleClick fired", e.target);
        handleTrigger({ targetIds, element: element, trigger: "click" });
    };

    const handleFocus = (e: Event) => {
        const { element, targetIds, trigger } = findAndHighlightElementPageIdsFromTarget(e.target, "focus") ?? {};
        if (!targetIds?.length || !element) return;
        console.log("handleFocus fired", e.target);
        handleTrigger({ targetIds, element: element, trigger: trigger });
    };

    const handleHover = (e: Event) => {
        findAndHighlightElementPageIdsFromTarget(e.target, "hover");
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

//foucs > click > all
function checkNextEventPriority(prevEvent: Optional<EventElement>, nextEvent: Optional<EventElement>) {
    console.log("checkNextEventPriority", { prevEvent, nextEvent, equal: prevEvent?.element !== nextEvent?.element });
    if (!prevEvent) return true;
    else if (!nextEvent) return false;
    else if (prevEvent.element !== nextEvent.element || !prevEvent.trigger) return true;
    else if (nextEvent.trigger === "focus") return true;
    else if (nextEvent.trigger === "click" && prevEvent.trigger === "all") return true;
    else return false;
}
