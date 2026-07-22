import { getDefaultLandingNode, LandingNode, LandingNodeType } from "../../../domain/entities/LandingPage";
import { getNavigationState } from "../useTrainingNavigation";

const buildNode = (type: LandingNodeType, overrides: Partial<LandingNode> = {}): LandingNode => ({
    ...getDefaultLandingNode({ type, parent: "none", order: 0 }),
    ...overrides,
});

const buildLanding = (children: LandingNode[], autoOpenSingleSection = false): LandingNode =>
    buildNode("root", { children, autoOpenSingleSection });

const section = () => buildNode("section");

describe("getNavigationState", () => {
    describe("with a single landing and the flag disabled", () => {
        it("shows the landing itself as root", () => {
            const landing = buildLanding([section()]);

            expect(getNavigationState({ history: [], userLandings: [landing] })).toEqual({
                currentPage: landing,
                isRoot: true,
                canGoBack: false,
            });
        });
    });

    describe("with a single landing and the flag enabled", () => {
        it("promotes the only section and reports it as not root", () => {
            const onlySection = section();
            const landing = buildLanding([onlySection], true);

            expect(getNavigationState({ history: [], userLandings: [landing] })).toEqual({
                currentPage: onlySection,
                isRoot: false,
                canGoBack: false,
            });
        });

        it("does not promote when there are several sections", () => {
            const landing = buildLanding([section(), section()], true);

            expect(getNavigationState({ history: [], userLandings: [landing] })).toEqual({
                currentPage: landing,
                isRoot: true,
                canGoBack: false,
            });
        });
    });

    describe("with several landings", () => {
        it("shows no page until one is picked", () => {
            const landings = [buildLanding([section()]), buildLanding([section()])];

            expect(getNavigationState({ history: [], userLandings: landings })).toEqual({
                currentPage: undefined,
                isRoot: true,
                canGoBack: false,
            });
        });

        it("promotes the only section of the picked landing and allows going back", () => {
            const onlySection = section();
            const picked = buildLanding([onlySection], true);
            const landings = [picked, buildLanding([section()])];

            expect(getNavigationState({ history: [picked], userLandings: landings })).toEqual({
                currentPage: onlySection,
                isRoot: false,
                canGoBack: true,
            });
        });
    });

    describe("when a page has been opened", () => {
        it("shows that page and allows going back", () => {
            const opened = buildNode("sub-section");
            const landing = buildLanding([section()]);

            expect(getNavigationState({ history: [opened, landing], userLandings: [landing] })).toEqual({
                currentPage: opened,
                isRoot: false,
                canGoBack: true,
            });
        });
    });

    describe("without any landing", () => {
        it("shows no page", () => {
            expect(getNavigationState({ history: [], userLandings: [] })).toEqual({
                currentPage: undefined,
                isRoot: true,
                canGoBack: false,
            });
        });
    });
});
