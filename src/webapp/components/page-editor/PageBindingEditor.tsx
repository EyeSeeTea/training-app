import {
    Box,
    Button,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from "@material-ui/core";
import { Add, DeleteOutline } from "@material-ui/icons";
import styled from "styled-components";
import React from "react";

import {
    BindingType,
    EventBinding,
    EventType,
    IFrameBinding,
    IFrameEventType,
    PageBinding,
    SectionBinding,
} from "../../../domain/entities/PageBinding";
import i18n from "../../../utils/i18n";
import { Dropdown } from "@eyeseetea/d2-ui-components";
import { DropdownItem } from "@eyeseetea/d2-ui-components/dropdown/GenericDropdown";

type EditPageBindingProps = {
    bindings: PageBinding[];
    addBinding: () => void;
    handleChangeType: (id: string) => (value?: BindingType) => void;
    handleChange: <B extends PageBinding, K extends keyof B>(id: string) => (key: K, value: B[K]) => void;
    removeBinding: (id: string) => void;
};

export const PageBindingEditor: React.FC<EditPageBindingProps> = props => {
    const { bindings, addBinding, removeBinding, handleChangeType, handleChange } = props;

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <TableContainer component={Paper}>
                    <StyledTable>
                        <TableHead>
                            <TableRow>
                                <TableCell width="15%">{i18n.t("Binding")}</TableCell>
                                <TableCell width="15%">{i18n.t("Description")}</TableCell>
                                <TableCell width="50%">{i18n.t("Config")}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bindings.map(binding => (
                                <TableRow key={binding.id}>
                                    <TableCell>
                                        <DropdownContainer>
                                            <Dropdown
                                                label={i18n.t("Binding type")}
                                                items={bindingTypeOptions()}
                                                onChange={handleChangeType(binding.id)}
                                                value={binding.type}
                                                hideEmpty
                                            />
                                        </DropdownContainer>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            label={i18n.t("Description")}
                                            value={binding.description}
                                            onChange={event =>
                                                handleChange(binding.id)("description", event.target.value)
                                            }
                                        />
                                    </TableCell>
                                    <StyledTableCell>
                                        {binding.type === "event" && (
                                            <EventBindingEditor
                                                binding={binding}
                                                handleChange={handleChange(binding.id)}
                                            />
                                        )}
                                        {binding.type === "section" && (
                                            <SectionBindingEditor
                                                binding={binding}
                                                handleChange={handleChange(binding.id)}
                                            />
                                        )}
                                        {binding.type === "iframe" && (
                                            <IFrameBindingEditor
                                                binding={binding}
                                                handleChange={handleChange(binding.id)}
                                            />
                                        )}
                                    </StyledTableCell>
                                    <TableCell>
                                        <Button onClick={() => removeBinding(binding.id)}>
                                            <DeleteOutline />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </StyledTable>
                </TableContainer>
            </Grid>
            <FlexEnd item xs={12}>
                <Button variant="contained" onClick={addBinding}>
                    <Add />
                    {i18n.t("Add binding")}
                </Button>
            </FlexEnd>
        </Grid>
    );
};

type BindingEditor<B extends PageBinding> = {
    binding: B;
    handleChange: <K extends keyof B>(key: K, value: B[K]) => void;
};

export const EventBindingEditor: React.FC<BindingEditor<EventBinding>> = props => {
    const { binding, handleChange } = props;

    const handleChangeEventType = React.useCallback(
        (value?: EventType) => {
            if (value) {
                handleChange("eventType", value);
            }
        },
        [handleChange]
    );

    return (
        <>
            <TextField
                label={i18n.t("Training identifiers")}
                onChange={event => handleChange("trainingIdentifiers", event.target.value)}
                value={binding.trainingIdentifiers}
            />
            <DropdownContainer>
                <Dropdown
                    label={i18n.t("Event type")}
                    onChange={handleChangeEventType}
                    value={binding.eventType}
                    items={eventBindingTypeOptions()}
                />
            </DropdownContainer>
        </>
    );
};

export const SectionBindingEditor: React.FC<BindingEditor<SectionBinding>> = props => {
    const { binding, handleChange } = props;

    return (
        <>
            <TextField
                label={i18n.t("URL Pattern")}
                onChange={event => handleChange("urlPattern", event.target.value)}
                value={binding.urlPattern}
            />
        </>
    );
};

export const IFrameBindingEditor: React.FC<BindingEditor<IFrameBinding>> = props => {
    const { binding, handleChange } = props;

    const handleChangeEventType = React.useCallback(
        (value?: IFrameEventType) => {
            if (value) {
                handleChange("eventType", value);
            }
        },
        [handleChange]
    );

    return (
        <>
            <TextField
                label={i18n.t("URL Pattern")}
                onChange={event => handleChange("urlPattern", event.target.value)}
                value={binding.urlPattern}
            />
            <DropdownContainer>
                <Dropdown
                    label={i18n.t("Event type")}
                    onChange={handleChangeEventType}
                    value={binding.eventType}
                    items={iFrameEventTypeOptions()}
                />
            </DropdownContainer>
        </>
    );
};

function bindingTypeOptions(): DropdownItem<BindingType>[] {
    return [
        { value: "event", text: i18n.t("Event") },
        { value: "section", text: i18n.t("Section") },
        { value: "iframe", text: i18n.t("iFrame") },
    ];
}

function iFrameEventTypeOptions(): DropdownItem<IFrameEventType>[] {
    return [
        { value: "click", text: i18n.t("Click") },
        { value: "all", text: i18n.t("All") },
    ];
}
function eventBindingTypeOptions(): DropdownItem<EventType>[] {
    return [{ value: "focus", text: i18n.t("Focus") }, ...iFrameEventTypeOptions()];
}

const FlexEnd = styled(Grid)`
    display: flex;
    justify-content: flex-end;
`;

const StyledTable = styled(Table)`
    table-layout: fixed;
`;

const StyledTableCell = styled(TableCell)`
    display: flex;
`;

const DropdownContainer = styled(Box)`
    margin-top: 8px;
    label {
        color: #494949;
    }
    div {
        color: black;
    }
`;
