import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Box, Toolbar, IconButton, Typography, TextField, Menu, MenuItem, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";

// Icons
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CodeIcon from '@mui/icons-material/Code';
import CodeOffIcon from '@mui/icons-material/CodeOff';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LocalLibraryOutlinedIcon from '@mui/icons-material/LocalLibraryOutlined';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import { green } from '@mui/material/colors';
import { MuiFileInput } from 'mui-file-input';
import SidekickMarkdown from './SidekickMarkdown';


import { SystemContext } from './SystemContext';
import ContentFormatter from './ContentFormatter';
import AI from './AI';
import AIPromptResponse from './AIPromptResponse';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: green[300],
    marginRight: theme.spacing(2),
  }));

const Note = ({noteOpen, setNoteOpen, appendNoteContent, loadNote, createNote, 
    closeOtherPanels, restoreOtherPanels, windowMaximized, setWindowMaximized,
    setNewPromptPart, setNewPrompt, setChatRequest, onChange, setOpenNoteId, serverUrl, token, setToken, maxWidth}) => {

    const noteRef = useRef(null);
    const newNoteName = "New Note";
    const systemPrompt = `You are DocumentGPT.
You take CONTEXT_TEXT from a document along with a REQUEST to generate more text to include in the document.
You therefore respond purely with text that would make sense to add to the context text provided along the lines of the request.
You never say anything like 'Sure', or 'Here you go:' or attempt to interact with the user or comment on being an AI model or make meta-statements about the query.
You always do your best to generate text in the same style as the context text provided that achieves what is described in the request`

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    const focusOnContent = () => {
        document.getElementById("note-content")?.focus();
    }

    const applySystemSettings = () => {
        axios.get(`${serverUrl}/system_settings/note`).then(response => {
                if ("userPromptReady" in response.data) {
                    userPromptReady.current = defaultUserPromptReady + (response.data?.userPromptReady ? " (" + response.data.userPromptReady + ")" : "");
                    setPromptPlaceholder(userPromptReady.current);
                }
                console.log("Note system settings", response.data);
        }).catch(error => {
        console.error("Error getting Chat custom settings:", error);
        });
    }

    useEffect(() => {
        applySystemSettings();
        focusOnContent();
        showReady();
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
    const [name, setName] = useState(newNoteName);
    const [previousName, setPreviousName] = useState(newNoteName);
    const defaultUserPromptReady = "What do you want to add to your note?";
    const userPromptReady = useRef(defaultUserPromptReady);
    const userPromptWaiting = "Waiting for response...";
    const [contentDisabled, setContentDisabled] = useState(false);
    const [promptDisabled, setPromptDisabled] = useState(false);
    const [promptPlaceholder, setPromptPlaceholder] = useState(userPromptReady.current);
    const [content, setContent] = useState("");
    const [noteContextMenu, setNoteContextMenu] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [promptToSend, setPromptToSend] = useState("");
    const [folder, setFolder] = useState("notes");
    const [tags, setTags] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [markdownRenderingOn, setMarkdownRenderingOn] = useState(false);
    const [userPromptEntered, setUserPromptEntered] = useState(null);
    const [userPromptToSend, setUserPromptToSend] = useState(null);
    const [streamingChatResponse, setStreamingChatResponse] = useState("");
    const streamingChatResponseRef = useRef("");
    const [AIResponse, setAIResponse] = useState("");
    const [inAILibrary, setInAILibrary] = useState(false);
    const saveStatus = useRef("");
    const noteInstantiated = useRef(false);
    const [renameInProcess, setRenameInProcess] = useState(false);


    useEffect(() => {
        if (noteInstantiated.current) {
            console.log("Note inAILibrary", inAILibrary);
            saveStatus.current = "changed";
            save();
        }
    }, [inAILibrary]);

    useEffect(() => {
        if (noteOpen && userPromptEntered) {
            let userPrompt = `Given the CONTEXT_TEXT below, provide text in the same style to add to this as specified by the provided REQUEST:

Here is the CONTEXT_TEXT:`
            if (name !== newNoteName) {
                userPrompt += `
Title: ${name}`
            }
            userPrompt += `
${content}

Here is the REQUEST:
${userPromptEntered.prompt}

Don't repeat the CONTEXT_TEXT or the REQUEST in your response. Create a response that would naturally follow on from the CONTEXT_TEXT and achieve what is described in the REQUEST.`
            console.log("Note userPrompt", userPrompt)
            setUserPromptEntered(null);
            setUserPromptToSend({prompt: userPrompt, timestamp: Date.now()});
        }
    }, [userPromptEntered]);

    useEffect(()=>{
        if(createNote) {
            create({content: createNote.content ? createNote.content : ""});
        }
    }, [createNote]);

    useEffect(() => {
        if (!noteInstantiated.current) {
            noteInstantiated.current = true; // the first time the content changes, we know the note has been instantiated
        } else {
            if (name === newNoteName && content.length > 200) {
                considerAutoNaming(content);
            }
            saveStatus.current = "changed";
        }
    }, [content]);

    useEffect(()=>{
        if(appendNoteContent.content !== "") {
            setNoteOpen({id: id, timestamp: Date.now()});
            let newNotePart = appendNoteContent.content.trim();
            if(typeof newNotePart === "string") {
                let newNote = content;
                if (newNote !== "") {
                    newNote += "\n";
                }
                newNote += newNotePart;
                setContent(newNote);
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
            noteInstantiated.current = false; // we set it to instantiated when the [content] hook runs
            setNoteOpen({id: loadNote.id, timestamp: Date.now()});
            if (loadNote.id !== null) {
                let url = `${serverUrl}/docdb/${folder}/documents/${loadNote.id}`;
                console.log("loadNote", loadNote.id);
                axios.get(url, {
                    headers: {
                        Authorization: 'Bearer ' + token
                      }
                }).then(response => {
                    saveStatus.current = "saved";
                    console.log("loadNote Response", response);
                    response.data.access_token && setToken(response.data.access_token);
                    setId(response.data.metadata.id);
                    setName(response.data.metadata.name);
                    setTags(response.data.metadata.tags);
                    setPreviousName(response.data.metadata.name);
                    setContent(response.data.content.note);
                    if ("inAILibrary" in response.data.metadata.properties) {
                        setInAILibrary(response.data.metadata.properties.inAILibrary);
                    } else {
                        setInAILibrary(false);
                    }
                    focusOnContent();
                }).catch(error => {
                    system.error(`System Error loading note.`, error, url + " GET");
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
        if (!noteOpen) {
            resetNote();
        } else {
            //focusOnContent();
        }
    }, [noteOpen]);

    useEffect(()=>{
        if (AIResponse !== "") {
            setContent( text => text + "\n" + AIResponse + "\n");
            considerAutoNaming(content);
            focusOnContent(); // this also saves the note on blur
        }
        setContentDisabled(false);
        showReady();
    },[AIResponse]);

    useEffect(()=>{
        if (promptToSend && promptToSend !== "") {
            console.log("Note promptToSend", promptToSend);
            const ai = new AI(serverUrl, token, setToken, system);
            setContentDisabled(true);
            showWaiting();
            ai.generateText(content, promptToSend).then((generatedText) => {
                setContent( text => text + "\n" + generatedText + "\n");
                setContentDisabled(false);
                showReady();
            }).catch((error) => {
                console.log(error);
                system.error(`System Error generating text.`, error, "ai.generateText");
            });
        }
    }, [promptToSend]);

    useEffect(() => {
        noteRef?.current?.scrollIntoView({ behavior: 'instant' });
    }, [windowMaximized]);

    const showReady = () => {
        setPromptDisabled(false);
        setPromptPlaceholder(userPromptReady.current);
    }

    const showWaiting = () => {
        setPromptDisabled(true);
        setPromptPlaceholder(userPromptWaiting);
        setPrompt('');
    }

    const save = () => {
        console.log("save", id, name, content);
        if (id === "") {
            // only save if there is content or the name has been changed
            if (name !== newNoteName || content !== "") {
                create({name: name, content: content});
            }
        } else {
            if (noteInstantiated.current && saveStatus.current === "changed") {
                const request = {
                    metadata: {
                        id: id,
                        name: name,
                        tags: tags,
                        properties: {
                            inAILibrary: inAILibrary,
                        },
                    },
                    content: { note: content },
                }
                let url = `${serverUrl}/docdb/${folder}/documents/${id}`;
                axios.put(url, request, {
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                }).then(response => {
                    saveStatus.current = "saved";
                    response.data.access_token && setToken(response.data.access_token);
                    if (id === "") {
                        setId(response.data.metadata.id);
                    }
                    onChange(id, name, "changed", "");
                    console.log("note save Response", response);
                }).catch(error => {
                    system.error(`System Error saving note.`, error, url + " PUT");
                });
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
        downloadFile(filename + ".txt", content);
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

    const create = ({name, content}) => {
        if (saveStatus.current === "saved" || saveStatus.current === "creating") {
            return;
        } else {
            saveStatus.current = "creating";
        }
        if (name === undefined) {
            name = newNoteName;
        }
        if (content === undefined) {
            content = "";
        }
        const noteDocument = {
            "name": name,
            "tags": tags,
            "properties": {
                "inAILibrary": inAILibrary,
           },
                "content": {
                "note": content
            }
        };
        let url = `${serverUrl}/docdb/${folder}/documents`;
        axios.post(url, noteDocument,
        {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            saveStatus.current = "saved";
            response.data.access_token && setToken(response.data.access_token);
            setId(response.data.metadata.id);
            if (name !== response.data.metadata.name) {
                setName(response.data.metadata.name);
                setPreviousName(response.data.metadata.name);
            }
            setTags(response.data.metadata.tags);
            onChange(response.data.metadata.id, response.data.metadata.name, "created", "");
            setOpenNoteId({ id: response.data.metadata.id, timestamp: Date.now()});
            system.info(`Note "${response.data.metadata.name}" created.`);
            system.debug(`Note "${response.data.metadata.name}" created.`, response, url + " POST");
        }).catch(error => {
            system.error(`System Error creating note.`, error, url + " POST");
        });
    }

    const resetNote = () => {
        saveStatus.current = "";
        setId("");
        noteInstantiated.current = false;
        setMarkdownRenderingOn(false);
        setName(newNoteName);
        setPreviousName(newNoteName);
        setTags([]);
        setContent("");
        setAIResponse('');
        setInAILibrary(false);
    }

    const deleteNote = () => {
        const idToDelete = id;
        const nameToDelete = name;
        resetNote();
        let url = `${serverUrl}/docdb/${folder}/documents/${idToDelete}`;
        axios.delete(url, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            saveStatus.current = "";
            system.info(`Note "${nameToDelete}" deleted.`);
            system.debug(`Note "${nameToDelete}" deleted.`, response, url + " DELETE");
            console.log("delete note Response", response);
            response.data.access_token && setToken(response.data.access_token);
            onChange(idToDelete, nameToDelete, "deleted", "");
            setNoteOpen(false);
            resetNote();
        }).catch(error => {
            system.error(`System Error deleting note.`, error, url + " DELETE");
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
        if (name !== newName) {
            setName(newName);
        }
        if (id === "") {
            create({name: newName, content: content});
        } else {
            let url = `${serverUrl}/docdb/${folder}/documents/${id}/rename`;
            axios.put(url, {
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
                onChange(id, name, "renamed", newName);
                system.info(`Note renamed to "${newName}".`);
            }).catch(error => {
                console.log(error);
                system.error(`System Error renaming note.`, error, url + " PUT");
            });
        }
    }

    const handleRenameNote = async () => {
        if (name !== previousName && name !== "") {
            renameNote(name);
        } else {
            setName(previousName);
        }
    }

    const handleNameBlur = async (event) => {
        await handleRenameNote();
        // rename can cause the name TextArea to be set as focus,
        // so we need to set focus back to what the user had set focus on
        event.currentTarget && event.currentTarget.focus();
    }

    const handleNameChange = (event) => {
        setName(event.target.value);
    }

    const generateNoteName = async (text) => {
        if (renameInProcess) {
            return;
        }
        setRenameInProcess(true);
        try {
            const ai = new AI(serverUrl, token, setToken, system);
            let generatedName = await ai.nameTopic(text);
            if (generatedName && generatedName !== "") { 
                await renameNote(generatedName);
            }
        } catch (error) {
            system.debug(`System Error generating note name.`, error, "generateNoteName");
        } finally {
            setRenameInProcess(false);
        }
    }

    const handleGenerateNoteName = async () => {
        generateNoteName(content);
    }

    const considerAutoNaming = async (text) => {
        if (renameInProcess || name !== newNoteName || content.trim() === "") {
            return;
        }
        generateNoteName(text);
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
        // Wait a mo for the context menu to close before checking for highlighted text
        // as it gets deselected when the context menu opens
        setTimeout(() => {
            if (window.getSelection().toString()) {
              setNoteContextMenu((prev) => ({ ...prev, selectedText: window.getSelection().toString() }));
            }
          }, 10);
    };

    const handleNoteContextMenuClose = () => {
        setNoteContextMenu(null);
    };

    const handleCopySelectedText = () => {
        const text = noteContextMenu.selectedText;
        navigator.clipboard.writeText(text);
        setNoteContextMenu(null);
    };

    const handleAppendSelectedTextToChatInput = () => {
        const text = noteContextMenu.selectedText;
        setNewPromptPart({text: text, timestamp: Date.now()});
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

    const handleAppendNoteToChatInput = () => {
        // Just get the selcted text
        setNewPromptPart({text: content, timestamp: Date.now()});
        setNoteContextMenu(null);
    };

    const handleUseNoteAsChatInput = () => {
        // Just get the selected text
        setNewPrompt({text: content, timestamp: Date.now()});
        setNoteContextMenu(null);
    };

    const handleContentKeyDown = async (event) => {
        if(event.key === 'Enter') {
            considerAutoNaming(event.target.value);
        }
    }

    const handleContentChange = (event) => {
        setContent(event.target.value);
    }

    const handleToggleMarkdownRendering = () => {
        setMarkdownRenderingOn(x => !x);
    };

    const handleToggleInAILibrary = () => {
        setInAILibrary(x => !x);
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

    const handleClose = () => {
        if (windowMaximized) {
            handleToggleWindowMaximise();
        }
        save();
        setNoteOpen(false);
    }

    const aiToolbarButtons = (<>
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
    </>);

    const render = <Card id="note-panel" ref={noteRef}
                    sx={{display: "flex", flexDirection: "column", padding: "6px", margin: "6px", height: "calc(100%-64px)", 
                        width: windowMaximized ? "calc(100vw - 12px)" : null, minWidth: "500px", maxWidth: windowMaximized ? null : maxWidth ? maxWidth : "600px", flex: 1 }}>
    <StyledToolbar className={ClassNames.toolbar} sx={{ width: "100%", gap: 1 }} >
        <EditNoteIcon/>
        <Typography sx={{mr:2}}>Note</Typography>
        <Tooltip title={ id === "" ? "You are in a new note" : "New note" }>
            <span>
                <IconButton edge="start" color="inherit" aria-label="New note"
                    disabled={id === ""} onClick={handleNewNote}
                >
                    <PlaylistAddIcon/>
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title={ markdownRenderingOn ? "Stop rendering as markdown and edit as text" : "Preview markdown and code rendering (read only)" }>
            <IconButton edge="start" color="inherit" aria-label="delete chat" onClick={handleToggleMarkdownRendering}>
                { markdownRenderingOn ? <CodeOffIcon/> : <CodeIcon/> }
            </IconButton>
        </Tooltip>
        <Tooltip title={ inAILibrary ? "Remove from AI Library" : "Add to AI library" }>
            <IconButton edge="start" color="inherit" aria-label={ inAILibrary ? "Remove from AI Library" : "Add to AI library" } onClick={handleToggleInAILibrary}>
                { inAILibrary ? <LocalLibraryIcon/> : <LocalLibraryOutlinedIcon/> }
            </IconButton>
        </Tooltip>
        <Box ml="auto">
            <Tooltip title={ "Delete note" }>
                <IconButton edge="end" color="inherit" aria-label="delete note"
                    onClick={handleDeleteNote}
                >
                    <DeleteIcon/>
                </IconButton>
            </Tooltip>
            <Tooltip title={ windowMaximized ? "Shrink window" : "Expand window" }>
                <IconButton edge="end" color="inherit" aria-label={ windowMaximized ? "Shrink window" : "Expand window" } onClick={handleToggleWindowMaximise}>
                    { windowMaximized ? <CloseFullscreenIcon/> : <OpenInFullIcon/> }
                </IconButton>
            </Tooltip>
            <IconButton onClick={handleClose}>
                <CloseIcon />
            </IconButton>
        </Box>
    </StyledToolbar>
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, 
        overflow: "auto", width: "100%", minHeight: "300px" }}>
        <Box sx={{ display: "flex", flexDirection: "row"}}>
            <TextField
                sx={{ mt: 2 , padding: "6px", flexGrow: 1}}
                id="note-name"
                autoComplete='off'
                label="Note name"
                variant="outlined"
                value={name}
                onClick={(event) => {
                        if (name === newNoteName) {
                        event.target.select();
                        }
                    }
                }
                onKeyDown={
                    (event) => {
                        if(event.key === 'Enter') {
                            focusOnContent();
                            handleRenameNote()
                            event.preventDefault();
                        } else if(event.key === 'Escape') {
                            setName("");
                            event.preventDefault();
                        }         
                    }
                }
                onBlur={(event) => { handleNameBlur(event) }}
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
            sx={{ overflow: "auto", flex: 1, width: "100%" }}
            onContextMenu={(event) => { handleNoteContextMenu(event, content, name); }}
        >
            { markdownRenderingOn
                ?
                    <Box sx={{ height: "fit-content", padding: "6px" }}>
                        <SidekickMarkdown markdown={content}/>
                    </Box>
                :
                    <TextField
                        sx={{ mt: 1, width: "100%", padding: "6px" }}
                        id="note-content"
                        label="Note content"
                        multiline
                        variant="outlined"
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleContentKeyDown}
                        onBlur={save}
                        disabled={contentDisabled}
                        />
            }
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
                <MenuItem disabled={!window.getSelection().toString()} onClick={handleCopySelectedText}>Copy selected text</MenuItem>
                <MenuItem disabled={!window.getSelection().toString()} onClick={handleAppendSelectedTextToChatInput}>Append selected text to chat input</MenuItem>
                <MenuItem onClick={handleCopyNote}>Copy note</MenuItem>
                <MenuItem onClick={handleCopyNoteAsHTML}>Copy note as html</MenuItem>
                <MenuItem onClick={handleAppendNoteToChatInput}>Append note to chat input</MenuItem>
                <MenuItem onClick={handleUseNoteAsChatInput}>Use note as chat input</MenuItem>
            </Menu>
            <Box sx={{ width: "100%" }}>
                {streamingChatResponse && streamingChatResponse !== "" && <Card id="streamingChatResponse"
                    sx={{ 
                        padding: 2, 
                        width: "100%", 
                        backgroundColor: "lightyellow",
                        cursor: "default",
                    }}
                    >
                        <Typography sx={{ whiteSpace: 'pre-wrap', width: "100%" }}>
                            {streamingChatResponse}
                        </Typography>
                    </Card>
                }
            </Box>
        </Box>
    </Box>
    <Box>
        <AIPromptResponse 
            serverUrl={serverUrl}
            token={token}
            setToken={setToken}
            streamingOn={true}
            customUserPromptReady={userPromptReady.current}
            systemPrompt={systemPrompt}
            streamingChatResponseRef={streamingChatResponseRef}
            streamingChatResponse={streamingChatResponse}
            setStreamingChatResponse={setStreamingChatResponse}
            setAIResponse={setAIResponse}
            onChange={onChange}
            setUserPromptEntered={setUserPromptEntered}
            userPromptToSend={userPromptToSend}
            setUserPromptToSend={setUserPromptToSend}
            controlName="Note Writer"
            toolbarButtons={aiToolbarButtons}
            sendButtonTooltip="Send note and prompt to AI"
            onBlur={save}
        />
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
    </Box>
</Card>
    return noteOpen ? render : null;
  }

  export default Note;