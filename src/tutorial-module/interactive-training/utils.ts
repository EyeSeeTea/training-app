import _ from "lodash";

import { TrainingModulePage } from "../../domain/entities/TrainingModule";
import {
    EventType,
    getEventBindingIdentifiers,
    isEventBinding,
    isSectionBinding,
    matchesUrlPattern,
} from "../../domain/entities/PageBinding";

export type EventPageIdsByTrainingId = Record<string, Record<string, string[]>>;

export function getEventPageIdsByTrainingIdMap(
    pages: TrainingModulePage[],
    validEventSet: Set<EventType>
): EventPageIdsByTrainingId {
    return _(pages)
        .flatMap(({ bindings = [], id }) => bindings.filter(isEventBinding).map(binding => ({ binding, pageId: id })))
        .filter(({ binding }) => binding.eventType === "all" || validEventSet.has(binding.eventType))
        .flatMap(({ binding, pageId }) =>
            getEventBindingIdentifiers(binding).map(pageIdentifier => ({
                pageIdentifier,
                pageId,
                eventType: binding.eventType,
            }))
        )
        .groupBy(({ eventType }) => eventType)
        .mapValues(items =>
            _(items)
                .groupBy(({ pageIdentifier }) => pageIdentifier)
                .mapValues(peArr => peArr.map(pe => pe.pageId))
                .value()
        )
        .value();
}

export function getSectionPageIds(currentUrl: string, pages: TrainingModulePage[]): string[] {
    return _(pages)
        .flatMap(({ bindings = [], id }) =>
            bindings.filter(isSectionBinding).map(binding => ({ ...binding, pageId: id }))
        )
        .filter(({ urlPattern }) => matchesUrlPattern(currentUrl, urlPattern))
        .map(({ pageId }) => pageId)
        .value();
}

// export function transformRelativeLinks()

export function generateSettingsUrl(baseUrl: string, appKey: string) {
    return `${generateTrainingAppBaseUrl(baseUrl, appKey)}/index.html#/settings`;
}

export function generateTrainingAppBaseUrl(baseUrl: string, appKey: string) {
    return `${baseUrl}/api/apps/${appKey}`;
}

export function transformD2DocumentUrls(content: string, apiBaseUrl: string): string {
    console.log("Transforming document URLs with base:", apiBaseUrl);
    return content.replace(/\.\.\/..\/(documents\/[^)\s"']+)/g, `${apiBaseUrl}/$1`);
}

export function updateIconDocumentUrls<T extends { icon: string; children?: T[] }>(
    entities: T[],
    apiBaseUrl: string
): T[] {
    return entities.map(entity => ({
        ...entity,
        icon: transformD2DocumentUrls(entity.icon, apiBaseUrl),
        children: entity.children ? updateIconDocumentUrls(entity.children, apiBaseUrl) : undefined,
    }));
}
