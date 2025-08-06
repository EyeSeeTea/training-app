import { useSnackbar } from "@eyeseetea/d2-ui-components";

import { useAppContext } from "../../contexts/app-context";
import {
    addPage,
    addStep,
    removePage,
    removeStep,
    updateOrder,
    updateTranslation,
} from "../../../domain/helpers/TrainingModuleHelpers";
import i18n from "../../../utils/i18n";
import { ModuleListTableAction } from "./ModuleListTable";

export function useModuleTableAction(): ModuleListTableAction {
    const { usecases, setAppState } = useAppContext();
    const snackbar = useSnackbar();

    const getModule = (id: string) => {
        return usecases.modules.get(id, { autoInstallDefaultModules: true });
    };

    return {
        openEditModulePage: ({ id }) => {
            setAppState({ type: "EDIT_MODULE", module: id });
        },
        openCloneModulePage: ({ id }) => {
            setAppState({ type: "CLONE_MODULE", module: id });
        },
        editContents: async ({ id, text, value }) => {
            const module = await getModule(id);
            if (module) await usecases.modules.update(updateTranslation(module, text.key, value));
            else snackbar.error(i18n.t("Unable to update module contents"));
        },
        deleteModules: ({ ids }) => usecases.modules.delete(ids),
        resetModules: ({ ids }) => usecases.modules.resetDefaultValue(ids),
        swap: async ({ type, id, from, to }) => {
            if (type === "module") {
                await usecases.modules.swapOrder(from, to);
                return;
            }

            const module = await getModule(id);
            if (module) await usecases.modules.update(updateOrder(module, from, to));
            else snackbar.error(i18n.t("Unable to move item"));
        },
        uploadFile: ({ data, name }) => usecases.document.uploadFile(data, name),
        installApp: ({ id }) => usecases.instance.installApp(id),
        addStep: async ({ id, title }) => {
            const module = await getModule(id);
            if (module) await usecases.modules.update(addStep(module, title));
            else snackbar.error(i18n.t("Unable to add step"));
        },
        addPage: async ({ id, step, value }) => {
            const module = await getModule(id);
            if (module) await usecases.modules.update(addPage(module, step, value));
            else snackbar.error(i18n.t("Unable to add page"));
        },
        deleteStep: async ({ id, step }) => {
            const module = await getModule(id);
            if (module) await usecases.modules.update(removeStep(module, step));
            else snackbar.error(i18n.t("Unable to remove step"));
        },
        deletePage: async ({ id, step, page }) => {
            const module = await getModule(id);
            if (module) await usecases.modules.update(removePage(module, step, page));
            else snackbar.error(i18n.t("Unable to remove page"));
        },
    };
}
