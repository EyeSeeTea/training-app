import {
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
    EventBinding,
    IframeBinding,
    isEventType,
    PageBinding,
    SectionBinding,
} from "../../../domain/entities/PageBinding";
import i18n from "../../../utils/i18n";
import { Dropdown } from "@eyeseetea/d2-ui-components";

type EditPageBindingProps = {
    bindings: PageBinding[];
    addBinding: () => void;
    handleChangeType: (id: string) => (value?: string) => void;
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
                                        <StyledDropdown
                                            label={i18n.t("Binding type")}
                                            items={bindingTypeOptions()}
                                            onChange={handleChangeType(binding.id)}
                                            value={binding.type}
                                            hideEmpty
                                        />
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
                                    <TableCell>
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
                                    </TableCell>
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
        (value?: string) => {
            if (value && isEventType(value)) {
                handleChange("eventType", value);
            }
        },
        [handleChange]
    );

    return (
        <>
            <TextField
                label={i18n.t("Page identifiers")}
                onChange={event => handleChange("pageIdentifiers", event.target.value)}
                value={binding.pageIdentifiers}
            />
            <StyledDropdown
                label={i18n.t("Event type")}
                onChange={handleChangeEventType}
                value={binding.eventType}
                items={eventBindingTypeOptions()}
            />
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

export const IFrameBindingEditor: React.FC<BindingEditor<IframeBinding>> = props => {
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

const bindingTypeOptions = () => {
    return [
        { value: "event", text: "Event" },
        { value: "section", text: "Section" },
        { value: "iframe", text: "iFrame" },
    ];
};

const eventBindingTypeOptions = () => {
    return [
        { value: "click", text: "Click" },
        { value: "hover", text: "Hover" },
        { value: "all", text: "all" },
    ];
};

const FlexEnd = styled(Grid)`
    display: flex;
    justify-content: flex-end;
`;

const StyledTable = styled(Table)`
    table-layout: fixed;
`;

const StyledDropdown = styled(Dropdown)`
    margin-top: 8px;
`;
