import { Codec, Schema } from "../../utils/codec";
import { generateUid } from "../../data/utils/uid";
import { Optional } from "../../types/utils";

const EVENT_TYPES = ["click", "hover", "all"] as const;
const BINDING_TYPES = ["event", "section", "iframe"] as const;

export type EventType = typeof EVENT_TYPES[number];
export type BindingType = typeof BINDING_TYPES[number];

export const EventTypeModel = Schema.oneOf([Schema.exact("click"), Schema.exact("hover"), Schema.exact("all")]);

type BaseBinding = {
    id: string;
    description: Optional<string>;
};

export type EventBinding = BaseBinding & {
    type: "event";
    pageIdentifiers: string;
    eventType: EventType;
};

export type SectionBinding = BaseBinding & {
    type: "section";
    urlPattern: string;
};

export type IframeBinding = BaseBinding & {
    type: "iframe";
    urlPattern: string;
    eventType: EventType;
};

export type PageBinding = EventBinding | SectionBinding | IframeBinding;

const baseEventBinding = {
    id: Schema.nonEmptyString,
    description: Schema.optional(Schema.string),
};

export const EventBindingModel: Codec<EventBinding> = Schema.object({
    ...baseEventBinding,
    type: Schema.exact("event"),
    pageIdentifiers: Schema.string,
    eventType: EventTypeModel,
});

export const SectionBindingModel: Codec<SectionBinding> = Schema.object({
    ...baseEventBinding,
    type: Schema.exact("section"),
    urlPattern: Schema.nonEmptyString,
});

export const IframeBindingModel: Codec<IframeBinding> = Schema.object({
    ...baseEventBinding,
    type: Schema.exact("iframe"),
    urlPattern: Schema.nonEmptyString,
    eventType: EventTypeModel,
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
    pageIdentifiers: "",
    eventType: "click",
});

const defaultSectionBinding = (): SectionBinding => ({
    id: generateUid(),
    description: undefined,
    type: "section",
    urlPattern: "*/*",
});

const defaultIFrameBinding = (): IframeBinding => ({
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

export function isEventType(value: string): value is EventType {
    return EVENT_TYPES.includes(value as EventType);
}

export function isBindingType(value: string): value is BindingType {
    return BINDING_TYPES.includes(value as BindingType);
}

export function urlPatternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    const regexPattern = escaped.replace(/\*/g, "[^/]*");
    return new RegExp(regexPattern + "(?:[?#]|$)");
}

export function matchesUrlPattern(currentUrl: string, pattern: string): boolean {
    const regex = urlPatternToRegex(pattern);
    try {
        const pathname = new URL(currentUrl, window.location.origin).pathname;
        return regex.test(pathname);
    } catch {
        return regex.test(currentUrl);
    }
}
