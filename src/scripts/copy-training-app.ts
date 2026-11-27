import { binary, command, flag, option, optional, run, string } from "cmd-ts";
import { DhisInstance } from "./common/DhisInstance";
import { TrainingAppCopier } from "./TrainingAppCopier";

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
        const source = DhisInstance.fromUrl(args.sourceUrl, args.sourceAuth);
        const target = DhisInstance.fromUrl(args.targetUrl, args.targetAuth);
        const copier = new TrainingAppCopier(source, target, {
            post: args.post,
            updateDocuments: args.updateDocuments,
        });
        const { failures } = await copier.execute();

        if (failures > 0) {
            console.error(`\nFAILED: ${failures} error(s)`);
            process.exit(1);
        } else {
            console.debug("\nDone.");
        }
    },
});

run(binary(cmd), process.argv).catch(err => {
    console.error(err?.message ?? err);
    process.exit(1);
});
