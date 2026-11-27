import crypto from "crypto";
import _ from "lodash";
import { dataStoreNamespace } from "../data/clients/storage/Namespaces";
import { PersistedConfig } from "../data/entities/PersistedConfig";
import { DhisInstance } from "./common/DhisInstance";

/**
 * Copy the training-app configuration between DHIS2 instances: the keys of the global dataStore
 * namespace and every document (metadata + binary) referenced from them.
 *
 * Document UIDs are preserved, so the `../../documents/<UID>/data` references in the dataStore
 * keep working unchanged. The fileResource UID is not preserved (the server always generates it);
 * the new one is set as the document `url`. Nothing references a fileResource directly.
 *
 * Documents are copied before the dataStore keys, so the namespace never references a document
 * that does not exist yet on the target.
 */
export class TrainingAppCopier {
    private failures = 0;

    constructor(private source: DhisInstance, private target: DhisInstance, private options: CopyOptions) {}

    public async execute(): Promise<CopyResult> {
        const { post } = this.options;
        log(`source: ${this.source.url}`);
        log(`target: ${this.target.url}`);
        if (!post) log("mode:   DRY RUN (pass --post to write)");

        log("\n== dataStore keys on source");
        const keys = await this.getSourceKeys();

        log("\n== documents referenced by those keys");
        const documentIds = getReferencedDocumentIds(keys);
        log(`    ${documentIds.length} distinct document UIDs referenced`);
        const sourceDocuments = await getDocuments(this.source, documentIds);
        const targetDocuments = await getDocuments(this.target, documentIds);
        log(`    ${_.size(sourceDocuments)} found on source, ${_.size(targetDocuments)} already on target`);
        await runWithConcurrency(documentIds, documentsConcurrency, documentId =>
            this.run(documentId, () =>
                this.copyDocument(documentId, sourceDocuments[documentId], targetDocuments[documentId])
            )
        );

        log("\n== dataStore keys on target");
        const targetKeys = await this.target.api.dataStore(dataStoreNamespace).getKeys().getData();
        for (const { key, value } of keys) {
            await this.run(key, () => this.copyKey(key, value, targetKeys.includes(key)));
        }

        log("\n== checks");
        await this.checkSettingsPermissions(keys);

        return { failures: this.failures };
    }

    private async run(id: string, fn: () => Promise<void>): Promise<void> {
        try {
            await fn();
        } catch (err: any) {
            this.failures++;
            const details = err?.response?.data ? JSON.stringify(err.response.data) : err?.message ?? String(err);
            console.error(`    ${id} ERROR: ${details}`);
        }
    }

    private async getSourceKeys(): Promise<DataStoreEntry[]> {
        const dataStore = this.source.api.dataStore(dataStoreNamespace);
        const keys = await dataStore.getKeys().getData();
        if (_.isEmpty(keys)) throw new Error(`Namespace '${dataStoreNamespace}' is empty or missing on source`);

        const entries: DataStoreEntry[] = [];
        for (const key of keys) {
            const value = await dataStore.get<object>(key).getData();
            if (value === undefined) throw new Error(`Key '${key}' disappeared from source while reading`);
            entries.push({ key, value });
            log(`    ${key} (${JSON.stringify(value).length} bytes)`);
        }
        return entries;
    }

    private async copyDocument(id: string, sourceDoc: Document | undefined, targetDoc: Document | undefined) {
        const { post, updateDocuments } = this.options;

        if (!sourceDoc) {
            log(`    ${id} WARNING: referenced but not found on source (dangling reference, not copied)`);
            return;
        } else if (sourceDoc.external) {
            if (targetDoc) {
                log(`    ${id} SKIP: external document already on target (${sourceDoc.name})`);
            } else if (!post) {
                log(`    ${id} would copy: ${sourceDoc.name} (external: ${sourceDoc.url})`);
            } else {
                await this.saveDocument(sourceDoc, { url: sourceDoc.url });
                log(`    ${id} copied: ${sourceDoc.name} (external)`);
            }
            return;
        }

        const sourceFile = await getFileResource(this.source, sourceDoc.url);
        const fileInfo = `${sourceDoc.name} (${sourceFile.contentType}, ${sourceFile.contentLength} bytes)`;

        if (targetDoc) {
            if (!updateDocuments) {
                log(`    ${id} SKIP: already on target (${sourceDoc.name})`);
                return;
            }
            const targetFile = targetDoc.external ? undefined : await getFileResource(this.target, targetDoc.url);
            if (targetFile?.contentMd5 === sourceFile.contentMd5) {
                log(`    ${id} SKIP: already on target with the same content (${sourceDoc.name})`);
                return;
            }
        }

        const action = targetDoc ? "update" : "copy";
        if (!post) {
            const sizeWarning =
                sourceFile.contentLength > defaultMaxUploadSize
                    ? ` -- WARNING: bigger than the default upload limit (10 MB), ${maxUploadSizeHelp}`
                    : "";
            log(`    ${id} would ${action}: ${fileInfo}${sizeWarning}`);
            return;
        }

        const data = await this.source.download(`/documents/${id}/data`);
        checkMd5(data, sourceFile.contentMd5, "download");

        const fileResourceId = await this.target
            .uploadFileResource({
                data,
                filename: sourceDoc.name,
                contentType: sourceFile.contentType,
                domain: "DOCUMENT",
            })
            .catch(err => {
                const isTooBig = String(err?.response?.data?.message).includes("File size can't be bigger");
                throw isTooBig ? new Error(`${err.response.data.message}: ${maxUploadSizeHelp}`) : err;
            });
        // Save the document promptly: unreferenced fileResources are purged by a scheduled job
        await this.saveDocument(sourceDoc, { url: fileResourceId, existing: targetDoc });

        const copied = await this.target.download(`/documents/${id}/data`);
        checkMd5(copied, sourceFile.contentMd5, "target");
        log(`    ${id} ${action === "copy" ? "copied" : "updated"} + verified: ${fileInfo}`);
    }

