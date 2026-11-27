import { describe, expect, it } from "vitest";
import { getReferencedDocumentIds, TrainingAppConfig } from "../TrainingAppConfig";

function buildConfig(values: object[]): TrainingAppConfig {
    return {
        entries: values.map((value, index) => ({ key: `key${index}`, value })),
        settingsPermissions: undefined,
    };
}

describe("getReferencedDocumentIds", () => {
    it("returns the IDs of relative document references in markdown and HTML", () => {
        const config = buildConfig([
            { text: "![video](../../documents/aBcDeFgHiJ1/data)" },
            { pages: [{ html: '<img src="../../documents/Zyxwvutsrq2/data">' }] },
        ]);

        expect(getReferencedDocumentIds(config)).toEqual(["Zyxwvutsrq2", "aBcDeFgHiJ1"]);
    });

    it("returns the IDs of absolute document references", () => {
        const config = buildConfig([{ logo: "https://dhis2.example.org/api/documents/aBcDeFgHiJ1/data" }]);

        expect(getReferencedDocumentIds(config)).toEqual(["aBcDeFgHiJ1"]);
    });

    it("returns each ID once, across entries", () => {
        const config = buildConfig([
            { a: "../../documents/aBcDeFgHiJ1/data", b: "../../documents/aBcDeFgHiJ1/data" },
            { c: "../../documents/aBcDeFgHiJ1/data" },
        ]);

        expect(getReferencedDocumentIds(config)).toEqual(["aBcDeFgHiJ1"]);
    });

    it("ignores other URLs", () => {
        const config = buildConfig([
            { link: "[dashboards](https://dhis2.example.org/dhis-web-dashboard/#/aBcDeFgHiJ1)" },
            { text: "no references here" },
        ]);

        expect(getReferencedDocumentIds(config)).toEqual([]);
    });
});
