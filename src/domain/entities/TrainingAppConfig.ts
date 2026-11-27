import _ from "lodash";
import { getUrls } from "../../utils/urls";
import { Permission } from "./Permission";

/** The whole training-app configuration of an instance (the entries of its global namespace) */
export interface TrainingAppConfig {
    entries: TrainingAppConfigEntry[];
    settingsPermissions: Permission | undefined;
}

export interface TrainingAppConfigEntry {
    key: string;
    value: object;
}

// Uploaded files are referenced as `../../documents/<UID>/data` (see Dhis2DocumentRepository)
const documentUrlRegex = /documents\/([A-Za-z][A-Za-z0-9]{10})\/data/;

export function getReferencedDocumentIds(config: TrainingAppConfig): string[] {
    const urls = getUrls(config.entries.map(entry => entry.value));

    return _(urls)
        .map(url => url.match(documentUrlRegex)?.[1])
        .compact()
        .uniq()
        .sortBy()
        .value();
}
