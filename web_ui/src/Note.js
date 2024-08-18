import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Box, Toolbar, IconButton, Typography, TextField, Menu,
    ListItemIcon, MenuItem, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import { green, lightBlue, grey } from '@mui/material/colors';
import { StyledBox } from './theme';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CodeIcon from '@mui/icons-material/Code';
import CodeOffIcon from '@mui/icons-material/CodeOff';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LocalLibraryOutlinedIcon from '@mui/icons-material/LocalLibraryOutlined';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import { MuiFileInput } from 'mui-file-input';
import SidekickMarkdown from './SidekickMarkdown';
import NativeTextEditorEventHandlers from './NativeTextEditorEventHandlers';
import ShareButton from './ShareButton';
import SharedDocPanel from './SharedDocPanel';

import { SystemContext } from './SystemContext';
import { SidekickClipboardContext } from './SidekickClipboardContext';

import ContentFormatter from './ContentFormatter';
import AI from './AI';
import AIPromptResponse from './AIPromptResponse';

const Note = ({noteOpen, setNoteOpen, appendNoteContent, loadNote, createNote, darkMode,
    closeOtherPanels, restoreOtherPanels, windowMaximized, setWindowMaximized,
    setNewPromptPart, setNewPrompt, setChatRequest, onChange, setOpenNoteId, 
    modelSettings, persona, serverUrl, token, setToken, maxWidth, isMobile,
    language, languagePrompt, debugMode}) => {

    const noteMenuButtonRef = useRef(null);
    const sidekickClipboard = useContext(SidekickClipboardContext);
    const panelWindowRef = useRef(null);
    const [notePanelKey, setNotePanelKey] = useState(Date.now()); // used to force re-renders

    const StyledToolbar = styled(Toolbar)(({ theme }) => ({
        backgroundColor: darkMode ? green[900] : green[300],
        marginRight: theme.spacing(2),
    }));    
    
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

    const isEditable = () => {
        let editable = false;
        if (system.user.id === documentOwner) {
            editable = true;
        }
        return editable;
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

    const [pageLoaded, setPageLoaded] = useState(false);

    useEffect(() => {
        applySystemSettings();
        showReady();
        const handleVisibilityChange = () => {
            if (document.hidden) {
              // The app has lost focus, save the note
              save();
            }
          };
      
          document.addEventListener("visibilitychange", handleVisibilityChange);
          setPageLoaded(true);
      
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
    const [shareData, setShareData] = useState({});
    const [visibility, setVisibility] = useState("private");
    const [documentOwner, setDocumentOwner] = useState("");
    const [previousName, setPreviousName] = useState(newNoteName);
    const defaultUserPromptReady = "What do you want to add to your note?";
    const userPromptReady = useRef(defaultUserPromptReady);
    const userPromptWaiting = "Waiting for response...";
    const noteContentRef = useRef(null);
    const [contentDisabled, setContentDisabled] = useState(false);
    const [promptPlaceholder, setPromptPlaceholder] = useState(userPromptReady.current);
    const [menuPosition, setMenuPosition] = useState(null);
    const [noteContextMenu, setNoteContextMenu] = useState(null);
    const [folder, setFolder] = useState("notes");
    const [tags, setTags] = useState([]);
    const [bookmarked, setBookmarked] = useState(false);
    const [starred, setStarred] = useState(false);
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
    const [timeToSave, setTimeToSave] = useState(false);
    const [noteMarkdownRenderBuffer, setNoteMarkdownRenderBuffer] = useState("");

    const clone = () => {
        let request = {
            metadata: {
                name: name + " clone",
                tags: tags,
                properties: {
                    inAILibrary: inAILibrary, // if its in the AI library then thats probbaly why you want to clone it, so keep it in there
                    starred: false, // don't clone the starred status
                    bookmarked: false, // don't clone the bookmarked status
                    // shareData not cloned
                }
            },
            content: { note: noteContentRef.current.innerText }
        };
        const url = `${serverUrl}/docdb/${folder}/documents`;
        axios.post(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "created", "");
            system.info(`Cloned note into "${response.data.metadata.name}".`);
            system.debug("Note cloned", response, url + " POST");
            load(response.data.metadata.id);
        }).catch(error => {
            system.error(`System Error cloning chat`, error, url + " POST");
        });
    }

    const _save = () => {
        console.log("_Save", id, name, saveStatus.current);
        saveStatus.current = "saving"; 
        const request = {
            metadata: {
                name: name,
                visibility: visibility,
                tags: tags,
                properties: {
                    inAILibrary: inAILibrary,
                    starred: starred,
                    bookmarked: bookmarked,
                    shareData: shareData,
                },
            },
            content: { note: noteContentRef.current.innerText },
        }
        let url = `${serverUrl}/docdb/${folder}/documents/${id}`;
        debugMode && console.log("save request", request)
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
            saveStatus.current = "changed";
        });
    }

    const save = () => {
        if (!isEditable() || ["loading", "saving", "creating"].includes(saveStatus.current)) {
            return;
        }
        console.log("save", id, name);
        if (id === "") {
            // only save if there is content or the name has been changed
            if (name !== newNoteName || (noteContentRef?.current && noteContentRef.current.innerText !== "")) {
                create({name: name, content: noteContentRef.current.innerText});
            }
        } else {
            if (saveStatus.current === "changed") {
                _save();
            }
        }
    }

    const editorEventHandlers = new NativeTextEditorEventHandlers(
        { sidekickClipboard: sidekickClipboard, hotKeyHandlers: { "save": save }, darkMode: darkMode }
    );

    useEffect(() => {
        if (timeToSave) {
            save();
            setTimeToSave(false);
        }
    } , [timeToSave]);

    const setContent = (text) => {
        if (noteContentRef.current) {
            noteContentRef.current.innerText = text;
            setNoteMarkdownRenderBuffer(text);
            noteInstantiated.current = true;
            if (saveStatus.current === "saved") {
                saveStatus.current = "changed";
            }
            setTimeToSave(true);
        }
    }

    useEffect(() => {
        if (!noteInstantiated.current) {
            return;
        }
        if (["saved", "created"].includes(saveStatus.current)) {
            saveStatus.current = "changed";
        }
        save();
    }, [inAILibrary, starred, bookmarked, visibility, tags, shareData]);

    useEffect(() => {
        if (noteOpen && userPromptEntered) {
            let userPrompt = `Given the CONTEXT_TEXT below, provide text in the same style to add to this as specified by the provided REQUEST:

Here is the CONTEXT_TEXT:`
            if (name !== newNoteName) {
                userPrompt += `
Title: ${name}`
            }
            userPrompt += `
${noteContentRef.current.innerText}

Here is the REQUEST:
${userPromptEntered.prompt}

Don't repeat the CONTEXT_TEXT or the REQUEST in your response. Create a response that would naturally follow on from the CONTEXT_TEXT and achieve what is described in the REQUEST.`
            setUserPromptEntered(null);
            setUserPromptToSend({prompt: userPrompt, timestamp: Date.now()});
        }
    }, [userPromptEntered]);

    useEffect(()=>{
        if(createNote) {
            create({content: createNote.content ? createNote.content : ""});
        }
    }, [createNote]);

    const handleNoteContentInput = (event) => {
        if (!noteInstantiated.current) {
            noteInstantiated.current = true; // the first time the content changes, we know the note has been instantiated
            save();
        } else {
            if (name === newNoteName && noteContentRef.current.innerText.length > 200) {
                considerAutoNaming(noteContentRef.current.innerText);
            }
            saveStatus.current = "changed";
        }
    };

    useEffect(()=>{
        if (markdownRenderingOn) {
            system.warning("Note is now in markdown rendering mode. To enable edit, turn this off by clicking the markdown icon in the toolbar.");
        } else if (pageLoaded && appendNoteContent.content !== "" && noteContentRef?.current) {
            setNoteOpen({id: id, timestamp: Date.now()}); // to scroll the note into view if its off the screen
            let newNotePart = appendNoteContent.content.trim();
            if(typeof newNotePart === "string") {
                let newNote = noteContentRef.current.innerText;
                if (newNote !== "") {
                    newNote += "\n";
                }
                newNote += newNotePart;
                setContent(newNote);
                focusOnContent();
            }
        }
    }, [pageLoaded, appendNoteContent]);

    useEffect(()=>{
        setOpenNoteId(id);
        if (id !=="" && appendNoteContent.content !== "") {
            // If the id has just been set, it's because the note has been saved
            // If there is text in appendNoteContent, it's because the user has just appended
            // So we should consider auto naming the note
            noteContentRef?.current && considerAutoNaming(noteContentRef.current.innerText);
        }
    }, [id]);

    const load = (id) => {
        noteInstantiated.current = false;
        saveStatus.current = "loading";
        resetNote();
        setNoteOpen({id: id, timestamp: Date.now()});
        if (id !== null) {
            let url = `${serverUrl}/docdb/${folder}/documents/${id}`;
            console.log("loadNote", id);
            axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(response => {
                response.data.access_token && setToken(response.data.access_token);
                debugMode && console.log("loadNote Response", response);
                setId(response.data.metadata.id);
                setName(response.data.metadata.name);
                setShareData(response.data.metadata?.properties?.shareData || {});
                setDocumentOwner(response.data.metadata.user_id);
                setVisibility(response.data.metadata.visibility);
                setTags(response.data.metadata?.tags || []);
                setBookmarked(response.data.metadata?.properties?.bookmarked || false);
                setStarred(response.data.metadata?.properties?.starred || false);
                setInAILibrary(response.data.metadata?.properties?.inAILibrary || false);
                setPreviousName(response.data.metadata.name);
                setContent(response.data.content.note);
                saveStatus.current = "saved";// we know its saved because we just loaded it!
                if (isMobile) {
                    panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
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

    useEffect(()=>{
        if(loadNote) {
            load(loadNote.id);
        }
    }, [loadNote]);

    useEffect(()=>{
        // onOpen
        if (!noteOpen) {
            resetNote();
        } else {
            if (isMobile) {
                panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
            }
            //focusOnContent();
        }
    }, [noteOpen]);

    useEffect(()=>{
        if (AIResponse !== "") {
            setContent( noteContentRef.current.innerText + "\n" + AIResponse + "\n");
            considerAutoNaming(noteContentRef.current.innerText);
            save();
            focusOnContent();
        }
        setContentDisabled(false);
        showReady();
    },[AIResponse]);

    useEffect(() => {
        panelWindowRef?.current?.scrollIntoView({ behavior: 'instant' });
    }, [windowMaximized]);

    const showReady = () => {
        setPromptPlaceholder(userPromptReady.current);
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
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
        downloadFile(filename + ".txt", noteContentRef.current.innerText);
    }

    const handleUploadFile = (event) => {
        console.log("handleUploadFile", event)
        const reader = new FileReader();
        reader.onload = (event) => {
            setContent(event.target.result);
            setTimeout(() => {
                save();
            }, 500);
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
            "metadata": {
                "name": name,
                "tags": tags,
                "properties": {
                    "inAILibrary": inAILibrary,
                    "starred": starred,
                    "bookmarked": bookmarked,
                }
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
        setShareData({});
        setPreviousName(newNoteName);
        setVisibility("private");
        setDocumentOwner(system.user.id); 
        setTags([]);
        setBookmarked(false);
        setStarred(false);
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

    const handleCloneNote = () => {
        clone();
    }

    const renameNote = (newName) => {
        if (name !== newName) {
            setName(newName);
        }
        if (id === "") {
            create({name: newName, content: noteContentRef.current.innerText});
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
        noteContentRef?.current && generateNoteName(noteContentRef.current.innerText);
    }

    const considerAutoNaming = async (text) => {
        if (renameInProcess || name !== newNoteName || noteContentRef?.current?.innerText?.trim() === "") {
            return;
        }
        generateNoteName(text);
    }

    const handleMenuPanelOpen = (event) => {
        setMenuPosition({
            mouseX: event.clientX,
            mouseY: event.clientY,
        });
    };
    const handleMenuPanelClose = () => {
        setMenuPosition(null);
    };

    const handleNoteContextMenu = (event, note, title) => {
        event.preventDefault();
        setNoteContextMenu(
          noteContextMenu === null
            ? {
                mouseX: event.clientX + 2,
                mouseY: event.clientY - 6,
                name: name,
                note: noteContentRef.current.innerText,
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

    const handleCopySelection = () => {
        const markdown = noteContextMenu.selectedText;
        sidekickClipboard.write({
            html: new ContentFormatter(markdown).asHtml(),
            sidekickObject: { markdown: markdown },
        });
        setNoteContextMenu(null);
    };

    const handleCopySelectionAsText = () => {
        const text = noteContextMenu.selectedText;
        sidekickClipboard.writeText(text);
        setNoteContextMenu(null);
    };

    const handleAppendSelectedTextToChatInput = () => {
        const text = noteContextMenu.selectedText;
        setNewPromptPart({text: text, timestamp: Date.now()});
        setNoteContextMenu(null);
    };

    const handleCopyNote = () => {
        const markdown = noteContextMenu.note;
        sidekickClipboard.write({
            html: new ContentFormatter(markdown).asHtml(),
            sidekickObject: { markdown: markdown },
        });
        setNoteContextMenu(null);
    };

    const handleCopyNoteAsText = () => {
        const selectedText = noteContextMenu.note;
        sidekickClipboard.writeText(selectedText);
        setNoteContextMenu(null);
    };

    const handleCopyNoteAsHTML = () => {
        sidekickClipboard.writeText(
            new ContentFormatter(noteContextMenu.note).asHtml()
        );
        setNoteContextMenu(null);
    }

    const handleAppendNoteToChatInput = () => {
        // Just get the selcted text
        setNewPromptPart({text: noteContentRef.current.innerText, timestamp: Date.now()});
        setNoteContextMenu(null);
    };

    const handleUseNoteAsChatInput = () => {
        // Just get the selected text
        setNewPrompt({text: noteContentRef.current.innerText, timestamp: Date.now()});
        setNoteContextMenu(null);
    };

    const handleContentKeyDown = async (event) => {
        if(event.key === 'Enter') {
            considerAutoNaming(event.target.innerText);
        }
    }

    const handleContentChange = (event) => {
        setContent(event.target.value);
    }

    const handleToggleMarkdownRendering = () => {
        if (!markdownRenderingOn) {
            setNoteMarkdownRenderBuffer(noteContentRef.current.innerText);
        }
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

    const toolbar = (
    <StyledToolbar className={ClassNames.toolbar} sx={{ width: "100%", gap: 1 }} >
        <IconButton edge="start" color="inherit" aria-label="Sidekick Note Menu"
            onClick={handleMenuPanelOpen}
            disabled={promptPlaceholder === userPromptWaiting}
        >
            <EditNoteIcon/>
        </IconButton>
        <Menu
            id="menu-note"
            anchorReference="anchorPosition"
            anchorPosition={menuPosition ? { top: menuPosition.mouseY, left: menuPosition.mouseX } : undefined}
            open={Boolean(menuPosition)}
            onClose={handleMenuPanelClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <MenuItem onClick={() => { handleMenuPanelClose(); handleNewNote();}}>
                <ListItemIcon><AddOutlinedIcon/></ListItemIcon>
                New Note
            </MenuItem>
            <MenuItem onClick={() => {handleMenuPanelClose(); handleCloneNote();}} disabled={id === ""}>
                <ListItemIcon><FileCopyIcon/></ListItemIcon>
                Clone Note
            </MenuItem>
            <MenuItem onClick={() => { handleMenuPanelClose(); handleDownload();}}>
                <ListItemIcon><FileDownloadIcon/></ListItemIcon>
                Download Note
            </MenuItem>
            <MenuItem onClick={() => { handleMenuPanelClose(); handleUploadRequest();}}>
                <ListItemIcon><FileUploadIcon/></ListItemIcon>
                Upload Note
            </MenuItem>
            <MenuItem onClick={() => { handleMenuPanelClose(); handleToggleMarkdownRendering();}}>
                <ListItemIcon>{ markdownRenderingOn ? <CodeOffIcon/> : <CodeIcon/> }</ListItemIcon>
                { markdownRenderingOn ? "Turn off markdown rendering" : "Turn on markdown rendering" }
            </MenuItem>
            {
                isMobile ?  null :
                <MenuItem onClick={() => { handleMenuPanelClose(); handleToggleWindowMaximise();}}>
                    <ListItemIcon>{ windowMaximized ? <CloseFullscreenIcon/> : <OpenInFullIcon/> }</ListItemIcon>
                    { windowMaximized ? "Shrink window" : "Expand window" }
                </MenuItem>
            }
            { isEditable() &&
                <MenuItem onClick={() => { handleMenuPanelClose(); handleDeleteNote();}}>
                    <ListItemIcon><DeleteIcon/></ListItemIcon>
                    Delete Note
                </MenuItem>
            }
            <MenuItem onClick={() => { handleMenuPanelClose(); handleClose();}}>
                <ListItemIcon><CloseIcon/></ListItemIcon>
                Close Window
            </MenuItem>

        </Menu>
        <Typography sx={{mr:2}}>Note</Typography>
        <Tooltip title={ id === "" ? "You are in a new note" : "New note" }>
            <span>
                <IconButton edge="start" color="inherit" aria-label="New note"
                    disabled={id === ""} onClick={handleNewNote}
                >
                    <AddOutlinedIcon/>
                </IconButton>
            </span>
        </Tooltip>
        { isEditable() &&
            <Tooltip title={ bookmarked ? "Unbookmark this note" : "Bookmark this note"}>
                <span>
                    <IconButton edge="start" color="inherit" aria-label={bookmarked ? "Unbookmark this note" : "Bookmark this note"}
                        onClick={ () => {setBookmarked(x=>!x)} }
                    >
                        {bookmarked ? <BookmarkIcon/> : <BookmarkBorderIcon/>}
                    </IconButton>
                </span>
            </Tooltip>
        }
        { isEditable() &&
            <Tooltip title={ starred ? "Unstar this note" : "Star this note"}>
                <span>
                    <IconButton edge="start" color="inherit" aria-label={starred ? "Unstar this note" : "Star this note"}
                        onClick={ () => {setStarred(x=>!x)} }
                    >
                        {starred ? <StarIcon/> : <StarBorderIcon/>}
                    </IconButton>
                </span>
            </Tooltip>
        }
        <Tooltip title={ markdownRenderingOn ? "Stop rendering as markdown and edit as text" : "Preview markdown and code rendering (read only)" }>
            <IconButton edge="start" color="inherit" aria-label="delete chat" onClick={handleToggleMarkdownRendering}>
                { markdownRenderingOn ? <CodeOffIcon/> : <CodeIcon/> }
            </IconButton>
        </Tooltip>
        { isEditable() &&
            <Tooltip title={ inAILibrary ? "Remove from AI Library" : "Add to AI library. When you click the same library icon in the Chat Prompt Editor it will give you the option of adding notes to the context of your chat. These notes do not appear in the chat transcript but are sent to the AI every time you prompt it so it has them as context." }>
                <IconButton edge="start" color="inherit" aria-label={ inAILibrary ? "Remove from AI Library" : "Add to AI library" } onClick={handleToggleInAILibrary}>
                    { inAILibrary ? <LocalLibraryIcon/> : <LocalLibraryOutlinedIcon/> }
                </IconButton>
            </Tooltip>
        }
        { isEditable() &&
            <ShareButton
                disabled={id === ""}
                id={id} name={name} visibility={visibility} setVisibility={setVisibility}
                shareData={shareData} setShareData={setShareData} />
        }
        <Box ml="auto">
            { isEditable() &&
                <Tooltip title={ "Delete note" }>
                    <IconButton edge="end" color="inherit" aria-label="delete note"
                        onClick={handleDeleteNote}
                    >
                        <DeleteIcon/>
                    </IconButton>
                </Tooltip>
            }
            {
                !isMobile ?
                    <Tooltip title={ windowMaximized ? "Shrink window" : "Expand window" }>
                        <IconButton edge="end" color="inherit" aria-label={ windowMaximized ? "Shrink window" : "Expand window" } onClick={handleToggleWindowMaximise}>
                            { windowMaximized ? <CloseFullscreenIcon/> : <OpenInFullIcon/> }
                        </IconButton>
                    </Tooltip>
                    : null
            }
            <IconButton onClick={handleClose}>
                <CloseIcon />
            </IconButton>
        </Box>
    </StyledToolbar>
    );

    const fileUploadBar = (
        <Box>
            { uploadingFile
                ?
                    <Box sx={{ display: "flex", flexDirection: "row", width: "100%", mt: 1 }}>
                        <MuiFileInput value={fileToUpload} onChange={handleUploadFile} placeholder='Click to upload a note'/>
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
    );

    const render = <Card id="note-panel" ref={panelWindowRef} key={notePanelKey}
                    sx={{display: "flex", flexDirection: "column", padding: "6px", margin: "6px", height: "calc(100%-64px)", 
                        width: isMobile ? `${window.innerWidth}px` : (windowMaximized ? "calc(100vw - 12px)" : null),
                        minWidth: isMobile ? `${window.innerWidth}px` : "500px",
                        maxWidth: isMobile ? `${window.innerWidth}px` : (windowMaximized ? null : maxWidth ? maxWidth : "600px"), flex: 1 }}>
        {toolbar}
        {fileUploadBar}
    <StyledBox sx={{ display: "flex", flexDirection: "column", flex: 1, 
        overflow: "auto", width: "100%", minHeight: "300px" }}>
        <Box sx={{ display: "flex", flexDirection: "row"}}>
            <TextField
                sx={{ mt: 2 , flexGrow: 1, paddingBottom: "6px" }}
                id="note-name"
                autoComplete='off'
                label="Note name"
                variant="outlined"
                value={name}
                disabled={!isEditable()}
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
            <Toolbar sx={{ paddingLeft: "0px" }}>
                <Tooltip title={ "Regenerate note name" } sx={{ ml: "auto" }}>
                    <span>
                        <IconButton edge="end" color="inherit" aria-label="regenerate note name" 
                            disabled={name === newNoteName && noteContentRef?.current && noteContentRef.current.innerText === ""} onClick={handleGenerateNoteName}>
                            <ReplayIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
            </Toolbar>
        </Box>
        <StyledBox id="content-box"
            sx={{ overflow: "auto", flex: 1, width: "100%" }}
            onContextMenu={(event) => { handleNoteContextMenu(event, noteContentRef.current.innerText, name); }}
        >
            { markdownRenderingOn &&
                    <Box sx={{ height: "fit-content", padding: "6px" }}>
                        <SidekickMarkdown markdown={noteMarkdownRenderBuffer}/>
                    </Box>
            }
            <div
                id="note-content"
                ref={noteContentRef}
                label="Note content"
                contentEditable={isEditable()}
                style={{
                    ...editorEventHandlers.style,
                    display: markdownRenderingOn ? "none" : "block",
                    width: "100%",
                    height: streamingChatResponse && streamingChatResponse !== "" ? "50%" : "100%",
                    padding: "6px",
                    flexGrow: 1,
                    marginTop: "auto",
                    backgroundColor: darkMode ? grey[900] : 'white',
                    color: darkMode ? "rgba(255, 255, 255, 0.87)" : "rgba(0, 0, 0, 0.87)",
                    border: darkMode ? "1px solid rgba(200, 200, 200, 0.23)" : "1px solid rgba(0, 0, 0, 0.23)",
                }}
                onInput={handleNoteContentInput}
                onChange={handleContentChange}
                onKeyDown={ 
                    (event) => {
                        editorEventHandlers.onKeyDown(event);
                        handleContentKeyDown(event);
                        handleNoteContentInput(event);
                    }
                }
                onPaste={editorEventHandlers.onPaste}
                onBlur={() => {save()}}
                disabled={contentDisabled}
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
                        content: noteContentRef.current.innerText,
                        name: name,
                        }
                    : undefined
                }
            >
                <MenuItem disabled={!window.getSelection().toString()} onClick={handleCopySelection}>Copy selection</MenuItem>
                <MenuItem disabled={!window.getSelection().toString()} onClick={handleCopySelectionAsText}>Copy selection as text</MenuItem>
                <MenuItem disabled={!window.getSelection().toString()} onClick={handleAppendSelectedTextToChatInput}>Append selected text to chat input</MenuItem>
                <MenuItem onClick={handleCopyNote}>Copy note</MenuItem>
                <MenuItem onClick={handleCopyNoteAsText}>Copy note as text</MenuItem>
                <MenuItem onClick={handleCopyNoteAsHTML}>Copy note as html</MenuItem>
                <MenuItem onClick={handleAppendNoteToChatInput}>Append note to chat input</MenuItem>
                <MenuItem onClick={handleUseNoteAsChatInput}>Use note as chat input</MenuItem>
            </Menu>
            <Box sx={{ width: "100%", display: streamingChatResponse && streamingChatResponse !== "" ? "block" : "none" }}>
                {streamingChatResponse && streamingChatResponse !== "" && <Card id="streamingChatResponse"
                    sx={{ 
                        padding: 2, 
                        width: "100%", height: "50%", overflow: "auto",
                        backgroundColor: (darkMode ? lightBlue[900] : "lightyellow"),
                        cursor: "default",
                    }}
                    >
                        <Typography sx={{ whiteSpace: 'pre-wrap', width: "100%" }}>
                            {streamingChatResponse}
                        </Typography>
                    </Card>
                }
            </Box>
        </StyledBox>
    </StyledBox>
    <Box>
        {
            isEditable() ?
                <AIPromptResponse 
                    modelSettings={modelSettings}
                    serverUrl={serverUrl}
                    token={token}
                    setToken={setToken}
                    streamingOn={true}
                    customUserPromptReady={userPromptReady.current}
                    systemPrompt={ persona.system_prompt + "\n\n" + systemPrompt }
                    streamingChatResponseRef={streamingChatResponseRef}
                    streamingChatResponse={streamingChatResponse}
                    setStreamingChatResponse={setStreamingChatResponse}
                    setAIResponse={setAIResponse}
                    onChange={onChange}
                    setUserPromptEntered={setUserPromptEntered}
                    userPromptToSend={userPromptToSend}
                    setUserPromptToSend={setUserPromptToSend}
                    controlName="Note Writer"
                    sendButtonTooltip="Send note and prompt to AI"
                    onBlur={save}
                    darkMode={darkMode}
                    language={language}
                    languagePrompt={languagePrompt}
                    />
            :
                <SharedDocPanel type="Note" documentOwner={documentOwner} shareData={shareData} handleClone={handleCloneNote} />
        }
    </Box>
</Card>


    return noteOpen ? render : null;
  }

  export default Note;