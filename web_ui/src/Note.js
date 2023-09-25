import axios from 'axios'
import { useEffect, useState, useContext } from 'react';
import { Card, Box, Toolbar, IconButton, Typography, TextField, Menu, MenuItem, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
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

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: green[300],
    gap: 2,
  }));

const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[300],
}));

  const Note = ({noteOpen, setNoteOpen, appendNoteContent, loadNote, createNote,
    setNewPromptPart, setChatRequest, onChange, setOpenNoteId, serverUrl, token, setToken}) => {
    const system = useContext(SystemContext);
    const [id, setId] = useState("");
    const [name, setName] = useState("New Note");
    const [previousName, setPreviousName] = useState("New Note");
    const [content, setContent] = useState("");
    const [noteContextMenu, setNoteContextMenu] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [promptToSend, setPromptToSend] = useState("");
    const [folder, setFolder] = useState("notes");
    const [tags, setTags] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);

    const setContentFocus = () => {
        document.getElementById("note-content")?.focus();
    }

    useEffect(()=>{
        console.log("createNote", createNote);
        if(createNote) {
            create();
        }
    }, [createNote]);

    useEffect(()=>{
        if(appendNoteContent) {
            let newNotePart = appendNoteContent.trim();
            console.log("newNotePart", newNotePart);
            if(typeof newNotePart === "string") {
                let newNote = content.trim()
                if (newNote !== "") {
                    newNote += "\n";
                }
                newNote += newNotePart.trim();
                setContent(newNote);
                considerAutoNaming(newNote);
                setContentFocus();
            }
        }
    }, [appendNoteContent]);

    useEffect(()=>{
        setOpenNoteId(id);
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
                    setContentFocus();
                }).catch(error => {
                    console.log("loadNote error", error);
                    system.error(`Error loading note: ${error}`);
                });
                // Wait for the note to load before scrolling to the top
                setTimeout(() => {
                    document.getElementById("note-content").scrollTop = 0;
                }, 0);
            }
        }
    }, [loadNote]);

    useEffect(()=>{
        if (!noteOpen) {
            resetNote();
        }
    }, [noteOpen]);

    useEffect(()=>{
        id && save();
    }, [content]);

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
        if (id !== "") {
            const request = {
                metadata: {
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
        }
    }

    const handleNameChange = (event) => {
        setName(event.target.value);
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
        downloadFile(name + ".json", content);
    }

    const handleUploadFile = (event) => {
        console.log("handleUploadFile", event)
        const reader = new FileReader();
        reader.onload = (event) => {
          setContent(event.target.result);
        };
        reader.readAsText(event);
        setUploadingFile(false);
        setFileToUpload(null);
    };

    const handleUploadRequest = () => {
        setUploadingFile(true);
    }

    const create = () => {
            axios.post(`${serverUrl}/docdb/${folder}/documents`, {
                "name": "New Note",
                "tags": [],
                "content": {
                    "note": ""
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
            onChange(id, name, "created", "");
            try {
                document.getElementById("note-name").focus();
                document.getElementById("note-name").select();
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

    const resetNote = () => {
        setId(null);
        setName("New Note");
        setPreviousName("New Note");
        setTags([]);
        setContent("");
    }

    const deleteNote = () => {
        axios.delete(`${serverUrl}/docdb/${folder}/documents/${id}`, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("delete note Response", response);
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "deleted", "");
            setNoteOpen(null);
        }).catch(error => {
            console.log("delete note error", error);
            system.error(`Error deleting note: ${error}`);
        });
    }

    const handleDeleteNote = () => {
        deleteNote()
    }

    const handleNewNote = () => {
        create();
        setContentFocus();
    }

    const handleRenameNote = () => {
        if (name !== previousName && name !== "") {
            axios.put(`${serverUrl}/docdb/${folder}/documents/${id}/rename`, {
                id: id,
                name: name,
            }, {
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(response => {
                console.log("renameNote Response", response);
                response.data.access_token && setToken(response.data.access_token);
                setPreviousName(name);
                onChange(id, name, "renamed", "");
            }).catch(error => {
                console.log(error);
                system.error(`Error renaming note: ${error}`);
            })                                    
        } else {
            setName(previousName);
        }
        document.getElementById("note-content").focus();
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

    const considerAutoNaming = async (content) => {
        if (name === "New Note") {
            // Use AI to name the note
            const ai = new AI(serverUrl, token, setToken, system);
            let generatedName = await ai.nameTopic(content);
            // remove surrounding quotes if they are there
            if ((generatedName.startsWith('"') && generatedName.endsWith('"'))
            || (generatedName.startsWith("'") && generatedName.endsWith("'"))) {
                generatedName = generatedName.slice(1, -1);
            }
            console.log("AI named note ", generatedName);
            if (generatedName && generatedName !== "") { setName(generatedName); }
        }
    }

    const handleContentChange = async (event) => {
        if(event.key === 'Enter') {
            considerAutoNaming(event.target.value);
        }
    }

    const handleSend = (event) => {
        if(event.key === 'Enter') {
            event.preventDefault();
            console.log("handleSend", prompt);
            setPromptToSend(prompt);
            setPrompt("");
        }
    }

    const render =         <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "400px"}}>
    <StyledToolbar className={ClassNames.toolbar}>
        <EditNoteIcon/>
        <Typography>Note</Typography>
            <Tooltip title={ "New note" }>
                <IconButton edge="end" color="inherit" aria-label="new note"
                    onClick={handleNewNote}
                >
                    <PlaylistAddIcon/>
                </IconButton>
            </Tooltip>
                    <Box ml="auto">
            <Tooltip title={ "Delete note" }>
                <IconButton edge="start" color="inherit" aria-label="delete note"
                    onClick={handleDeleteNote}
                >
                    <DeleteIcon/>
                </IconButton>
            </Tooltip>
            <IconButton onClick={() => { setNoteOpen(null) }}>
                <CloseIcon />
            </IconButton>
        </Box>
    </StyledToolbar>
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        <TextField
            sx={{ mt: 2 }}
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
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleContentChange}
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