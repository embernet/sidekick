import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useState, useContext, useCallback, useRef, Fragment } from 'react';
import { Card, Box, Paper, IconButton, Typography, TextField,
    List, ListItem, Tooltip
     } from '@mui/material';
import { ClassNames } from "@emotion/react";
import ScriptCell from './ScriptCell';
import { grey } from '@mui/material/colors';
import { MuiFileInput } from 'mui-file-input';

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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';


import { SystemContext } from './SystemContext';
import { StyledBox, StyledToolbar } from './theme';

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
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
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
            axios.get(`${serverUrl}/docdb/${documentType}/documents/${loadScript["id"]}`, {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then(response => {
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

    const downloadFile = (filename, content) => {
        const element = document.createElement("a");
        const file = new Blob([content], {type: "text/plain"});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }

    const handleDownload = () => {
        // remove characters from the name that would not be accepted in a file name
        let filename = name.replace(/[^a-z0-9\-!@()[\];_] /gi, '_');
        downloadFile(filename + ".json", scriptAsJSON());
    }

    const handleUploadFile = (event) => {
        console.log("handleUploadFile", event)
        const reader = new FileReader();
        let uploadedScript = null;
        reader.onload = (event) => {
            try {
                uploadedScript = JSON.parse(event.target.result);
                reset();
                scriptLoading.current = true; // prevent saves whilst we are updating state during load
                setId("");
                setName(uploadedScript.metadata.name);
                setPreviousName(uploadedScript.metadata.name);
                setCells(uploadedScript.content.cells);
            } catch (error) {
                system.error("Error uploaded script", error);
            }
            scriptLoading.current = false;
        };
        reader.readAsText(event);
        setUploadingFile(false);
        setFileToUpload(null);
    };

    const handleUploadRequest = () => {
        setUploadingFile(true);
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

    const defaultNewCell = 
    {
        id: Date.now(),
        type: "text",
        name: "",
        parameters: {},
        value: ""
    };

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
        let newCells = [
            ...cells.slice(0, index + 1),
            { ...JSON.parse(JSON.stringify(defaultNewCell)), id: Date.now() },
            ...cells.slice(index + 1)
        ];
        setCells(newCells);
    };

    const handleMoveCellUp = (index) => {
        let newCells = [
            ...cells.slice(0, index - 1),
            cells[index],
            cells[index - 1],
            ...cells.slice(index + 1)
        ];
        setCells(newCells);
    };

    const handleMoveCellDown = (index) => {
        let newCells = [
            ...cells.slice(0, index),
            cells[index + 1],
            cells[index],
            ...cells.slice(index + 2)
        ];
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
            <Tooltip title={ "Download script" }>
                <IconButton edge="start" color="inherit" aria-label="download script" onClick={handleDownload}>
                    <FileDownloadIcon/>
                </IconButton>
            </Tooltip>
            <Tooltip title={ "Upload script" }>
                <IconButton edge="start" color="inherit" aria-label="upload script" onClick={handleUploadRequest}>
                    <FileUploadIcon/>
                </IconButton>
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
        <ListItem key={"add-cell-control-" + index}>
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
    const fileUploadBar =
    <Box>
        { uploadingFile
        ?
            <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                    <MuiFileInput value={fileToUpload} onChange={handleUploadFile} />
                <Box ml="auto">
                    <IconButton onClick={() => { setUploadingFile(false) }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>
        :
            null
        }
    </Box>;


    const render = <Card id="script-panel" ref={panelWindowRef}
                    sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, 
                    width: windowMaximized ? "calc(100vw - 12px)" : null, minWidth: "500px", maxWidth: windowMaximized ? null : maxWidth ? maxWidth : "600px" }}>
                        {toolbar}
                        {fileUploadBar}
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        {scriptName}
        <StyledBox sx={{ overflow: 'auto', flex: 1, minHeight: "300px" }} ref={panelItemsContainerRef}>
            <List id="cells-list" onBlur={save}>
                {addCellControl(-1)}
                {
                    cells && cells.map((cell, index) => (
                        <Fragment key={ "cell-add-control-group-wrapper-" + cell.id }>
                            <ListItem key={ "cell-" + cell.id }>
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
                                                cellParameters={cell["parameters"]}
                                                setCellParameters={
                                                    (parameters) => {
                                                        let newCells = [...cells];
                                                        newCells[index]["parameters"] = parameters;
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
                                                cellKey={index} darkMode={darkMode}
                                                modelSettings={modelSettings} persona={myPersona}
                                                serverUrl={serverUrl} token={token} setToken={setToken}
                                                markdownRenderingOn={markdownRenderingOn}
                                                onMoveCellUp={ index > 0 ? () => { handleMoveCellUp(index) } : null }
                                                onMoveCellDown={ index < cells.length - 1 ? () => { handleMoveCellDown(index) } : null }
                                                system={system}
                                    />
                                </Box>
                            </ListItem>
                            {addCellControl(index)}
                        </Fragment>
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