import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useState, useContext, useCallback } from 'react';
import { Card, Box, Toolbar, IconButton, Typography, TextField, Menu, MenuItem, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import SendIcon from '@mui/icons-material/Send';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { green, grey } from '@mui/material/colors';
import { MuiFileInput } from 'mui-file-input';

import { SystemContext } from './SystemContext';
import ContentFormatter from './ContentFormatter';
import AI from './AI';
import { use } from 'marked';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: green[300],
    gap: 2,
  }));

const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[300],
}));

  const Note = ({noteOpen, setNoteOpen, appendNoteContent, loadNote, createNote,
    setNewPromptPart, setChatRequest, onChange, setOpenNoteId, serverUrl, token, setToken}) => {

    const newNoteName = "New Note";

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        debounce((entries) => {
        const { width } = entries[0].contentRect;
        setWidth(width);
        }, 100),
        []
    );

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
              // The app has lost focus, save the note
              save();
            }
          };
      
          document.addEventListener("visibilitychange", handleVisibilityChange);
      
          return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
          };
    }, []);

    useEffect(() => {
        const element = document.getElementById("note-panel");
        const observer = new ResizeObserver(handleResize);
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    const system = useContext(SystemContext);
    const [id, setId] = useState("");
    const [name, setName] = useState(newNoteName);
    const [previousName, setPreviousName] = useState(newNoteName);
    const [content, setContent] = useState("");
    const [contentChanged, setContentChanged] = useState(false);
    const [noteContextMenu, setNoteContextMenu] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [promptToSend, setPromptToSend] = useState("");
    const [folder, setFolder] = useState("notes");
    const [tags, setTags] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);

    const focusOnContent = () => {
        document.getElementById("note-content")?.focus();
    }

    useEffect(()=>{
        console.log("createNote", createNote);
        if(createNote) {
            create({content: createNote.content ? createNote.content : ""});
        }
    }, [createNote]);

    useEffect(() => {
        if (name === newNoteName && content.length > 200) {
            considerAutoNaming(content);
        }
    }, [content]);

    useEffect(()=>{
        if(appendNoteContent.content !== "") {
            let newNotePart = appendNoteContent.content.trim();
            if(typeof newNotePart === "string") {
                let newNote = content;
                if (newNote !== "") {
                    newNote += "\n";
                }
                newNote += newNotePart;
                setContent(newNote);
                setContentChanged(true);
                focusOnContent();
            }
        }
    }, [appendNoteContent]);

    useEffect(()=>{
        setOpenNoteId(id);
        if (id !=="" && appendNoteContent.content !== "") {
            // If the id has just been set, it's because the note has been saved
            // If there is text in appendNoteContent, it's because the user has just appended
            // So we should consider auto naming the note
            considerAutoNaming(content);
        }
    }, [id]);

    useEffect(()=>{
        if(loadNote) {
            setNoteOpen({id: loadNote.id, timestamp: Date.now()});
            if (loadNote.id !== null) {
                console.log("loadNote", loadNote.id);
                axios.get(`${serverUrl}/docdb/${folder}/documents/${loadNote.id}`, {
                    headers: {
                        Authorization: 'Bearer ' + token
                      }
                }).then(response => {
                    console.log("loadNote Response", response);
                    response.data.access_token && setToken(response.data.access_token);
                    setId(response.data.metadata.id);
                    setName(response.data.metadata.name);
                    setTags(response.data.metadata.tags);
                    setPreviousName(response.data.metadata.name);
                    setContent(response.data.content.note);
                    setContentChanged(false); // as we just loaded it from the server
                    focusOnContent();
                }).catch(error => {
                    console.log("loadNote error", error);
                    system.error(`Error loading note: ${error}`);
                });
                // Wait for the note to load before scrolling to the top
                setTimeout(() => {
                    let c = document.getElementById("note-content")
                    if (c) {
                        c.scrollTop = 0;
                    }
                }, 0);
            }
        }
    }, [loadNote]);

    useEffect(()=>{
        if (!noteOpen && id !== "") {
            resetNote();
        }
    }, [noteOpen]);

    useEffect(()=>{
        if (promptToSend && promptToSend !== "") {
            let compoundPrompt = {
                "content": content,
                "prompt": promptToSend,
            };
            setChatRequest(compoundPrompt);
        }
    }, [promptToSend]);        
    
    const save = () => {
        if (id === "") {
            create({content: content});
        } else {
            if (contentChanged) {
                const request = {
                    metadata: {
                    id: id,
                    name: name,
                    tags: tags
                    },
                    content: { note: content },
                }
                console.log("save request", request);
                axios.put(`${serverUrl}/docdb/${folder}/documents/${id}`, request, {
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                }).then(response => {
                    response.data.access_token && setToken(response.data.access_token);
                    if (id === "") {
                        setId(response.data.metadata.id);
                    }
                    onChange(id, name, "changed", "");
                    console.log("note save Response", response);
                }).catch(error => {
                    console.error("note save error", request, error);
                    system.error(`Error saving note: ${error}`);
                });
                setContentChanged(false);
            }
        }
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
        downloadFile(filename + ".json", content);
    }

    const handleUploadFile = (event) => {
        console.log("handleUploadFile", event)
        const reader = new FileReader();
        reader.onload = (event) => {
          setContent(event.target.result);
          setContentChanged(true);
        };
        reader.readAsText(event);
        setUploadingFile(false);
        setFileToUpload(null);
    };

    const handleUploadRequest = () => {
        setUploadingFile(true);
    }

    const create = ({name, content}) => {
        if (name === undefined) {
            name = newNoteName;
        }
        if (content === undefined) {
            content = "";
        }
            axios.post(`${serverUrl}/docdb/${folder}/documents`, {
                "name": name,
                "tags": tags,
                "content": {
                    "note": content
                },
        }, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("Create note Response", response);
            response.data.access_token && setToken(response.data.access_token);
            setId(response.data.metadata.id);
            setName(response.data.metadata.name);
            setPreviousName(response.data.metadata.name);
            setTags(response.data.metadata.tags);
            setContent(response.data.content.note);
            setContentChanged(false); // as we just saved/loaded it from the server
            onChange(response.data.metadata.id, response.data.metadata.name, "created", "");
            try {
                if (content === "") {
                    let noteName = document.getElementById("note-name");
                    if (noteName) {
                        noteName.focus();
                        noteName.select();
                    }
                }
            }
            catch (error) {
                console.error("Note create, error setting focus on note name", error);
            }
            setNoteOpen({ id: response.data.metadata.id, timestamp: Date.now()});
        }).catch(error => {
            console.log("create note error", error);
            system.error(`Error creating note: ${error}`);
        });
    }

    const resetNote = (content="") => {
        setId("");
        setName(newNoteName);
        setPreviousName(newNoteName);
        setTags([]);
        setContent(content);
        setContentChanged(false); // This is now a new empty note
    }

    const deleteNote = () => {
        const idToDelete = id;
        const nameToDelete = name;
        resetNote();
        axios.delete(`${serverUrl}/docdb/${folder}/documents/${idToDelete}`, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("delete note Response", response);
            response.data.access_token && setToken(response.data.access_token);
            onChange(idToDelete, nameToDelete, "deleted", "");
            setNoteOpen(false);
        }).catch(error => {
            console.log("delete note error", error);
            system.error(`Error deleting note: ${error}`);
        });
    }

    const handleDeleteNote = () => {
        deleteNote()
    }

    const handleNewNote = () => {
        resetNote();
        focusOnContent();
    }

    const renameNote = (newName) => {
        setName(newName);
        if (id === "") {
            create({name: newName});
        } else {
            axios.put(`${serverUrl}/docdb/${folder}/documents/${id}/rename`, {
                id: id,
                name: newName,
            }, {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then(response => {
                console.log("renameNote Response", response);
                response.data.access_token && setToken(response.data.access_token);
                setPreviousName(name);
                focusOnContent();
                onChange(id, name, "renamed", newName);
            }).catch(error => {
                console.log(error);
                system.error(`Error renaming note: ${error}`);
            });
        }
    }

    const handleRenameNote = () => {
        if (name !== previousName && name !== "") {
            renameNote(name);
        } else {
            setName(previousName);
        }
        focusOnContent();
    }

    const handleNameChange = (event) => {
        setName(event.target.value);
    }

    const generateNoteName = async (text) => {
        const ai = new AI(serverUrl, token, setToken, system);
        let generatedName = await ai.nameTopic(text);
        if (generatedName && generatedName !== "") { 
            // remove surrounding quotes if they are there
            if ((generatedName.startsWith('"') && generatedName.endsWith('"'))
            || (generatedName.startsWith("'") && generatedName.endsWith("'"))) {
                generatedName = generatedName.slice(1, -1);
            }
            renameNote(generatedName);
        }
    }

    const handleGenerateNoteName = async () => {
        generateNoteName(content);
    }

    const considerAutoNaming = async (text) => {
        if (name === newNoteName) {
            generateNoteName(text);
        }
    }

    const handleNoteContextMenu = (event, note, title) => {
        event.preventDefault();
        setNoteContextMenu(
          noteContextMenu === null
            ? {
                mouseX: event.clientX + 2,
                mouseY: event.clientY - 6,
                name: name,
                note: note,
              }
            : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
              // Other native context menus might behave differently.
              // With this behavior we prevent contextmenu from the backdrop re-locating existing context menus.
              null,
        );
    };

    const handleNoteContextMenuClose = () => {
        setNoteContextMenu(null);
    };
    
    const handleCopyNote = () => {
        const selectedText = noteContextMenu.note;
        navigator.clipboard.writeText(selectedText);
        setNoteContextMenu(null);
    };

    const handleCopyNoteAsHTML = () => {
        ContentFormatter(noteContextMenu.note).copyAsHtml();
        setNoteContextMenu(null);
    }

    const handleAppendToChatInput = () => {
        // Just get the selcted text
        setNewPromptPart(noteContextMenu.note);
        setNoteContextMenu(null);
    };

    const handleUseAsChatInput = () => {
        // Just get the selected text
        //TODO to replace whole prompt
        setNewPromptPart(noteContextMenu.note);
        setNoteContextMenu(null);
    };

    const handleContentKeyDown = async (event) => {
        setContentChanged(true);
        if(event.key === 'Enter') {
            considerAutoNaming(event.target.value);
        }
    }

    const handleContentChange = (event) => {
        setContent(event.target.value);
    }

    const handleSend = (event) => {
        if(event.key === 'Enter') {
            event.preventDefault();
            console.log("handleSend", prompt);
            setPromptToSend(prompt);
            setPrompt("");
        }
    }

    const render = <Card id="note-panel" sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "400px" }}>
    <StyledToolbar className={ClassNames.toolbar}>
        <EditNoteIcon/>
        <Typography>Note</Typography>
            <Tooltip title={ id === "" ? "You are in a new note" : "New note" }>
                <span>
                    <IconButton edge="end" color="inherit" aria-label="New note"
                        disabled={id === ""} onClick={handleNewNote}
                    >
                        <PlaylistAddIcon/>
                    </IconButton>
                </span>
            </Tooltip>
                    <Box ml="auto">
            <Tooltip title={ "Delete note" }>
                <IconButton edge="start" color="inherit" aria-label="delete note"
                    onClick={handleDeleteNote}
                >
                    <DeleteIcon/>
                </IconButton>
            </Tooltip>
            <IconButton onClick={() => { setNoteOpen(false) }}>
                <CloseIcon />
            </IconButton>
        </Box>
    </StyledToolbar>
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        <Box sx={{ display: "flex", flexDirection: "row"}}>
            <TextField
                sx={{ mt: 2 , flexGrow: 1}}
                id="note-name"
                autoComplete='off'
                label="Note name"
                variant="outlined"
                value={name}
                onKeyDown={
                    (event) => {
                        if(event.key === 'Enter') {
                            handleRenameNote()
                            event.preventDefault();
                        } else if(event.key === 'Escape') {
                            setName("");
                            event.preventDefault();
                        }
                            
                    }
                }
                onBlur={() => {handleRenameNote();}}
                onChange={handleNameChange}
            />
            <Toolbar>
                <Tooltip title={ "Regenerate note name" } sx={{ ml: "auto" }}>
                    <span>
                        <IconButton edge="end" color="inherit" aria-label="regenerate note name" 
                            disabled={name === newNoteName && content === ""} onClick={handleGenerateNoteName}>
                            <ReplayIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
            </Toolbar>
        </Box>
        <Box id="content-box"
            sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}
            onContextMenu={(event) => { handleNoteContextMenu(event, content, name); }}
        >
            <TextField
                sx={{ mt: 2, width: "100%" }}
                id="note-content"
                label="Note content"
                multiline
                variant="outlined"
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleContentKeyDown}
                onBlur={save}
                />
            <Menu
                open={noteContextMenu !== null}
                onClose={handleNoteContextMenuClose}
                anchorReference="anchorPosition"
                anchorPosition={
                noteContextMenu !== null
                    ? { 
                        top: noteContextMenu.mouseY,
                        left: noteContextMenu.mouseX,
                        content: content,
                        name: name,
                        }
                    : undefined
                }
            >
                <MenuItem onClick={handleCopyNote}>Copy</MenuItem>
                <MenuItem onClick={handleCopyNoteAsHTML}>Copy as html</MenuItem>
                <MenuItem onClick={handleAppendToChatInput}>Append to chat input</MenuItem>
                <MenuItem onClick={handleUseAsChatInput}>Use as chat input</MenuItem>
            </Menu>
        </Box>
        <SecondaryToolbar className={ClassNames.toolbar}>
            <Tooltip title={ "Download note" }>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleDownload}>
                    <FileDownloadIcon/>
                </IconButton>
            </Tooltip>
            <Tooltip title={ "Upload note" }>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleUploadRequest}>
                    <FileUploadIcon/>
                </IconButton>
            </Tooltip>
            <Box ml="auto">
                <Tooltip title={ "Send note and prompt to AI" }>
                    <IconButton edge="start" color="inherit" aria-label="menu"
                        onClick={() => { setPromptToSend(prompt); }}
                    >
                        <SendIcon/>
                    </IconButton>
                </Tooltip>
            </Box>
        </SecondaryToolbar>
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
        <TextField 
            sx={{ width: "100%", mt: "auto"}}
            id="note-prompt"
            multiline 
            variant="outlined" 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            onKeyDown={handleSend}
            placeholder="Chat with your note"
        />
    </Box>
</Card>
    return noteOpen ? render : null;
  }

  export default Note;