import { useCallback, useMemo, useState } from "react";
import { ListItem, ListItemPage, ModuleListTableAction } from "./ModuleListTable";
import { SharedUpdate } from "../permissions-dialog/PermissionsDialog";

type UsePagePermissions = {
    rows: ListItem[];
    onChange: ModuleListTableAction["editPagePermissions"];
    refreshRows: () => Promise<void>;
};

export function usePagePermissions(props: UsePagePermissions) {
    const { rows, onChange, refreshRows } = props;

    const [activeRow, setActiveRow] = useState<ListItemPage>();

    const pagePermissionsDialog = useMemo(
        () =>
            activeRow
                ? {
                      object: { name: "Page permissions", ...activeRow.permissions },
                      onChange: async (sharedUpdate: SharedUpdate) => {
                          if (!onChange) return;
                          const permissions = {
                              ...activeRow.permissions,
                              ...sharedUpdate,
                          };
                          await onChange({ id: activeRow.moduleId, page: { id: activeRow.id, permissions } });
                          await refreshRows();
                          setActiveRow({
                              ...activeRow,
                              permissions,
                          });
                      },
                      onClose: () => setActiveRow(undefined),
                      allowPublicAccess: true,
                      showOptions: {
                          publicSharing: true,
                          permissionPicker: true,
                      },
                  }
                : undefined,
        [activeRow, onChange, refreshRows]
    );

    const openPagePermissions = useCallback(
        ids => {
            const row = rows.find(({ id }) => id === ids[0]);
            if (!row || !row.value) return;

            if (isPage(row)) setActiveRow(row);
        },
        [rows]
    );

    return {
        pagePermissionsDialog,
        openPagePermissions,
    };
}

function isPage(row: ListItem): row is ListItemPage {
    return row.rowType === "page";
}
