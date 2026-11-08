import { useSnackbar } from "@eyeseetea/d2-ui-components";
import _ from "lodash";
import React from "react";
import ReactMde, { getDefaultToolbarCommands } from "react-mde";
import { PasteOptions } from "react-mde/lib/definitions/types";
import "react-mde/lib/styles/css/react-mde-all.css";
import styled from "styled-components";
import { allFilesMimeType } from "../../../utils/files";
import { Either } from "../../../domain/entities/Either";
import { Maybe } from "../../../types/utils";
import i18n from "../../../utils/i18n";
import { SimpleMarkdownViewer } from "../markdown-viewer/MarkdownViewer";
import { addNoteCommand } from "./AddNoteCommand";
import { saveFileCommand } from "./SaveFileCommand";

export interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    onUpload?: (data: ArrayBuffer, file: File) => Promise<Maybe<string>>;
    markdownPreview?: (markdown: string) => React.ReactNode;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    onUpload,
    markdownPreview = defaultPreviewMarkdown,
}) => {
    const snackbar = useSnackbar();

    const saveImage = async function* (data: ArrayBuffer, file: File) {
        if (!onUpload) return false;

        const upload: Either<string, string> = await onUpload(data, file).then(
            url =>
                url
                    ? Either.success(url)
                    : Either.error(
                          i18n.t("The server did not return a link for the file {{name}}.", { name: file.name })
                      ),
            (error: unknown) => Either.error(getUploadErrorMessage(file, error))
        );

        if (Either.isError(upload.value)) {
            snackbar.error(upload.value.error);
            return false;
        }

        yield upload.value.data;
        return true;
    };

    const pasteOptions = { saveImage, command: "save-file", accept: allFilesMimeType } as PasteOptions;

    return (
        <Container>
            <Children>
                <ReactMde
                    value={value}
                    onChange={onChange}
                    paste={onUpload ? pasteOptions : undefined}
                    commands={{ "add-note": addNoteCommand, "save-file": saveFileCommand }}
                    toolbarCommands={[...getDefaultToolbarCommands(), ["add-note"]]}
                    minEditorHeight={500}
                    disablePreview={true}
                />
            </Children>
            <Children>{markdownPreview(value)}</Children>
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;

    textarea,
    button {
        outline: 0px;
    }

    .mde-tabs {
        display: none !important;
    }
`;

const Children = styled.div`
    height: 100%;
    max-height: 100%;
    min-height: 100%;
    width: 49%;
`;

function getUploadErrorMessage(file: File, error: unknown): string {
    const { status, message } = getHttpErrorDetails(error);

    if (status === 413) {
        return i18n.t("The server refused the file {{name}} because it is too large. Use a smaller file.", {
            name: file.name,
        });
    }

    if (status === 408 || status === 504) {
        return i18n.t("The upload of {{name}} took too long and the server stopped it. Use a smaller file.", {
            name: file.name,
        });
    }

    return i18n.t("The upload of {{name}} failed: {{message}}", { name: file.name, message, nsSeparator: false });
}

function getHttpErrorDetails(error: unknown): { status: Maybe<number>; message: string } {
    const status: unknown = _.get(error, ["response", "status"]);
    const serverMessage: unknown = _.get(error, ["response", "data", "message"]);
    const errorMessage = error instanceof Error ? error.message : "";

    return {
        status: typeof status === "number" ? status : undefined,
        message: (typeof serverMessage === "string" && serverMessage) || errorMessage || String(error),
    };
}

const defaultPreviewMarkdown = (markdown: string) => <SimpleMarkdownViewer source={markdown} />;
