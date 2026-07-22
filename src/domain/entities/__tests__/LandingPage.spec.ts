import {
    getDefaultLandingNode,
    getPromotedSingleSection,
    LandingNode,
    LandingNodeModel,
    LandingNodeType,
} from "../LandingPage";

const persistedRoot = {
    id: "PkJ8Kf9Wq2L",
    parent: "none",
    type: "root",
    icon: "",
    name: { key: "root-name", referenceValue: "Landing page", translations: {} },
    modules: [],
    children: [],
    permissions: { publicAccess: "r-------", userAccesses: [], userGroupAccesses: [] },
};

const buildNode = (type: LandingNodeType, overrides: Partial<LandingNode> = {}): LandingNode => ({
    ...getDefaultLandingNode({ type, parent: "none", order: 0 }),
    ...overrides,
});

const buildRoot = (children: LandingNode[], autoOpenSingleSection: boolean): LandingNode =>
    buildNode("root", { children, autoOpenSingleSection });

describe("getPromotedSingleSection", () => {
    describe("when the flag is enabled", () => {
        it("returns the only section", () => {
            const section = buildNode("section");

            expect(getPromotedSingleSection(buildRoot([section], true))).toEqual(section);
        });

        it("returns undefined when there are several sections", () => {
            const sections = [buildNode("section"), buildNode("section")];

            expect(getPromotedSingleSection(buildRoot(sections, true))).toBeUndefined();
        });

        it("returns undefined when there are no sections", () => {
            expect(getPromotedSingleSection(buildRoot([], true))).toBeUndefined();
        });
    });

    describe("when the flag is disabled", () => {
        it("returns undefined even with a single section", () => {
            const section = buildNode("section");

            expect(getPromotedSingleSection(buildRoot([section], false))).toBeUndefined();
        });
    });

    describe("when the node is not a root landing", () => {
        it.each(["section", "sub-section", "category"] as const)("returns undefined for a %s node", type => {
            const child = buildNode("category");
            const node = buildNode(type, { children: [child], autoOpenSingleSection: true });

            expect(getPromotedSingleSection(node)).toBeUndefined();
        });
    });

    it("returns undefined when there is no node", () => {
        expect(getPromotedSingleSection(undefined)).toBeUndefined();
    });
});

describe("LandingNodeModel", () => {
    it("defaults autoOpenSingleSection to false for nodes stored before the flag existed", () => {
        const decoded = LandingNodeModel.decode(persistedRoot);

        expect(decoded.toMaybe().extract()?.autoOpenSingleSection).toBe(false);
    });

    it("decodes an enabled flag", () => {
        const decoded = LandingNodeModel.decode({ ...persistedRoot, autoOpenSingleSection: true });

        expect(decoded.toMaybe().extract()?.autoOpenSingleSection).toBe(true);
    });
});
