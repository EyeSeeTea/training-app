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
type TriggerPayload = EventElement & {
    targetIds: string[];
};

export function useBindEvents(props: UseBindingEventProps) {
    const {
        trigger: doTrigger,
        pages,
        events = ["click", "focus", "section"],
        highlightElementsWithBindings = false,
    } = props;
    const noPages = pages.length === 0;
    const shouldHandleSectionEvent = events.includes("section");

    const pathname = useCurrentPathname();
    const trainingScopeRef = useRef<HTMLDivElement>(null);
    const [highlightedElement, setHighlightedElement] = useState<Element>();
    const [currentEvent, setCurrentEvent] = useState<EventElement>();
    const [lastTriggeredPath, setLastTriggeredPath] = useState("");

    const domEventSet = useMemo<Set<EventType>>(
        () => new Set(events.filter(e => e !== "section") as EventType[]),
        [events]
    );

    const eventPageIdsByTrainingId = useMemo(
        () => getEventPageIdsByTrainingIdMap(pages, domEventSet),
        [pages, domEventSet]
    );

    const sectionPageIds = useMemo(() => getSectionPageIds(pathname, pages), [pathname, pages]);

    const updateHighlightedElement = useCallback(
        (element: Optional<Element>) => {
            if (highlightElementsWithBindings) {
                setHighlightedElement(element);
            }
        },
        [highlightElementsWithBindings]
    );

    const handleTrigger = useCallback(
        (payload: TriggerPayload) => {
            const { targetIds, ...nextEvent } = payload;

            if (shouldTriggerNextEvent(currentEvent, nextEvent)) {
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
            eventSet: domEventSet,
            eventPageIdsByTrainingId,
            sectionPageIds,
            handleTrigger,
            updateHighlightedElement,
            highlightElementsWithBindings,
        });
    }, [domEventSet, eventPageIdsByTrainingId, sectionPageIds, handleTrigger, updateHighlightedElement, noPages]);

    // Handle section-based navigation events
    useEffect(() => {
        if (!shouldHandleSectionEvent || !sectionPageIds.length || noPages) return;
        if (lastTriggeredPath === pathname) return;

        setLastTriggeredPath(pathname);
        doTrigger({ targetIds: sectionPageIds });
    }, [pathname, sectionPageIds, doTrigger, shouldHandleSectionEvent, lastTriggeredPath, noPages]);

    // Apply highlight styling
    useEffect(() => {
        if (!highlightElementsWithBindings || !highlightedElement || noPages) return;

        highlightedElement.classList.add("training-highlight");
        return () => highlightedElement.classList.remove("training-highlight");
    }, [highlightedElement, highlightElementsWithBindings, noPages]);

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
            setUrl(window.location.pathname + window.location.hash);
        };

        return observerRef.current.subscribe(handleChange);
    }, []);

    return url;
}

type EventListenerType = EventType | "hover";

type SetupEventListenersProps = {
    root: HTMLDivElement;
    eventSet: Set<EventType>;
    eventPageIdsByTrainingId: EventPageIdsByTrainingId;
    sectionPageIds: string[];
    handleTrigger: (payload: TriggerPayload) => void;
    updateHighlightedElement: (element: Optional<Element>) => void;
    highlightElementsWithBindings: boolean;
};

function setupEventListeners(props: SetupEventListenersProps) {
    const {
        root,
        eventSet,
        eventPageIdsByTrainingId,
        sectionPageIds,
        handleTrigger,
        updateHighlightedElement,
        highlightElementsWithBindings,
    } = props;

    const eventOptions: AddEventListenerOptions = {
        capture: true, // Intercept events before component handlers
        passive: true, // Don't block scrolling (we only observe, never preventDefault)
    };

    const getPageIdsForElement = (
        element: Element,
        eventType: EventListenerType
    ): Optional<{ pageIds: string[]; trigger?: EventListenerType }> => {
        const trainingId = element.getAttribute("data-training-id");
        if (!trainingId) return undefined;

        const pageIds = eventPageIdsByTrainingId[eventType]?.[trainingId];
        if (pageIds) return { pageIds, trigger: eventType };

        const allPageIds = eventPageIdsByTrainingId["all"]?.[trainingId];
        if (allPageIds) return { pageIds: allPageIds, trigger: "all" };

        return { pageIds: sectionPageIds };
    };

    const findTrainingElement = (
        target: EventTarget | null,
        eventType: EventListenerType
    ): Optional<TriggerPayload> => {
        if (!(target instanceof Element)) return undefined;

        const searchUpwards = (element: Element): Optional<TriggerPayload> => {
            const match = element.closest("[data-training-id]");

            if (!match || !root.contains(match)) {
                updateHighlightedElement(undefined);
                return undefined;
            }

            const result = getPageIdsForElement(match, eventType);
            if (result?.pageIds?.length) {
                updateHighlightedElement(match);
                return {
                    element: match,
                    targetIds: result.pageIds,
                    trigger: result.trigger === "hover" ? undefined : result.trigger,
                };
            }

            const parent = match.parentElement;
            return parent ? searchUpwards(parent) : undefined;
        };

        return searchUpwards(target);
    };

    const handleClick = (e: Event) => {
        const payload = findTrainingElement(e.target, "click");
        if (!payload) return;

        console.log("Click event triggered", e.target);
        handleTrigger(payload);
    };

    const handleFocus = (e: Event) => {
        const payload = findTrainingElement(e.target, "focus");
        if (!payload) return;

        console.log("Focus event triggered", e.target);
        handleTrigger(payload);
    };

    const handleHover = (e: Event) => {
        findTrainingElement(e.target, "hover");
    };

    console.log("Registering event listeners on root:", root);
    console.log("Event types:", Array.from(eventSet));

    // Register event listeners
    if (eventSet.has("click")) {
        console.log("Registering click listener");
        root.addEventListener("click", handleClick, eventOptions);
    }
    if (eventSet.has("focus")) {
        console.log("Registering focus listener");
        root.addEventListener("focusin", handleFocus, eventOptions);
    }
    if (highlightElementsWithBindings) {
        root.addEventListener("mouseover", handleHover, eventOptions);
        root.addEventListener("mouseover", handleHover, eventOptions);
    }

    // Cleanup function
    return () => {
        if (eventSet.has("click")) root.removeEventListener("click", handleClick, eventOptions);
        if (eventSet.has("focus")) root.removeEventListener("focusin", handleFocus, eventOptions);
        if (highlightElementsWithBindings) root.removeEventListener("mouseover", handleHover, eventOptions);
    };
}

//Priority order: focus > click > all
function shouldTriggerNextEvent(prevEvent: Optional<EventElement>, nextEvent: Optional<EventElement>): boolean {
    if (!prevEvent) return true;
    if (!nextEvent) return false;

    // Different elements or no previous trigger -> allow
    if (prevEvent.element !== nextEvent.element || !prevEvent.trigger) return true;

    // Focus events have highest priority
    if (nextEvent.trigger === "focus") return true;

    // Click events override 'all' events
    if (nextEvent.trigger === "click" && prevEvent.trigger === "all") return true;

    return false;
}
