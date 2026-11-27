import _ from "lodash";
import { UseCase } from "../../webapp/CompositionRoot";
import {
    defaultMaxUploadSize,
    DocumentFile,
    exceedsSize,
    getDocumentDescription,
    hasSameContent,
} from "../entities/DocumentFile";
import { NamedRef } from "../entities/Ref";
import { getReferencedDocumentIds, TrainingAppConfig, TrainingAppConfigEntry } from "../entities/TrainingAppConfig";
import { DocumentFileRepository } from "../repositories/DocumentFileRepository";
import { InstanceRepository } from "../repositories/InstanceRepository";
import { TrainingAppConfigRepository } from "../repositories/TrainingAppConfigRepository";

/**
 * Copy the training-app configuration to another instance: the namespace entries and every
 * document referenced from them. Documents keep their IDs, so the references keep working.
 *
 * Documents are copied before the entries, so the target configuration never references a
 * document that does not exist there yet.
 */
export class CopyTrainingAppConfigUseCase implements UseCase {
    constructor(private source: CopyRepositories, private target: CopyRepositories) {}

    public async execute(options: CopyOptions): Promise<CopyReport> {
        const items: CopyReportItem[] = [];
        const addItem = (item: CopyReportItem) => {
            items.push(item);
            options.onProgress?.(item);
        };

        const sourceConfig = await this.source.config.get();
        if (_.isEmpty(sourceConfig.entries)) throw new Error("The training-app configuration is empty on source");
        const targetConfig = await this.target.config.get();

        const documentIds = getReferencedDocumentIds(sourceConfig);
        const sourceDocuments = _.keyBy(await this.source.documents.getByIds(documentIds), doc => doc.id);
        const targetDocuments = _.keyBy(await this.target.documents.getByIds(documentIds), doc => doc.id);

        await runWithConcurrency(documentIds, documentsConcurrency, async id => {
            addItem(await this.copyDocument(id, sourceDocuments[id], targetDocuments[id], options));
        });

        for (const entry of sourceConfig.entries) {
            addItem(await this.copyEntry(entry, targetConfig, options));
        }

        const permissionItems = await this.checkSettingsPermissions(sourceConfig);
        permissionItems.forEach(addItem);

        return { items };
    }

    private async copyDocument(
        id: string,
        sourceDocument: DocumentFile | undefined,
        targetDocument: DocumentFile | undefined,
        options: CopyOptions
    ): Promise<CopyReportItem> {
        if (!sourceDocument) {
            return {
                type: "document",
                id,
                action: "dangling-reference",
                message: "referenced but not found on source",
            };
        }

        const message = getDocumentDescription(sourceDocument);
        if (targetDocument && !options.updateDocuments) {
            return { type: "document", id, action: "skip-existing", message };
        } else if (targetDocument && hasSameContent(sourceDocument, targetDocument)) {
            return { type: "document", id, action: "skip-same-content", message };
        }

        const action = targetDocument ? "update" : "create";
        const warning = exceedsSize(sourceDocument, defaultMaxUploadSize) ? maxUploadSizeWarning : undefined;
        if (!options.post) return { type: "document", id, action, message, warning };

        try {
            const { content } = sourceDocument;
            const file = content.type === "file" ? await this.source.documents.getFile(id) : undefined;
            await this.target.documents.save(sourceDocument, file);

            // The target computes the checksum of the uploaded file: this checks download and upload
            const [savedDocument] = await this.target.documents.getByIds([id]);
            if (!savedDocument || !hasSameContent(sourceDocument, savedDocument)) {
                throw new Error("content on target differs from source after saving");
            }
            return { type: "document", id, action, message };
        } catch (err) {
            return { type: "document", id, action: "error", message: `${action} failed: ${getMessage(err)}`, warning };
        }
    }

    private async copyEntry(
        entry: TrainingAppConfigEntry,
        targetConfig: TrainingAppConfig,
        options: CopyOptions
    ): Promise<CopyReportItem> {
        const existsOnTarget = targetConfig.entries.some(targetEntry => targetEntry.key === entry.key);
        const action = existsOnTarget ? "update" : "create";
        const message = `${JSON.stringify(entry.value).length} bytes`;
        if (!options.post) return { type: "entry", id: entry.key, action, message };

        try {
            await this.target.config.saveEntry(entry);
            const savedConfig = await this.target.config.get();
            const savedEntry = savedConfig.entries.find(savedEntry => savedEntry.key === entry.key);
            if (!_.isEqual(savedEntry?.value, entry.value)) throw new Error("content on target differs after saving");
            return { type: "entry", id: entry.key, action, message };
        } catch (err) {
            return { type: "entry", id: entry.key, action: "error", message: `${action} failed: ${getMessage(err)}` };
        }
    }

    /**
     * The settings permissions reference users and user groups by ID, which are instance-specific.
     * Check both sides: the source can contain users or groups that were deleted there too.
     */
    private async checkSettingsPermissions(config: TrainingAppConfig): Promise<CopyReportItem[]> {
        const permissions = config.settingsPermissions;
        if (!permissions) return [];

        const ids = { userIds: getIds(permissions.users), userGroupIds: getIds(permissions.userGroups) };
        const [onSource, onTarget] = await Promise.all([
            this.source.instance.getUsersAndGroups(ids),
            this.target.instance.getUsersAndGroups(ids),
        ]);

        const getMissing = (
            type: "user" | "userGroup",
            refs: NamedRef[],
            sourceRefs: NamedRef[],
            targetRefs: NamedRef[]
        ) =>
            _.differenceBy(refs, targetRefs, ref => ref.id).map(
                (ref): CopyReportItem => ({
                    type,
                    id: ref.id,
                    action: getIds(sourceRefs).includes(ref.id) ? "missing-on-target" : "missing-on-both",
                    message: `settingsPermissions: ${ref.name}`,
                })
            );

        return [
            ...getMissing("user", permissions.users, onSource.users, onTarget.users),
            ...getMissing("userGroup", permissions.userGroups, onSource.userGroups, onTarget.userGroups),
        ];
    }
}

export interface CopyRepositories {
    config: TrainingAppConfigRepository;
    documents: DocumentFileRepository;
    instance: InstanceRepository;
}

export interface CopyOptions {
    /** Write to the target. Otherwise, dry run: the report says what would be done */
    post: boolean;
    /** Replace the file of documents already on the target when the content differs */
    updateDocuments: boolean;
    onProgress?: (item: CopyReportItem) => void;
}

export interface CopyReport {
    items: CopyReportItem[];
}

export interface CopyReportItem {
    type: "document" | "entry" | "user" | "userGroup";
    id: string;
    action: CopyAction;
    message: string;
    warning?: string;
}

export type CopyAction =
    | "create"
    | "update"
    | "skip-existing"
    | "skip-same-content"
    | "dangling-reference"
    | "missing-on-target"
    | "missing-on-both"
    | "error";

const documentsConcurrency = 5;

const maxUploadSizeWarning =
    "bigger than the default upload limit of DHIS2 2.42 (10 MB), set max.file_upload_size in the target dhis.conf";

function getIds(refs: NamedRef[]): string[] {
    return refs.map(ref => ref.id);
}

function getMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

async function runWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
    const queue = [...items];
    const worker = async () => {
        for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
    };
    await Promise.all(_.times(concurrency, worker));
}
