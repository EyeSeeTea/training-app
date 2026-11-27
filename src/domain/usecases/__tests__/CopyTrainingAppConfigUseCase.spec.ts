import { describe, expect, it } from "vitest";
import { DocumentFileInMemoryRepository } from "../../../data/repositories/__tests__/DocumentFileInMemoryRepository";
import { TrainingAppConfigInMemoryRepository } from "../../../data/repositories/__tests__/TrainingAppConfigInMemoryRepository";
import { DocumentFile } from "../../entities/DocumentFile";
import { Permission } from "../../entities/Permission";
import { TrainingAppConfig } from "../../entities/TrainingAppConfig";
import { InstanceRepository } from "../../repositories/InstanceRepository";
import { CopyOptions, CopyReportItem, CopyTrainingAppConfigUseCase } from "../CopyTrainingAppConfigUseCase";

describe("CopyTrainingAppConfigUseCase", () => {
    it("in dry run, reports what would be done without writing to the target", async () => {
        const { useCase, target } = setup({ targetDocuments: [] });

        const { items } = await useCase.execute(dryRun);

        expect(getActions(items)).toEqual([
            ["document", "doc0000001A", "create"],
            ["document", "doc0000002B", "create"],
            ["entry", "training-modules", "create"],
        ]);
        expect(target.documents.documents).toEqual([]);
        expect(target.config.config.entries).toEqual([]);
    });

    it("copies the referenced documents (same IDs) and the entries", async () => {
        const { useCase, source, target } = setup({ targetDocuments: [] });

        const { items } = await useCase.execute(post);

        expect(items.map(item => item.action)).toEqual(["create", "create", "create"]);
        expect(await target.documents.getByIds(documentIds)).toEqual(await source.documents.getByIds(documentIds));
        expect(target.config.config.entries).toEqual(source.config.config.entries);
    });

    it("skips documents already on the target", async () => {
        const { useCase, target } = setup({ targetDocuments: [buildDocument("doc0000001A", "other-md5")] });

        const { items } = await useCase.execute(post);

        expect(getActions(items)).toContainEqual(["document", "doc0000001A", "skip-existing"]);
        expect((await target.documents.getByIds(["doc0000001A"]))[0]?.content).toMatchObject({ md5: "other-md5" });
    });

    it("with updateDocuments, replaces the documents on the target whose content differs", async () => {
        const { useCase, target } = setup({
            targetDocuments: [buildDocument("doc0000001A", "other-md5"), buildDocument("doc0000002B", "md5-2")],
        });

        const { items } = await useCase.execute({ ...post, updateDocuments: true });

        expect(getActions(items)).toContainEqual(["document", "doc0000001A", "update"]);
        expect(getActions(items)).toContainEqual(["document", "doc0000002B", "skip-same-content"]);
        expect((await target.documents.getByIds(["doc0000001A"]))[0]?.content).toMatchObject({ md5: "md5-1" });
    });

    it("reports references to documents not found on source", async () => {
        const { useCase } = setup({ targetDocuments: [], extraReference: "missing0001" });

        const { items } = await useCase.execute(dryRun);

        expect(getActions(items)).toContainEqual(["document", "missing0001", "dangling-reference"]);
    });

    it("warns, in dry run, about files bigger than the default upload limit", async () => {
        const { useCase } = setup({ targetDocuments: [], size: 15_000_000 });

        const { items } = await useCase.execute(dryRun);

        expect(items.find(item => item.id === "doc0000001A")?.warning).toContain("max.file_upload_size");
    });

    it("reports document save errors and goes on with the rest", async () => {
        const { useCase, target } = setup({ targetDocuments: [] });
        target.documents.saveError = new Error("File size can't be bigger than 10000000");

        const { items } = await useCase.execute(post);

        const documentItems = items.filter(item => item.type === "document");
        expect(documentItems.map(item => item.action)).toEqual(["error", "error"]);
        expect(documentItems[0]?.message).toContain("File size can't be bigger");
        expect(getActions(items)).toContainEqual(["entry", "training-modules", "create"]);
    });

    it("reports settings permissions users and groups missing on target, or on both instances", async () => {
        const { useCase } = setup({
            targetDocuments: [],
            settingsPermissions: {
                users: [
                    { id: "user0000001", name: "On both" },
                    { id: "user0000002", name: "Only on source" },
                    { id: "user0000003", name: "On none" },
                ],
                userGroups: [{ id: "group000001", name: "Group only on source" }],
            },
            sourceUsersAndGroups: {
                users: [
                    { id: "user0000001", name: "On both" },
                    { id: "user0000002", name: "Only on source" },
                ],
                userGroups: [{ id: "group000001", name: "Group only on source" }],
            },
            targetUsersAndGroups: { users: [{ id: "user0000001", name: "On both" }], userGroups: [] },
        });

        const { items } = await useCase.execute(dryRun);

        expect(getActions(items).filter(([type]) => type === "user" || type === "userGroup")).toEqual([
            ["user", "user0000002", "missing-on-target"],
            ["user", "user0000003", "missing-on-both"],
            ["userGroup", "group000001", "missing-on-target"],
        ]);
    });
});

