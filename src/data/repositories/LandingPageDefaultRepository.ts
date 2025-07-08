import _ from "lodash";

import { LandingNode, LandingNodeModel } from "../../domain/entities/LandingPage";
import { setTranslationValue, TranslatableText } from "../../domain/entities/TranslatableText";
import { LandingPageRepository } from "../../domain/repositories/LandingPageRepository";
import { ImportExportClient } from "../clients/importExport/ImportExportClient";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { PersistedLandingPage } from "../entities/PersistedLandingPage";
import { generateUid } from "../utils/uid";
import { D2Api } from "../../types/d2-api";
import { DocumentRepository } from "../../domain/repositories/DocumentRepository";

export class LandingPageDefaultRepository implements LandingPageRepository {
    private storageClient: StorageClient;
    private importExportClient: ImportExportClient;

    constructor(api: D2Api, documentRepository: DocumentRepository) {
        this.storageClient = new DataStoreStorageClient("global", api);
        this.importExportClient = new ImportExportClient(api, documentRepository, "landing-pages");
    }

    public async list(): Promise<LandingNode[]> {
        try {
            const persisted = await this.storageClient.listObjectsInCollection<PersistedLandingPage>(
                Namespaces.LANDING_PAGES
            );

            const roots = persisted?.filter(({ parent }) => parent === "none");

            if (persisted.length === 0 || !roots?.length) {
                return this.saveDefaultLandingPage()
                    .then(root => buildDomainLandingNode(root, []))
                    .then(root => [root]);
            }

            const validations = roots.map(root =>
                LandingNodeModel.decode(buildDomainLandingNode(root, _.flatten(persisted)))
            );

            _.forEach(validations, validation => {
                if (validation.isLeft()) {
                    console.error(validation.extract());

                    throw new Error(validation.extract());
                }
            });

            return _.flatten(validations.map(validation => _.compact([validation.toMaybe().extract()])));
        } catch (error: any) {
            console.error(error);
            return [];
        }
    }

    public async export(ids: string[]): Promise<void> {
        const nodes = await this.storageClient.listObjectsInCollection<PersistedLandingPage>(Namespaces.LANDING_PAGES);
        const toExport = _(nodes)
            .filter(({ id }) => ids.includes(id))
            .flatMap(node => extractChildrenNodes(buildDomainLandingNode(node, nodes), node.parent))
            .flatten()
            .value();

        return this.importExportClient.export(toExport);
    }

    public async import(files: File[]): Promise<PersistedLandingPage[]> {
        const items = await this.importExportClient.import<PersistedLandingPage>(files);
        // TODO: Do not overwrite existing landing page
        await this.storageClient.saveObjectsInCollection(Namespaces.LANDING_PAGES, items);

        return items;
    }

    public async update(nodes: LandingNode[]): Promise<void> {
        const updatedNodes = nodes.map(node => extractChildrenNodes(node, node.parent)).flat();
        await this.storageClient.saveObjectsInCollection<PersistedLandingPage>(Namespaces.LANDING_PAGES, updatedNodes);
    }

    public async delete(ids: string[]): Promise<void> {
        const nodes = await this.storageClient.listObjectsInCollection<PersistedLandingPage>(Namespaces.LANDING_PAGES);
        const toDelete = _(nodes)
            .filter(({ id }) => ids.includes(id))
            .map(node => LandingNodeModel.decode(buildDomainLandingNode(node, nodes)).toMaybe().extract())
            .compact()
            .flatMap(node => [node.id, extractChildrenNodes(node, node.parent).map(({ id }) => id)])
            .flatten()
            .value();

        await this.storageClient.removeObjectsInCollection(Namespaces.LANDING_PAGES, toDelete);
    }

    public async extractTranslations(): Promise<TranslatableText[]> {
        const models = await this.storageClient.getObject<PersistedLandingPage[]>(Namespaces.LANDING_PAGES);
        if (!models) throw new Error(`Unable to load landing pages`);

        return this.extractTranslatableText(models);
    }

    private extractTranslatableText(models: PersistedLandingPage[]): TranslatableText[] {
        return _.flatMap(models, model => _.compact([model.name, model.title, model.content]));
    }

    public async importTranslations(language: string, terms: Record<string, string>): Promise<TranslatableText[]> {
        const models = await this.storageClient.getObject<PersistedLandingPage[]>(Namespaces.LANDING_PAGES);
        if (!models) throw new Error(`Unable to load landing pages`);

        const translatedModels: PersistedLandingPage[] = models.map(model => ({
            ...model,
            name: setTranslationValue(model.name, language, terms[model.name.key]),
            title: model.title ? setTranslationValue(model.title, language, terms[model.title.key]) : undefined,
            content: model.content ? setTranslationValue(model.content, language, terms[model.content.key]) : undefined,
        }));

        await this.storageClient.saveObjectsInCollection<PersistedLandingPage>(
            Namespaces.LANDING_PAGES,
            translatedModels
        );

        return this.extractTranslatableText(models);
    }

    private async saveDefaultLandingPage(): Promise<PersistedLandingPage> {
        const root = {
            id: generateUid(),
            parent: "none",
            type: "root" as const,
            icon: "",
            order: undefined,
            name: {
                key: "root-name",
                referenceValue: "Main landing page",
                translations: {},
            },
            title: undefined,
            content: undefined,
            modules: [],
            permissions: defaultPermissions,
            executeOnInit: true,
        };

        await this.storageClient.saveObjectInCollection<PersistedLandingPage>(Namespaces.LANDING_PAGES, root);
        return root;
    }
}

const defaultPermissions = {
    publicAccess: "r-------",
    userAccesses: [],
    userGroupAccesses: [],
};

const buildDomainLandingNode = (root: PersistedLandingPage, items: PersistedLandingPage[]): LandingNode => {
    return {
        ...root,
        permissions: root.permissions ?? defaultPermissions,
        children: _(items)
            .filter(({ parent }) => parent === root.id)
            .sortBy(item => item.order ?? 1000)
            .map((node, order) => ({ ...buildDomainLandingNode(node, items), order }))
            .value(),
    };
};

const extractChildrenNodes = (node: BaseNode, parent: string): PersistedLandingPage[] => {
    const { children, ...props } = node;
    const childrenNodes = _.flatMap(children, child => (child ? extractChildrenNodes(child, node.id) : []));

    return [{ ...props, parent } as PersistedLandingPage, ...childrenNodes];
};

interface BaseNode {
    id: string;
    children: (BaseNode | undefined)[];
}
