import { describe, expect, it } from "vitest";
import { getModuleFrame } from "../ModuleFrame";

const baseUrl = "https://dhis2.example.org";
const moduleKey = "phsm-capture";
const buildModules = (dhisLaunchUrl: string) => [{ id: moduleKey, dhisLaunchUrl }];

describe("getModuleFrame", () => {
    it("loads the module launch URL", () => {
        const frame = getModuleFrame({
            baseUrl,
            moduleKey,
            modules: buildModules("/apps/capture-extended"),
            modulesStatus: "loaded",
        });

        expect(frame).toEqual({ type: "iframe", src: `${baseUrl}/apps/capture-extended` });
    });

    it("shows not found when the module is missing after the modules load", () => {
        const frame = getModuleFrame({ baseUrl, moduleKey, modules: [], modulesStatus: "loaded" });
        expect(frame).toEqual({ type: "unavailable", reason: "not-found" });
    });

    it("shows a load error when the module list request fails", () => {
        const frame = getModuleFrame({ baseUrl, moduleKey, modules: [], modulesStatus: "failed" });
        expect(frame).toEqual({ type: "unavailable", reason: "load-failed" });
    });

    it("renders nothing while the modules load", () => {
        const frame = getModuleFrame({ baseUrl, moduleKey, modules: [], modulesStatus: "loading" });
        expect(frame).toEqual({ type: "none" });
    });

    it("never loads the server root for a module without a launch URL", () => {
        const frame = getModuleFrame({ baseUrl, moduleKey, modules: buildModules(""), modulesStatus: "loaded" });
        expect(frame).toEqual({ type: "none" });
    });

    it("loads the server root on routes without a module", () => {
        const frame = getModuleFrame({ baseUrl, moduleKey: undefined, modules: [], modulesStatus: "loaded" });
        expect(frame).toEqual({ type: "iframe", src: baseUrl });
    });
});