    private async saveDocument(sourceDoc: Document, options: { url: string; existing?: Document }): Promise<void> {
        const { url, existing } = options;
        // users/userGroups sharing is instance-specific: on create, copy only the public access;
        // on update, keep whatever sharing the target document already has.
        const document = existing
            ? { ...existing, url, external: sourceDoc.external }
            : {
                  id: sourceDoc.id,
                  name: sourceDoc.name,
                  url,
                  external: sourceDoc.external,
                  attachment: sourceDoc.attachment,
                  sharing: { public: sourceDoc.sharing?.public ?? "rw------", users: {}, userGroups: {} },
              };

        const response = await this.target.api.metadata.post({ documents: [document] }).getData();
        if (response.status !== "OK") {
            throw new Error(`document save failed: ${JSON.stringify(response)}`);
        }
    }

    private async copyKey(key: string, value: object, existsOnTarget: boolean): Promise<void> {
        const dataStore = this.target.api.dataStore(dataStoreNamespace);
        const [verb, past] = existsOnTarget ? ["overwrite", "overwritten"] : ["create", "created"];

        if (!this.options.post) {
            log(`    ${key} would ${verb} (${JSON.stringify(value).length} bytes)`);
            return;
        }

        await dataStore.save(key, value).getData();
        const saved = await dataStore.get<object>(key).getData();
        if (!_.isEqual(saved, value)) throw new Error(`target content differs after ${verb}`);
        log(`    ${key} ${past} + verified`);
    }

    /**
     * config.settingsPermissions references users and groups by UID, which are instance-specific.
     * Check both sides: the source config can contain principals that were since deleted there too.
     */
    private async checkSettingsPermissions(keys: DataStoreEntry[]): Promise<void> {
        const config = keys.find(entry => entry.key === "config")?.value as PersistedConfig | undefined;
        const permissions = config?.settingsPermissions;
        if (!permissions) return;

        for (const kind of ["users", "userGroups"] as const) {
            for (const { id, name } of permissions[kind] ?? []) {
                const onSource = await existsObject(this.source, kind, id);
                const onTarget = await existsObject(this.target, kind, id);
                if (!onSource && !onTarget) {
                    log(`    WARNING: settingsPermissions.${kind} ${id} (${name}) exists on neither side, stale`);
                } else if (!onTarget) {
                    log(`    WARNING: settingsPermissions.${kind} ${id} (${name}) not found on target`);
                }
            }
        }
    }
}

export interface CopyOptions {
    post: boolean;
    updateDocuments: boolean;
}

export interface CopyResult {
    failures: number;
}

interface DataStoreEntry {
    key: string;
    value: object;
}

interface Document {
    id: string;
    name: string;
    url: string;
    external: boolean;
    attachment: boolean;
    sharing?: { public?: string };
}

interface FileResource {
    contentType: string;
    contentLength: number;
    contentMd5: string;
}

// DHIS2 2.42 rejects file uploads bigger than the dhis.conf key max.file_upload_size (default 10 MB).
// The target's value cannot be read through the API, so the dry run can only warn against the default.
const defaultMaxUploadSize = 10_000_000;
const maxUploadSizeHelp = "set max.file_upload_size in the target dhis.conf";

// Documents are processed in parallel (lookups + transfers); output lines are per document
const documentsConcurrency = 5;

const documentReferenceRegex = /documents\/([A-Za-z][A-Za-z0-9]{10})\/data/g;

function getReferencedDocumentIds(keys: DataStoreEntry[]): string[] {
    const json = JSON.stringify(keys.map(entry => entry.value));
    const ids = Array.from(json.matchAll(documentReferenceRegex), match => match[1]);
    return _(ids).compact().uniq().sortBy().value();
}

/** Get documents (all owner fields) by ID, in chunks to keep the URL length bounded */
async function getDocuments(instance: DhisInstance, ids: string[]): Promise<Record<string, Document>> {
    const documents: Document[] = [];
    for (const idsGroup of _.chunk(ids, 100)) {
        const { documents: group } = await instance.api
            .get<{ documents: Document[] }>("/documents", {
                paging: false,
                fields: ":owner",
                filter: `id:in:[${idsGroup.join(",")}]`,
            })
            .getData();
        documents.push(...group);
    }
    return _.keyBy(documents, document => document.id);
}

async function getFileResource(instance: DhisInstance, id: string): Promise<FileResource> {
    return instance.api
        .get<FileResource>(`/fileResources/${id}`, { fields: "contentType,contentLength,contentMd5" })
        .getData();
}

async function existsObject(instance: DhisInstance, kind: "users" | "userGroups", id: string): Promise<boolean> {
    const response = await instance.api
        .get<Record<string, Array<{ id: string }>>>(`/${kind}`, { fields: "id", filter: `id:eq:${id}`, paging: false })
        .getData();
    return (response[kind] ?? []).length > 0;
}

async function runWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
    const queue = [...items];
    const worker = async () => {
        for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
    };
    await Promise.all(_.times(concurrency, worker));
}

function checkMd5(data: Buffer, expected: string, what: string): void {
    const md5 = crypto.createHash("md5").update(data).digest("hex");
    if (md5 !== expected) throw new Error(`${what} checksum mismatch (expected ${expected}, got ${md5})`);
}

function log(message: string): void {
    console.debug(message);
}
