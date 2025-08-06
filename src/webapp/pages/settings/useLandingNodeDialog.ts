import { useCallback, useState } from "react";
import _ from "lodash";

import { LandingPageEditDialogProps } from "../../components/landing-page-edit-dialog/LandingPageEditDialog";
import i18n from "../../../utils/i18n";
import { LandingNode } from "../../../domain/entities/LandingPage";
import { useAppContext } from "../../contexts/app-context";

export function useLandingNodeDialog(props: { nodes: LandingNode[] }) {
    const { nodes } = props;
    const { usecases, reload } = useAppContext();
    const [landingNodeDetailsDialog, setLandingNodeDetailsDialog] = useState<LandingPageEditDialogProps>();

    const doSaveLandingNode = useCallback(
        async (node: LandingNode) => {
            setLandingNodeDetailsDialog(undefined);
            await usecases.landings.update(node);
            await reload();
        },
        [reload, usecases]
    );

    const onAddLandingPage = useCallback(() => {
        setLandingNodeDetailsDialog({
            title: i18n.t("Add Landing Page"),
            type: "root",
            parent: "none",
            order: 0,
            onCancel: () => setLandingNodeDetailsDialog(undefined),
            onSave: doSaveLandingNode,
        });
    }, [doSaveLandingNode]);

    const onAddSection = useCallback(
        (ids: string[]) => {
            const parent = flattenRows(nodes).find(({ id }) => id === ids[0]);
            if (!parent) return;

            setLandingNodeDetailsDialog({
                title: i18n.t("Add section"),
                type: "section",
                parent: parent.id,
                order: parent.children.length,
                onCancel: () => setLandingNodeDetailsDialog(undefined),
                onSave: doSaveLandingNode,
            });
        },
        [doSaveLandingNode, nodes]
    );

    const onAddSubSection = useCallback(
        (ids: string[]) => {
            const parent = flattenRows(nodes).find(({ id }) => id === ids[0]);
            if (!parent) return;

            setLandingNodeDetailsDialog({
                title: i18n.t("Add sub-section"),
                type: "sub-section",
                parent: parent.id,
                order: parent.children.length,
                onCancel: () => setLandingNodeDetailsDialog(undefined),
                onSave: doSaveLandingNode,
            });
        },
        [doSaveLandingNode, nodes]
    );

    const onAddCategory = useCallback(
        (ids: string[]) => {
            const parent = flattenRows(nodes).find(({ id }) => id === ids[0]);
            if (!parent) return;

            setLandingNodeDetailsDialog({
                title: i18n.t("Add category"),
                type: "category",
                parent: parent.id,
                order: parent.children.length,
                onCancel: () => setLandingNodeDetailsDialog(undefined),
                onSave: doSaveLandingNode,
            });
        },
        [doSaveLandingNode, nodes]
    );

    const onEditLandingNode = useCallback(
        (ids: string[]) => {
            const node = flattenRows(nodes).find(({ id }) => id === ids[0]);
            if (!node) return;

            setLandingNodeDetailsDialog({
                title: i18n.t("Edit"),
                type: node.type,
                parent: node.parent,
                initialNode: node,
                order: node.order ?? 0,
                onCancel: () => setLandingNodeDetailsDialog(undefined),
                onSave: doSaveLandingNode,
            });
        },
        [doSaveLandingNode, nodes]
    );

    return {
        landingNodeDetailsDialog,
        onAddSection,
        onAddSubSection,
        onAddCategory,
        onEditLandingNode,
        onAddLandingPage,
    };
}

const flattenRows = (rows: LandingNode[]): LandingNode[] => {
    return _.flatMap(rows, row => [row, ...flattenRows(row.children)]);
};
