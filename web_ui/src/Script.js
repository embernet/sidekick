import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Box, Paper, Toolbar, IconButton, Typography, TextField,
    List, ListItem, Menu, MenuItem, Tooltip, Button, FormLabel, Popover
     } from '@mui/material';
import { ClassNames } from "@emotion/react";
import ScriptCell from './ScriptCell';
import { InputLabel, FormHelperText, FormControl, Select } from '@mui/material';
import { red, pink, purple, deepPurple, indigo, blue, lightBlue, cyan, teal, green, lightGreen, lime, yellow, amber, orange, deepOrange, brown, grey, blueGrey } from '@mui/material/colors';

// Icons
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import CodeOffIcon from '@mui/icons-material/CodeOff';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FileCopyIcon from '@mui/icons-material/FileCopy';

import { SystemContext } from './SystemContext';
import AI from './AI';
import { StyledBox, StyledToolbar, SecondaryToolbar } from './theme';
import SidekickMarkdown from './SidekickMarkdown';

const Script = ({ scriptOpen, setScriptOpen, ScriptIcon, darkMode, maxWidth, windowMaximized, setWindowMaximized,
    provider, modelSettings, persona, loadScript,
    closeOtherPanels, restoreOtherPanels,
    onChange, setOpenScriptId, serverUrl, token, setToken,
}) => {
    
    const panelWindowRef = useRef(null);
    const panelItemsContainerRef = useRef(null);

    const newItemName = "New Script";

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`script-panel`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    const system = useContext(SystemContext);
    const [id, setId] = useState("");
    const [name, setName] = useState(newItemName);
    const [previousName, setPreviousName] = useState(newItemName);
    const [cells, setCells] = useState([]);
    const [myPersona, setMyPersona] = useState({});

    const [markdownRenderingOn, setMarkdownRenderingOn] = useState(true);
    const [settings, setSettings] = useState({});
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const scriptLoading = useRef(false);
    const [documentType, setDocumentType] = useState("scripts");
    const [tags, setTags] = useState([]);
    const [myServerUrl, setMyServerUrl] = useState(serverUrl);

    const applyCustomSettings = () => {
        axios.get(`${serverUrl}/system_settings/script`).then(response => {
            console.log("Script custom settings:", response);
        }).catch(error => {
          console.error("Error getting Script custom settings:", error);
        });
      }

    useEffect(()=>{
        axios.get(`${serverUrl}/settings/script_settings`,{
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("script settings response", response);
            response.data.access_token && setToken(response.data.access_token);
            setSettings(response.data);
            setSettingsLoaded(true);
            reset();
        }).catch(error => {
            system.error(`System Error loading script settings.`, error, "/settings/script_settings GET");
        });
        applyCustomSettings();
    }, []);

    useEffect(()=>{
        if (scriptOpen) {
            if (!loadScript) {
                scriptLoading.current = true;
                reset();
                scriptLoading.current = false;
            }
        } else {
            closeScriptWindow();
        }
    }, [scriptOpen]);

    useEffect(()=>{
        setOpenScriptId(id);
        console.log("setOpenScriptId", id);
    }, [id]);

    useEffect(()=>{
        if (settings.hasOwnProperty("rendered")) {
            setMarkdownRenderingOn(settings.rendered);
        }
    }, [settings]);

    useEffect(()=>{
    }, [myPersona]);

    useEffect(()=>{
        console.log("usePersona", persona);
        setMyPersona(persona)
    }, [persona]);

    useEffect(() => {
        panelWindowRef?.current?.scrollIntoView({ behavior: 'instant' });
    }, [windowMaximized]);

    useEffect(()=>{
        if (loadScript) {
            reset();
            scriptLoading.current = true; // prevent saves whilst we are updating state during load
            console.log("loadScript", loadScript);
            axios.get(`${serverUrl}/docdb/${documentType}/documents/${loadScript["id"]}`, {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then(response => {
                console.log("/docdb/scripts GET Response", response);
                response.data.access_token && setToken(response.data.access_token);
                setId(response.data.metadata.id);
                setName(response.data.metadata.name);
                setPreviousName(response.data.metadata.name);
                setCells(response.data.content.cells);
                if (!scriptOpen) { setScriptOpen(true); }
                scriptLoading.current = false;
            }).catch(error => {
                scriptLoading.current = false;
                system.error(`System Error loading script.`, error, "/docdb/scripts GET");
            });
        }
    }, [loadScript]);

    useEffect(()=>{
        if (cells.length > 0 && !scriptLoading.current) {
            console.log("save script", cells.length, cells);
            if (id !== "" && id !== null) {
                save();
            } else {
                create();
            }
        }
    }, [name, cells]);

    const scriptAsObject = () => {
        let script = {
            metadata: {
                name: name,
                tags: tags,
            },
            content: {
                cells: cells,
            }
        };
        return script;
    }

    const scriptAsJSON = () => {
        let script = scriptAsObject();
        return JSON.stringify(script, null, 4);
    }

    const create = (scriptName=name) => {
        let request = {
            name: scriptName,
            tags: tags,
            content: {
                cells: cells,
            }
        };
        const url = `${serverUrl}/docdb/${documentType}/documents`;
        axios.post(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            setId(response.data.metadata.id);
            onChange(id, name, "created", "");
            system.info(`Script "${response.data.metadata.name}" created.`);
            system.debug("Script created", response, url + " POST");
            setName(scriptName); // in case of being cloned, update the name
        }).catch(error => {
            system.error(`System Error creating script`, error, url + " POST");
        });
    }

    const save = () => {
        let request = scriptAsObject();
        console.log('Save script', request);

        axios.put(`${serverUrl}/docdb/${documentType}/documents/${id}`, request, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("/docdb/save Response", response);
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "changed", "");
        }).catch(error => {
            system.error(`System Error saving script.`, error, `/docdb/${documentType}/documents/${id} PUT`);
        })
    }
    
    const handleScriptNameChange = (event) => {
        setName(event.target.value);
    }

    const handleNewScript = () => {
        reset();
    }

    const handleCloneScript = () => {
        create(name + " clone");
    }

    const renameScript = (newName) => {
        setName(newName);
        let url = `${serverUrl}/docdb/${documentType}/documents/${id}/rename`;
        axios.put(url, {
            name: newName,
        }, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            setPreviousName(name);
            onChange(id, name, "renamed", "");
            system.info(`Script renamed to "${name}".`);
            system.debug("Script renamed", response, url + " PUT");
        }).catch(error => {
            system.error(`System Error renaming script`, error, url + " PUT");
        })
    }

    const handleRenameScript = () => {
        if (!scriptLoading.current && name !== previousName && name !== "") {
            if (id === "") {
                create();
            } else {
                renameScript(name);
            }
        } else {
            setName(previousName);
        }
    }
    
    const handleClose = () => {
        setScriptOpen(false);
        setWindowMaximized(false);
    }

    const cellsAs = (format="markdown") => {
        let text = "";
        cells.forEach((cell) => {
            //TODO
        });
        return text;
    }

    const defaultNewCell = {id: Date.now(), type: "text", name: "", value: ""};

    const reset = () => {
        let scriptLoadingState = scriptLoading.current;
        scriptLoading.current = true;
        setId("");
        setName(newItemName);
        setPreviousName(newItemName);
        setCells([]);
        scriptLoading.current = scriptLoadingState;
    }

    const closeScriptWindow = () => {
        reset();
        setScriptOpen(false);
    };

    const deleteItem = () => {
        scriptLoading.current = true;
        let url = `${serverUrl}/docdb/${documentType}/documents/${id}`;
        axios.delete(url, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            system.info(`Script "${name}" deleted.`);
            system.debug("Script deleted", response, url + " DELETE");
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "deleted", "");
            closeScriptWindow();
            scriptLoading.current = false;
        }).catch(error => {
            system.error(`System Error deleting script.`, error, url + " DELETE");
            scriptLoading.current = false;
        });
    }

    const handleDeleteScript = () => {
        deleteItem()
    }

    const handleToggleMarkdownRendering = () => {
        let newSetting = !markdownRenderingOn;
        setMarkdownRenderingOn(newSetting);
    };

    const handleToggleWindowMaximise = () => {
        let x = !windowMaximized;
        if (x) {
            // pass this function so if another window is opened, this one can be unmaximised
            closeOtherPanels();
        } else {
            restoreOtherPanels();
        }
        setWindowMaximized(x);
    }

    const handleAddCell = (index) => {
        console.log("handleAddCell", index, cells)
        let newCells = [
            ...cells.slice(0, index + 1),
            { ...JSON.parse(JSON.stringify(defaultNewCell)), id: Date.now() },
            ...cells.slice(index + 1)
        ];
        console.log("newCells", newCells)
        setCells(newCells);
    };

    const toolbar =
        <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
            <ScriptIcon/>
            <Typography sx={{mr:2}}>Script</Typography>
            <Tooltip title={ id === "" ? "You are in a new Script" : "New Script" }>
                <span>
                    <IconButton edge="start" color="inherit" aria-label="menu"
                        disabled={ id === "" } onClick={handleNewScript}
                    >
                        <AddOutlinedIcon/>
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={ id === "" ? "You can clone this script once it has something in it" : "Clone this script" }>
                <span>
                    <IconButton edge="start" color="inherit" aria-label="menu"
                        disabled={ id === "" } onClick={handleCloneScript}
                    >
                        <FileCopyIcon/>
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={ markdownRenderingOn ? "Turn off markdown and code rendering" : "Turn on markdown and code rendering" }>
                <IconButton edge="start" color="inherit" aria-label="delete script" onClick={handleToggleMarkdownRendering}>
                    { markdownRenderingOn ? <CodeOffIcon/> : <CodeIcon/> }
                </IconButton>
            </Tooltip>
            <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
                <Tooltip title={ "Delete Script" }>
                    <IconButton edge="end" color="inherit" aria-label="Delete Script" onClick={handleDeleteScript}>
                        <DeleteIcon/>
                    </IconButton>
                </Tooltip>
                <Tooltip title={ windowMaximized ? "Shrink window" : "Expand window" }>
                    <IconButton edge="end" color="inherit" aria-label={ windowMaximized ? "Shrink window" : "Expand window" } onClick={handleToggleWindowMaximise}>
                        { windowMaximized ? <CloseFullscreenIcon/> : <OpenInFullIcon/> }
                    </IconButton>
                </Tooltip>
                <Tooltip title="Close window">
                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </StyledToolbar>;

