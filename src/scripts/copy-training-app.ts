import { binary, command, flag, option, optional, run, string } from "cmd-ts";
import _ from "lodash";
import { DocumentFileD2Repository } from "../data/repositories/DocumentFileD2Repository";
import { InstanceDhisRepository } from "../data/repositories/InstanceDhisRepository";
import { TrainingAppConfigD2Repository } from "../data/repositories/TrainingAppConfigD2Repository";
import {
    CopyAction,
    CopyRepositories,
    CopyReportItem,
    CopyTrainingAppConfigUseCase,
} from "../domain/usecases/CopyTrainingAppConfigUseCase";
import { getD2ApiFromUrl } from "./common/D2ApiFromUrl";

const cmd = command({
    name: "copy-training-app",
    description: [
        "Copy the training-app configuration (dataStore namespace + referenced documents) between DHIS2 instances.",
        "Dry run by default: pass --post to write to the target. SOCKS proxy: set ALL_PROXY.",
    ].join(" "),
    args: {
        sourceUrl: option({
            type: string,
            long: "source-url",
            description: "Source DHIS2: http[s]://[USERNAME:PASSWORD@]HOST[:PORT][/PATH]",
        }),
        sourceAuth: option({
            type: optional(string),
            long: "source-auth",
            description: "Source credentials USERNAME:PASSWORD (overrides the ones in the URL)",
        }),
        targetUrl: option({
            type: string,
            long: "target-url",
            description: "Target DHIS2: http[s]://[USERNAME:PASSWORD@]HOST[:PORT][/PATH]",
        }),
        targetAuth: option({
            type: optional(string),
            long: "target-auth",
            description: "Target credentials USERNAME:PASSWORD (overrides the ones in the URL)",
        }),
        post: flag({
            long: "post",
            description: "Write to the target (default: dry run, read-only)",
        }),
        updateDocuments: flag({
            long: "update-documents",
            description: "Replace the file of documents already on the target when their content differs",
        }),
    },
    handler: async args => {
        const source = getRepositories(args.sourceUrl, args.sourceAuth);
        const target = getRepositories(args.targetUrl, args.targetAuth);

        console.debug(`source: ${args.sourceUrl.replace(/\/\/[^@/]*@/, "//")}`);
        console.debug(`target: ${args.targetUrl.replace(/\/\/[^@/]*@/, "//")}`);
        if (!args.post) console.debug("mode: DRY RUN (pass --post to write)");

        const useCase = new CopyTrainingAppConfigUseCase(source, target);
        const report = await useCase.execute({
            post: args.post,
            updateDocuments: args.updateDocuments,
            onProgress: item => console.debug(formatItem(item, args.post)),
        });

        const counts = _.countBy(report.items, item => `${item.type} ${getActionText(item.action, args.post)}`);
        console.debug(`\nSummary: ${_.map(counts, (count, text) => `${text}: ${count}`).join(", ")}`);

        const errorsCount = report.items.filter(item => item.action === "error").length;
        if (errorsCount > 0) {
            console.error(`FAILED: ${errorsCount} error(s)`);
            process.exit(1);
        }
    },
});

function getRepositories(url: string, auth: string | undefined): CopyRepositories {
    const { api, httpClient } = getD2ApiFromUrl(url, auth);

    return {
        config: new TrainingAppConfigD2Repository(api),
        documents: new DocumentFileD2Repository(api, httpClient),
        instance: new InstanceDhisRepository(api),
    };
}

function formatItem(item: CopyReportItem, post: boolean): string {
    const warning = item.warning ? ` -- WARNING: ${item.warning}` : "";
    return `${item.type} ${item.id} ${getActionText(item.action, post)}: ${item.message}${warning}`;
}

function getActionText(action: CopyAction, post: boolean): string {
    switch (action) {
        case "create":
            return post ? "created + verified" : "would create";
        case "update":
            return post ? "updated + verified" : "would update";
        case "skip-existing":
            return "skipped (already on target)";
        case "skip-same-content":
            return "skipped (same content on target)";
        case "dangling-reference":
            return "WARNING dangling reference";
        case "missing-on-target":
            return "WARNING not found on target";
        case "missing-on-both":
            return "WARNING not found on source nor target (stale)";
        case "error":
            return "ERROR";
    }
}

run(binary(cmd), process.argv).catch(err => {
    console.error(err?.message ?? err);
    process.exit(1);
});
