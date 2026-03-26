import { D2Api as D2ApiClass } from "@eyeseetea/d2-api/2.32";
import { getMockApiFromClass } from "@eyeseetea/d2-api";

export * from "@eyeseetea/d2-api/2.32";
export const D2Api = D2ApiClass;
export const getMockApi = getMockApiFromClass(D2ApiClass);