const dryRun: CopyOptions = { post: false, updateDocuments: false };
const post: CopyOptions = { post: true, updateDocuments: false };

const documentIds = ["doc0000001A", "doc0000002B"];

function setup(options: {
    targetDocuments: DocumentFile[];
    extraReference?: string;
    size?: number;
    settingsPermissions?: Permission;
    sourceUsersAndGroups?: Permission;
    targetUsersAndGroups?: Permission;
}) {
    const references = [...documentIds, ...(options.extraReference ? [options.extraReference] : [])];
    const sourceConfig: TrainingAppConfig = {
        entries: [
            {
                key: "training-modules",
                value: { contents: references.map(id => `![file](../../documents/${id}/data)`) },
            },
        ],
        settingsPermissions: options.settingsPermissions,
    };

    const sourceDocuments = [
        { document: buildDocument("doc0000001A", "md5-1", options.size), file: encode("md5-1") },
        { document: buildDocument("doc0000002B", "md5-2"), file: encode("md5-2") },
    ];

    const source = {
        config: new TrainingAppConfigInMemoryRepository(sourceConfig),
        documents: new DocumentFileInMemoryRepository(sourceDocuments),
        instance: new InstanceStubRepository(options.sourceUsersAndGroups),
    };
    const target = {
        config: new TrainingAppConfigInMemoryRepository({ entries: [], settingsPermissions: undefined }),
        documents: new DocumentFileInMemoryRepository(options.targetDocuments.map(document => ({ document }))),
        instance: new InstanceStubRepository(options.targetUsersAndGroups),
    };

    return { useCase: new CopyTrainingAppConfigUseCase(source, target), source, target };
}

function buildDocument(id: string, md5: string, size = 1000): DocumentFile {
    return {
        id,
        name: `[Training App] ${id}.png`,
        attachment: false,
        publicAccess: "rw------",
        content: { type: "file", contentType: "image/png", size, md5 },
    };
}

function encode(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function getActions(items: CopyReportItem[]): Array<[string, string, string]> {
    return items.map(item => [item.type, item.id, item.action]);
}

class InstanceStubRepository implements InstanceRepository {
    constructor(private usersAndGroups: Permission = { users: [], userGroups: [] }) {}

    public async getUsersAndGroups(): Promise<Permission> {
        return this.usersAndGroups;
    }

    public async installApp(): Promise<boolean> {
        throw new Error("Not implemented");
    }

    public async searchUsers(): Promise<never> {
        throw new Error("Not implemented");
    }

    public async listInstalledApps(): Promise<never> {
        throw new Error("Not implemented");
    }
}
