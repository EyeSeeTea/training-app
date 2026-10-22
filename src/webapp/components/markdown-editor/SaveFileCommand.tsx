import { fileTypeFromBuffer, FileTypeResult } from "file-type";
import _ from "lodash";
import { Command, CommandContext, ExecuteOptions, PasteCommandContext } from "react-mde";
import { PasteOptions } from "react-mde/lib/definitions/types";
import i18n from "../../../utils/i18n";

function dataTransferToArray(items: DataTransferItemList): Array<File> {
    return _(items)
        .map(item => {
            if (item.kind !== "file") return undefined;
            return item.getAsFile();
        })
        .compact()
        .value();
}

function fileListToArray(list: FileList | null): Array<File> {
    return _.compact(list);
}

interface CustomPasteOptions extends Omit<PasteOptions, "saveImage"> {
    saveImage: (data: ArrayBuffer, file?: File) => AsyncGenerator<string, boolean>;
}

export const saveFileCommand: Command = {
    async execute({ textApi, context }: ExecuteOptions): Promise<void> {
        if (!context) throw new Error("Context not defined");
        const { event, pasteOptions } = context as PasteCommandContext;
        const { saveImage } = pasteOptions as CustomPasteOptions;

        const items = isPasteEvent(context)
            ? dataTransferToArray((event as React.ClipboardEvent).clipboardData.items)
            : isDragEvent(context)
            ? dataTransferToArray((event as React.DragEvent).dataTransfer.items)
            : fileListToArray((event as React.ChangeEvent<HTMLInputElement>).target.files);

        for (const blob of items) {
            const initialState = textApi.getState();
            const breaksBeforeCount = getBreaksNeededForEmptyLineBefore(
                initialState.text,
                initialState.selection.start
            );

            const breaksBefore = Array(breaksBeforeCount + 1).join("\n");
            const placeHolder = `${breaksBefore}[${i18n.t("Uploading file...")}]()`;

            textApi.replaceSelection(placeHolder);

            const blobContents = await readFileAsync(blob);
            const saveFileAction = saveImage(blobContents, blob);
            const { value: fileUrl } = await saveFileAction.next();
            const uploaded = typeof fileUrl === "string";
            const type = uploaded ? await fileTypeFromBuffer(new Uint8Array(blobContents)) : undefined;
            const realMarkdown = uploaded ? `${breaksBefore}${getMarkdown(fileUrl, type)}` : "";

            const newState = textApi.getState();
            const placeHolderStart = findPlaceHolder(newState.text, placeHolder, initialState.selection.start);
            if (placeHolderStart === undefined) continue;

            textApi.setSelectionRange({ start: placeHolderStart, end: placeHolderStart + placeHolder.length });
            textApi.replaceSelection(realMarkdown);

            const selectionDelta =
                placeHolderStart < newState.selection.start ? realMarkdown.length - placeHolder.length : 0;

            textApi.setSelectionRange({
                start: newState.selection.start + selectionDelta,
                end: newState.selection.end + selectionDelta,
            });
        }
    },
};

function findPlaceHolder(text: string, placeHolder: string, initialStart: number): number | undefined {
    if (text.substr(initialStart, placeHolder.length) === placeHolder) return initialStart;

    const index = text.indexOf(placeHolder);
    return index === -1 ? undefined : index;
}

function getMarkdown(fileUrl: string, type?: FileTypeResult): string {
    // Detect transformed gif files
    if (import.meta.env.DEV && type?.mime === "image/gif") {
        return `<video-gif src="${fileUrl}"></video-gif>`;
    }

    // Detect and add pdf preview (HTML5)
    if (type?.mime === "application/pdf") {
        return `<pdf src="${fileUrl}"></pdf>`;
    }

    // Detect and add images inline (markdown)
    if (type?.mime.startsWith("image/")) {
        return `![Uploaded file](${fileUrl})`;
    }

    // Detect and add videos inline (markdown)
    if (type?.mime.startsWith("video/")) {
        return `<video src="${fileUrl}"></video>`;
    }

    // Fail-safe markdown download link
    return `[Uploaded file](${fileUrl})`;
}

function isPasteEvent(context: CommandContext): context is PasteCommandContext {
    return ((context as PasteCommandContext).event as React.ClipboardEvent).clipboardData !== undefined;
}

function isDragEvent(context: CommandContext): context is PasteCommandContext {
    return ((context as PasteCommandContext).event as React.DragEvent).dataTransfer !== undefined;
}

/**
 * Reads a file and returns an ArrayBuffer
 * @param file
 */
async function readFileAsync(file: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === "string") {
                throw new Error("reader.result is expected to be an ArrayBuffer");
            } else if (reader.result === null) {
                throw new Error("reader.result is null");
            }
            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsArrayBuffer(file);
    });
}

function getBreaksNeededForEmptyLineBefore(text = "", startPosition: number): number {
    if (startPosition === 0) return 0;

    // rules:
    // - If we're in the first line, no breaks are needed
    // - Otherwise there must be 2 breaks before the previous character. Depending on how many breaks exist already, we
    //      may need to insert 0, 1 or 2 breaks

    let neededBreaks = 2;
    let isInFirstLine = true;
    for (let i = startPosition - 1; i >= 0 && neededBreaks >= 0; i--) {
        switch (text.charCodeAt(i)) {
            case 32: // blank space
                continue;
            case 10: // line break
                neededBreaks--;
                isInFirstLine = false;
                break;
            default:
                return neededBreaks;
        }
    }
    return isInFirstLine ? 0 : neededBreaks;
}