const scriptName =
    <Box sx={{ display:"flex", direction: "row" }}>
        <TextField
            sx={{ mt: 2, flexGrow: 1 }}
            id="script-name"
            autoComplete='off'
            label="Script name"
            variant="outlined"
            value={name}
            onClick={(event) => {
                    if (name === newItemName) {
                    event.target.select();
                    }
                }
            }
            onKeyDown={
                (event) => {
                    if(event.key === 'Enter') {
                        handleRenameScript()
                        event.preventDefault();
                    } else if(event.key === 'Escape') {
                        setName("");
                        event.preventDefault();
                    }
                        
                }
            }
            onBlur={() => {handleRenameScript();}}
            onChange={handleScriptNameChange}
        />
    </Box>;

    const addCellControl = (index) => 
        <ListItem>
            <Box style={{width:'100%', display: 'flex', justifyContent: 'center'}}>
                <Tooltip title="Add cell">
                    <IconButton onClick={() => handleAddCell(index)}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </ListItem>

    const onDeleteCell = (id) => {
        let newCells = cells.filter((cell) => cell.id !== id);
        setCells(newCells);
    };

    const render = <Card id="script-panel" ref={panelWindowRef}
                    sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, 
                    width: windowMaximized ? "calc(100vw - 12px)" : null, minWidth: "500px", maxWidth: windowMaximized ? null : maxWidth ? maxWidth : "600px" }}>
                        {toolbar}
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        {scriptName}
        <StyledBox sx={{ overflow: 'auto', flex: 1, minHeight: "300px" }} ref={panelItemsContainerRef}>
            <List id="cells-list" onBlur={save}>
                {addCellControl(-1)}
                {
                    cells && cells.map((cell, index) => (
                        <>
                            <ListItem key={cell.id}>
                                <Box style={{width:'100%'}}>
                                    <ScriptCell id={cell.id}
                                                cells={cells} onDelete={onDeleteCell}
                                                cellType={cell["type"]}
                                                setCellType={
                                                    (type) => {
                                                        let newCells = [...cells];
                                                        newCells[index]["type"] = type;
                                                        setCells(newCells);
                                                    }
                                                }
                                                cellName={cell["name"]}
                                                setCellName={
                                                    (name) => {
                                                        let newCells = [...cells];
                                                        newCells[index]["name"] = name;
                                                        setCells(newCells);
                                                    }
                                                }
                                                cellValue={cell["value"]}
                                                setCellValue={
                                                    (value) => {
                                                        let newCells = [...cells];
                                                        newCells[index]["value"] = value;
                                                        setCells(newCells);
                                                    }
                                                }
                                                key={index} darkMode={darkMode}
                                                modelSettings={modelSettings}
                                                serverUrl={serverUrl} token={token} setToken={setToken}
                                                system={system}
                                    />
                                </Box>
                            </ListItem>
                            {addCellControl(index)}
                        </>
                    ))
                }
            </List>
        </StyledBox>
    </Box>
    <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 2, backgroundColor: darkMode ? grey[900] : grey[100] }}>
        <Typography color="textSecondary">Cells: {cells.length}</Typography>
    </Paper>
</Card>;
    return ( scriptOpen ? render : null )
  }

export default Script;