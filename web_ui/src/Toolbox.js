/*
Purpose:
    Provide a palate of buttons
Visualisation:
    A narrow filterable scrollable list
Function:
    The palate is provided with an onClick callback, which is passed to the buttons
Parameters:
    setNewPrompt: callback to provide buttons to be called when a button is clicked
    setNewPromptPart: callback to provide buttons to be called when a button is ALT+clicked
    toolboxContent
*/
import axios from 'axios'

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { debounce } from "lodash";

import { TextField, Autocomplete, ListItem, ListItemText, Card, Tooltip, IconButton, Typography, ButtonBase } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { memo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SystemContext } from './SystemContext';
import { useTheme } from '@mui/material/styles';
import { StyledList } from "./theme";
import { lightBlue, grey, blueGrey } from '@mui/material/colors';
import { StyledBox, StyledToolbar, SecondaryToolbar } from './theme';
import { ClassNames } from "@emotion/react";

import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';

const Toolbox = memo(({ toolboxOpen, setToolboxOpen, selectedToolbox, setSelectedToolbox, toolboxes, setToolboxes, onChange,
    setOpenToolboxId, serverUrl, token, setToken, setNewPrompt, setNewPromptPart, darkMode
 }) => {
    const folder = useRef("toolboxes");
    const system = useContext(SystemContext);
    const [id, setId] = useState("");
    const theme = useTheme();
    const [toolbox, setToolbox] = useState(null);

    const [buttons, setButtons] = useState({});

    const myId= uuidv4();

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        debounce((entries) => {
            if (entries && entries.length > 0) {
                setTimeout(() => {
                    setWidth(entries[0].contentRect.width);
                }, 0);
            }
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`toolbox-${myId}`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(() => {
    }, [])

    useEffect(() => {
        let toolboxName = selectedToolbox;
        if (!toolboxName) {
            toolboxName = toolboxes.metadata.properties.defaultToolbox;
            setSelectedToolbox(toolboxName);
        }
        const toolbox = toolboxes.content[toolboxName];
        setToolbox(toolbox);
    }, [selectedToolbox])

    const handleAddButton = (index) => {
    };

    const handleRemoveButton = (index) => {
    };

    const handleToolboxChange = (event, value) => {
        if (value === null) {
            return;
        }
        setSelectedToolbox(value);
    }

    const _save = () => {
        const request = toolbox;
        let url = `${serverUrl}/docdb/${folder}/documents/${id}`;
        axios.put(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            system.info(`Toolbox "${toolbox.metadata.name}" saved.`);
            console.log("Toolbox save Response", response);
        }).catch(error => {
            system.error(`System Error saving note.`, error, url + " PUT");
        });
    }

    const render = toolboxOpen ?
            <Card id={`toolbox-${myId}`} sx={{ height: "100%", width: "100%", padding: "2px", margin: "6px", }}>
                <SecondaryToolbar sx={{gap:1}} className={ClassNames.toolbar}>
                    <HomeRepairServiceIcon/>
                    <Typography>Toolbox</Typography>
                    <Tooltip title='Close Prompt Toolbox'>
                        <IconButton sx={{ml:'auto'}} onClick={()=>{setToolboxOpen(false)}}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </SecondaryToolbar>
                <Autocomplete
                disablePortal
                id="toolbox-select"
                options={Object.keys(toolboxes.content)}
                defaultValue={toolboxes.metadata.properties.defaultToolbox}
                value={selectedToolbox}
                onChange={handleToolboxChange}
                sx={{ mt: 2, mb: 0 }}
                renderOption={(props, option, { selected }) => (
                    <li {...props}>
                        <Typography noWrap={false} style={{ whiteSpace: 'normal' }}>
                            {option}
                        </Typography>
                    </li>
                )}
                renderInput={(params) => <TextField {...params} label="Toolbox" />}
            />

                <StyledList id={`toolbox-${myId}-list`} sx={{ flexGrow: 1, maxHeight: "calc(100% - 80px)", overflowY: "auto" }}>
                    { 
                        toolbox && Object.keys(toolbox.content.tools).map((toolName) => (
                            <ListItem key={toolName}>
                                <ButtonBase style={{ width: '100%' }}>
                                    <Tooltip title={toolbox.content.tools[toolName].properties?.description} placement="right" arrow>
                                        <Card sx={{ padding:"4px", cursor: "pointer",
                                            backgroundColor: darkMode ? blueGrey[800] : "lightblue", width: "100%" }}>
                                            <ListItemText
                                                onClick={(event) => {
                                                    if (event.altKey) {
                                                        setNewPromptPart(toolbox.content.tools[toolName].content.prompt);
                                                    } else {
                                                        setNewPrompt({prompt: toolbox.content.tools[toolName].content.prompt, timestamp: Date.now()});
                                                    }
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {toolName}
                                                </Typography>
                                            </ListItemText>
                                        </Card>
                                    </Tooltip>
                                </ButtonBase>
                            </ListItem>
                        ))
                    }
                </StyledList>
            </Card>
    : null;

    return render;
});

export default Toolbox;
