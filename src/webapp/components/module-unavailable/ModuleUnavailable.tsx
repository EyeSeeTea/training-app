import React from "react";
import i18n from "../../../utils/i18n";
import { MarkdownViewer } from "../markdown-viewer/MarkdownViewer";
import { CenteredModal, ModalContent } from "../modal";

export type ModuleUnavailableReason = "not-found" | "load-failed";

export const ModuleUnavailable: React.FC<{ reason: ModuleUnavailableReason; onGoHome: () => void }> = ({
    reason,
    onGoHome,
}) => {
    const { title, description } = getMessages()[reason];
    const source = [`# ${title}`, description].join("\n\n");

    return (
        <CenteredModal onGoHome={onGoHome} centerChildren={true}>
            <ModalContent>
                <MarkdownViewer source={source} center={true} />
            </ModalContent>
        </CenteredModal>
    );
};

const getMessages = (): Record<ModuleUnavailableReason, { title: string; description: string }> => ({
    "not-found": {
        title: i18n.t("Module not found"),
        description: i18n.t("This module does not exist or you do not have access to it."),
    },
    "load-failed": {
        title: i18n.t("Cannot load the modules"),
        description: i18n.t("An error occurred. Reload the page to try again."),
    },
});
