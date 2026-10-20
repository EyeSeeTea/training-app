import { describe, expect, it } from "vitest";
import { hasAuthorities, UserAuthorities } from "../User";

const buildUser = (authorities: string[], isSuperAdmin = false): UserAuthorities => ({
    isSuperAdmin,
    authorities,
});

describe("hasAuthorities", () => {
    it("allows a module when the user has all the required authorities", () => {
        const user = buildUser(["M_dhis-web-capture", "F_TRACKED_ENTITY_INSTANCE_SEARCH"]);
        expect(hasAuthorities(user, ["M_dhis-web-capture"])).toBe(true);
    });

    it("rejects a module when one required authority is missing", () => {
        const user = buildUser(["M_dhis-web-capture"]);
        expect(hasAuthorities(user, ["M_dhis-web-capture", "M_dhis-web-dashboard"])).toBe(false);
    });

    it("allows a module with no required authorities", () => {
        expect(hasAuthorities(buildUser([]), [])).toBe(true);
    });

    it("allows a stored module that has no authorities field", () => {
        expect(hasAuthorities(buildUser([]))).toBe(true);
    });

    it("allows every module for a super admin", () => {
        expect(hasAuthorities(buildUser([], true), ["M_dhis-web-capture"])).toBe(true);
    });
});
