import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EVENT_TYPE, EventType } from "../../domain/entities/PageBinding";
import { Maybe } from "../../types/utils";
import { InteractiveTrainingContextState } from "./InteractiveTrainingProvider";
import { EventPageIdsByTrainingId, getEventPageIdsByTrainingIdMap, getSectionPageIds } from "./utils";
import { useCurrentLocation } from "./useCurrentLocation";

type EventElement = { element?: Element; trigger?: EventType };
type TriggerPayload = EventElement & {
    targetIds: string[];
};

export function useBindEvents(props: InteractiveTrainingContextState) {
    const { trigger: doTrigger, pages, events = ["click", "focus", "section"] } = props;
    const noPages = pages.length === 0;
    const shouldHandleSectionEvent = events.includes("section");

    const trainingScopeRef = useRef<HTMLDivElement>(null);
    const [lastTriggeredPath, setLastTriggeredPath] = useState("");
    const location = useCurrentLocation();
    const sectionPageIds = useMemo(() => getSectionPageIds(location, pages), [location, pages]);

    // use ref to avoid reregistering event listeners
    const currentEventRef = useRef<EventElement>();
    const domEventSet = new Set(events.filter(e => e !== "section") as EventType[]);
    const eventPageIdsByTrainingId = getEventPageIdsByTrainingIdMap(pages, domEventSet);

    const handleTrigger = useCallback(
        (payload: TriggerPayload) => {
            const { targetIds, ...nextEvent } = payload;
            if (shouldTriggerNextEvent(currentEventRef.current, nextEvent)) {
                doTrigger({ targetIds });
                currentEventRef.current = nextEvent;
            }
        },
        [doTrigger]
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
        });
    }, [sectionPageIds, handleTrigger, noPages]);

    // Handle section-based navigation events
    useEffect(() => {
        if (!shouldHandleSectionEvent || noPages) return;
        if (lastTriggeredPath === location) return;

        setLastTriggeredPath(location);
        doTrigger({ targetIds: sectionPageIds });
    }, [location, sectionPageIds, doTrigger, lastTriggeredPath]);

    return { trainingScopeRef };
}

type EventListenerType = EventType | "hover";
type SetupEventListenersProps = {
    root: HTMLDivElement;
    eventSet: Set<EventType>;
    eventPageIdsByTrainingId: EventPageIdsByTrainingId;
    sectionPageIds: string[];
    handleTrigger: (payload: TriggerPayload) => void;
};
function setupEventListeners(props: SetupEventListenersProps) {
    const { root, eventSet, eventPageIdsByTrainingId, sectionPageIds, handleTrigger } = props;

    const eventOptions: AddEventListenerOptions = {
        capture: true, // Intercept events before component handlers
        passive: true, // Don't block scrolling (we only observe, never preventDefault)
    };

    const getPageIdsForElement = (
        element: Element,
        eventType: EventListenerType
    ): Maybe<{ pageIds: string[]; trigger?: EventListenerType }> => {
        const trainingId = element.getAttribute("data-training-id");
        if (!trainingId) return undefined;

        const pageIds = eventPageIdsByTrainingId[eventType]?.[trainingId];
        if (pageIds) return { pageIds, trigger: eventType };

        const allPageIds = eventPageIdsByTrainingId["all"]?.[trainingId];
        if (allPageIds) return { pageIds: allPageIds, trigger: "all" };

        return { pageIds: sectionPageIds };
    };

    const findTrainingElement = (target: EventTarget | null, eventType: EventListenerType): Maybe<TriggerPayload> => {
        if (!(target instanceof Element)) return undefined;
        const defaultResult = { element: target, targetIds: [] };

        const searchUpwards = (element: Element): Maybe<TriggerPayload> => {
            const match = element.closest("[data-training-id]");

            if (!match || !root.contains(match)) {
                return defaultResult;
            }

            const result = getPageIdsForElement(match, eventType);
            if (result?.pageIds?.length) {
                return {
                    targetIds: result.pageIds,
                    trigger: result.trigger === "hover" ? undefined : result.trigger,
                    element: target,
                };
            }

            const parent = match.parentElement;
            return parent ? searchUpwards(parent) : defaultResult;
        };

        return searchUpwards(target);
    };

    const handleEvent = (eventType: EventType) => (e: Event) => {
        const payload = findTrainingElement(e.target, eventType);
        if (!payload) return handleTrigger({ targetIds: [] });
        handleTrigger(payload);
    };

    console.debug("Registering event listeners on root:", root);
    console.debug("Event types:", Array.from(eventSet));
    const clickHandler = handleEvent(EVENT_TYPE.click);
    const focusHandler = handleEvent(EVENT_TYPE.focus);

    if (eventSet.has(EVENT_TYPE.click)) {
        root.addEventListener("click", clickHandler, eventOptions);
    }
    if (eventSet.has(EVENT_TYPE.focus)) {
        root.addEventListener("focusin", focusHandler, eventOptions);
    }
    return () => {
        if (eventSet.has("click")) root.removeEventListener("click", clickHandler, eventOptions);
        if (eventSet.has("focus")) root.removeEventListener("focusin", focusHandler, eventOptions);
    };
}

//Priority order: focus > click > all
function shouldTriggerNextEvent(prevEvent: Maybe<EventElement>, nextEvent: Maybe<EventElement>): boolean {
    if (!prevEvent || !nextEvent) return true;

    const isDifferentElement = prevEvent.element !== nextEvent.element;
    const isFirstTrigger = !prevEvent.trigger;
    const isFocusEvent = nextEvent.trigger === "focus";
    const isClickOverridingAll = nextEvent.trigger === "click" && prevEvent.trigger === "all";

    return isDifferentElement || isFirstTrigger || isFocusEvent || isClickOverridingAll;
}
