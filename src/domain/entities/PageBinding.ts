import { Codec, Schema } from "../../utils/codec";
import { generateUid } from "../../data/utils/uid";
import { Optional } from "../../types/utils";

const IFRAME_EVENT_TYPES = ["click", "hover", "all"] as const;
const EVENT_TYPES = ["focus", ...IFRAME_EVENT_TYPES] as const;
const BINDING_TYPES = ["event", "section", "iframe"] as const;

export type EventType = typeof EVENT_TYPES[number];
export type IFrameEventType = typeof IFRAME_EVENT_TYPES[number];
export type BindingType = typeof BINDING_TYPES[number];

export const IFrameEventTypeModel: Codec<IFrameEventType> = Schema.oneOf([
    Schema.exact("click"),
    Schema.exact("hover"),
    Schema.exact("all"),
]);

export const EventTypeModel: Codec<EventType> = Schema.oneOf([
    Schema.exact("focus"),
    Schema.exact("click"),
    Schema.exact("hover"),
    Schema.exact("all"),
]);

type BaseBinding = {
    id: string;
    description: Optional<string>;
};

export type EventBinding = BaseBinding & {
    type: "event";
    trainingIdentifiers: string;
    eventType: EventType;
};

export type SectionBinding = BaseBinding & {
    type: "section";
    urlPattern: string;
};

export type IFrameBinding = BaseBinding & {
    type: "iframe";
    urlPattern: string;
    eventType: IFrameEventType;
};

export type PageBinding = EventBinding | SectionBinding | IFrameBinding;

const baseEventBinding = {
    id: Schema.nonEmptyString,
    description: Schema.optional(Schema.string),
};

export const EventBindingModel: Codec<EventBinding> = Schema.object({
    ...baseEventBinding,
    type: Schema.exact("event"),
    trainingIdentifiers: Schema.string,
    eventType: EventTypeModel,
});

export const SectionBindingModel: Codec<SectionBinding> = Schema.object({
    ...baseEventBinding,
    type: Schema.exact("section"),
    urlPattern: Schema.nonEmptyString,
});

export const IframeBindingModel: Codec<IFrameBinding> = Schema.object({
    ...baseEventBinding,
    type: Schema.exact("iframe"),
    urlPattern: Schema.nonEmptyString,
    eventType: IFrameEventTypeModel,
});

export const PageBindingModel: Codec<PageBinding> = Schema.oneOf([
    EventBindingModel,
    SectionBindingModel,
    IframeBindingModel,
]);

const defaultEventBinding = (): EventBinding => ({
    id: generateUid(),
    description: undefined,
    type: "event",
    trainingIdentifiers: "",
    eventType: "click",
});

const defaultSectionBinding = (): SectionBinding => ({
    id: generateUid(),
    description: undefined,
    type: "section",
    urlPattern: "*/*",
});

const defaultIFrameBinding = (): IFrameBinding => ({
    id: generateUid(),
    description: undefined,
    type: "iframe",
    urlPattern: "*/*",
    eventType: "click",
});

export function getDefaultBinding(type: BindingType): PageBinding {
    switch (type) {
        case "section":
            return defaultSectionBinding();
        case "iframe":
            return defaultIFrameBinding();
        case "event":
        default:
            return defaultEventBinding();
    }
}

export function urlPatternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    const regexPattern = escaped
        .replace(/\*\*/g, "<!GLOBSTAR!>")
        .replace(/\*/g, "[^/]*")
        .replace(/<!GLOBSTAR!>/g, ".*");

    return new RegExp("^(?:/#)?" + regexPattern + "$");
}

export function matchesUrlPattern(currentPath: string, pattern: string): boolean {
    const normalizedPath = currentPath.replace(/^\/#/, "").split("?")[0];
    if (!normalizedPath) return false;

    const regex = urlPatternToRegex(pattern);
    return regex.test(normalizedPath);
}

export function isEventBinding(binding: PageBinding): binding is EventBinding {
    return binding.type === "event";
}
export function isSectionBinding(binding: PageBinding): binding is SectionBinding {
    return binding.type === "section";
}

export function getEventBindingIdentifiers(binding: EventBinding): string[] {
    if (!binding.trainingIdentifiers) return [];
    return binding.trainingIdentifiers
        .split(",")
        .map(id => id.trim())
        .filter(id => id.length > 0 && id !== "undefined" && id !== "null");
}
