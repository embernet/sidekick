import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Box, Paper, Toolbar, IconButton, Typography, TextField,
    List, ListItem, Menu, MenuItem, Tooltip, Button, FormLabel, Popover
     } from '@mui/material';
import { ClassNames } from "@emotion/react";
import { InputLabel, FormHelperText, FormControl, Select } from '@mui/material';
import { lightBlue,grey, blueGrey } from '@mui/material/colors';
import { MuiFileInput } from 'mui-file-input';

// Icons
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import AddCommentIcon from '@mui/icons-material/AddComment';
import ReplayIcon from '@mui/icons-material/Replay';
import RedoIcon from '@mui/icons-material/Redo';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import CodeOffIcon from '@mui/icons-material/CodeOff';
import BuildIcon from '@mui/icons-material/Build';
import SaveIcon from '@mui/icons-material/Save';
import HelpIcon from '@mui/icons-material/Help';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import LocalLibraryOutlinedIcon from '@mui/icons-material/LocalLibraryOutlined';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import { SystemContext } from './SystemContext';
import ContentFormatter from './ContentFormatter';
import TextStatsDisplay from './TextStatsDisplay';
import AI from './AI';
import { StyledBox, StyledToolbar, SecondaryToolbar } from './theme';

import SidekickMarkdown from './SidekickMarkdown';
import NativeTextEditorEventHandlers from './NativeTextEditorEventHandlers';

const Chat = ({
    provider, modelSettings, persona, 
    closeOtherPanels, restoreOtherPanels, windowMaximized, setWindowMaximized,
    newPromptPart, newPrompt, newPromptTemplate, loadChat, setAppendNoteContent,
    focusOnPrompt, setFocusOnPrompt, chatRequest, chatOpen, noteOpen, setChatOpen, darkMode,
    temperatureText, setTemperatureText, modelSettingsOpen, toggleModelSettingsOpen, togglePersonasOpen,
    onChange, personasOpen, promptEngineerOpen, togglePromptEngineerOpen, setOpenChatId, shouldAskAgainWithPersona, serverUrl, token, setToken,
    streamingChatResponse, setStreamingChatResponse, chatStreamingOn, maxWidth }) => {
    
    const chatWindowRef = useRef(null);
    const chatMessagesContainerRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const streamingChatResponseCardRef = useRef(null);

    const newChatName = "New Chat"

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById("chat-panel");
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
    const [name, setName] = useState(newChatName);
    const [previousName, setPreviousName] = useState(newChatName);
    const defaultUserPromptReady = "Enter prompt...";
    const userPromptReady = useRef(defaultUserPromptReady);
    const userPromptWaiting = "Waiting for response...";
    const chatPromptRef = useRef(null);
    const [chatPromptIsEmpty, setChatPromptIsEmpty] = useState(true);
    const [lastPrompt, setLastPrompt] = useState("");
    const [promptToSend, setPromptToSend] = useState(false);
    const [messages, setMessages] = useState([]);
    const [promptCount, setPromptCount] = useState(0);
    const [responseCount, setResponseCount] = useState(0);
    const [messagesSize, setMessagesSize] = useState(0);
    const [myModelSettings, setMyModelSettings] = useState({});
    const [myPersona, setMyPersona] = useState({});
    const [previousPersona, setPreviousPersona] = useState({});
    const [myShouldAskAgainWithPersona, setMyShouldAskAgainWithPersona] = useState(null);

    const [newStreamDelta, setNewStreamDelta] = useState(null);
    const streamingChatResponseRef = useRef("");
    const stopStreamingRef = useRef(false);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [promptPlaceholder, setPromptPlaceholder] = useState(userPromptReady.current);
    const [messageContextMenu, setMessageContextMenu] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [markdownRenderingOn, setMarkdownRenderingOn] = useState(true);
    const [settings, setSettings] = useState({});
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const chatLoading = useRef(false);
    const [chatLoaded, setChatLoaded] = useState(false);
    const [folder, setFolder] = useState("chats");
    const [tags, setTags] = useState([]);
    const [myServerUrl, setMyServerUrl] = useState(serverUrl);
    const [promptLength, setPromptLength] = useState(0);

    // AI Library state
    const [aiLibrary, setAiLibrary] = useState([]);
    const [selectedAiLibraryFullText, setSelectedAiLibraryFullText] = useState("");
    const [selectedAiLibraryFullTextSize, setSelectedAiLibraryFullTextSize] = useState(0);
    const [selectedAiLibraryNotes, setSelectedAiLibraryNotes] = useState({});
    const [selectedAiLibraryNoteId, setSelectedAiLibraryNoteId] = useState("");
    const [aiLibraryOpen, setAiLibraryOpen] = useState(false);
    const [showOnlyNotesInAiLibrary, setShowOnlyNotesInAiLibrary] = useState(true);
    const [anchorAiLibraryHelpEl, setAnchorAiLibraryHelpEl] = useState(null);
    const aiLibraryHelpPopoverOpen = Boolean(anchorAiLibraryHelpEl);

    const handleAiLibraryHelpPopoverOpen = (event) => {
        setAnchorAiLibraryHelpEl(event.currentTarget);
      };
      
      const handleAiLibraryHelpPopoverClose = () => {
        setAnchorAiLibraryHelpEl(null);
      };

    const applyCustomSettings = () => {
        axios.get(`${serverUrl}/system_settings/chat`).then(response => {
            if ("userPromptReady" in response.data) {
                userPromptReady.current = defaultUserPromptReady + (response.data?.userPromptReady ? " (" + response.data.userPromptReady + ")" : "");
                setPromptPlaceholder(userPromptReady.current);
            }
            console.log("Chat custom settings:", response);
        }).catch(error => {
          console.error("Error getting Chat custom settings:", error);
        });
      }
        
    const setPromptFocus = () => {
        try {
            const chatPrompt = document.getElementById("chat-prompt");
            chatPrompt?.focus();
        
            // Position the cursor at the end of the text and scroll it into view
            const range = document.createRange();
            range.selectNodeContents(chatPrompt);
            range.collapse(false); // collapse to end
        
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
            chatPrompt?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } catch (error) {
            // Ignore scenarios where the cursor can't be set
        }
    }

    useEffect(()=>{
        axios.get(`${serverUrl}/settings/chat_settings`,{
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("chat settings response", response);
            response.data.access_token && setToken(response.data.access_token);
            setSettings(response.data);
            setSettingsLoaded(true);
        }).catch(error => {
            system.error(`System Error loading chat settings.`, error, "/settings/chat_settings GET");
        });
        applyCustomSettings();
    }, []);

    useEffect(()=>{
        if (chatOpen) {
            if (!loadChat) {
                reset();
            }
            loadAiLibrary();
        } else {
            closeChatWindow();
        }
    }, [chatOpen]);

    useEffect(()=>{
        setOpenChatId(id);
        console.log("setOpenChatId", id);
    }, [id]);

    useEffect(()=>{
        if (messages.length > 0) {
            if (id !== "" && id !== null) {
                save();
            } else {
                create();
            }
        }
        // recalculate prompt and response counts
        let promptCount = 0;
        let responseCount = 0;
        let messagesSize = 0;
        messages.forEach((message) => {
            messagesSize += (message?.role?.length || 0) + (message?.content?.length || 0);
            if (message.role === "user") {
                promptCount++;
            } else if (message.role === "assistant") {
                responseCount++;
            }
        });
        setPromptCount(promptCount);
        setResponseCount(responseCount);
        setMessagesSize(messagesSize);
    }, [messages]);

    useEffect(()=>{
        settings["rendered"] = markdownRenderingOn;
        if (settingsLoaded) {
            axios.put(`${serverUrl}/settings/chat_settings`, settings, {
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(response => {
                response.data.access_token && setToken(response.data.access_token);
                console.log("chat settings response", response);
            }
            ).catch(error => {
                system.error(`System Error saving chat settings.`, error, "/settings/chat_settings PUT");
                }
            )
        }
    }, [markdownRenderingOn]);

    useEffect(()=>{
        if (settings.hasOwnProperty("rendered")) {
            setMarkdownRenderingOn(settings.rendered);
        }
    }, [settings]);

    useEffect(()=>{
        setPromptFocus();
        setFocusOnPrompt(false);
    }, [focusOnPrompt]);

    useEffect(()=>{
        updateAiLibraryFullText();
    }, [selectedAiLibraryNotes]);

    useEffect(()=>{
        if (chatRequest) {
            if (typeof chatRequest === 'object' && chatRequest !== null && 'content' in chatRequest && 'prompt' in chatRequest) {
                const content = chatRequest.content;
                const request = chatRequest.prompt;
                const prompt = content + "\n\n" + request;
                sendPrompt(prompt);
            } else {
                console.error('chatRequest is not a dictionary with content and prompt');
            }
        }
    }, [chatRequest]);

    useEffect(()=>{
        setMyModelSettings(modelSettings);
        console.log("modelSettings", modelSettings);
    }, [modelSettings]);

    useEffect(()=>{
        console.log("[myPersona]", myPersona);
        setSystemPrompt(myPersona.system_prompt);
        if (myShouldAskAgainWithPersona) {
            setPromptToSend({prompt: lastPrompt, timestamp: Date.now()});
        }
    }, [myPersona]);

    useEffect(()=>{
        console.log("usePersona", persona);
        setPreviousPersona(myPersona);
        setMyPersona(persona)
    }, [persona]);

    useEffect(()=>{
        if (newPromptPart?.text) {
            if (!chatOpen) { setChatOpen(true); }
            if (streamingChatResponse !== "") {
                system.warning("Please wait for the current chat to finish loading before adding a prompt part.");
            } else {
                let newPrompt = chatPromptRef.current.innerText.trim() + " " + newPromptPart?.text?.trim() + " ";
                setChatPrompt(newPrompt);
                setPromptFocus();
            }
        }
    }, [newPromptPart]);

    useEffect(()=>{
        if (newPromptTemplate?.id) {
            if (!chatOpen) { setChatOpen(true); }
                if (streamingChatResponse !== "") {
                system.warning("Please wait for the current chat to finish loading before loading a prompt template.");
            } else {
                axios.get(`${serverUrl}/docdb/prompt_templates/documents/${newPromptTemplate["id"]}`, {
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                }).then(response => {
                    console.log("/docdb/prompt_templates GET Response:", response);
                    response.data.access_token && setToken(response.data.access_token);
                    setLastPrompt(chatPromptRef.current.innerText);
                    setChatPrompt("# " + response.data.metadata.name + "\n" + response.data.content.prompt_template);
                }).catch(error => {
                    system.error(`System Error loading prompt_template`, error, "/docdb/prompt_templates GET");
                });
            }
        }
    }, [newPromptTemplate]);

    useEffect(()=>{
        if (newPrompt?.text) {
            setChatPrompt(newPrompt.text);
            setPromptFocus();
        }
    }, [newPrompt]);

    useEffect(()=>{
        if(promptToSend) {
            showWaiting();
            setLastPrompt(promptToSend.prompt);
            sendPrompt(promptToSend.prompt);
        }
    }, [promptToSend]);

    useEffect(() => {
        chatWindowRef?.current?.scrollIntoView({ behavior: 'instant' });
    }, [windowMaximized]);

    useEffect(()=>{
        if (myShouldAskAgainWithPersona) {
            console.log("shouldAskAgainWithPersona", myShouldAskAgainWithPersona);
            setMyPersona(myShouldAskAgainWithPersona.persona);
        }
    }, [myShouldAskAgainWithPersona]);

    useEffect(()=>{
        if (shouldAskAgainWithPersona) {
            setMyShouldAskAgainWithPersona(shouldAskAgainWithPersona);
        }
    }, [shouldAskAgainWithPersona]);

    useEffect(()=>{
        if (promptPlaceholder === userPromptReady.current) {
            setPromptFocus();
        }
    }, [promptPlaceholder]);

    useEffect(()=>{
        if (newStreamDelta) {
            setStreamingChatResponse(r => r + newStreamDelta.value);
            if (newStreamDelta.done) {
                console.log("Stream complete");
                const chatResponse = streamingChatResponse;
                setStreamingChatResponse("");
                appendMessage({"role": "assistant", "content": chatResponse});
                showReady();
            }
        }
    }, [newStreamDelta]);

    useEffect(()=>{
        setChatLoaded(false); // set true in chat load callback
        if (loadChat) {
            if (streamingChatResponse !== "") {
                system.warning("Please wait for the current chat to finish loading before loading another chat.");
            } else {
                axios.get(`${serverUrl}/docdb/${folder}/documents/${loadChat["id"]}`, {
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                }).then(response => {
                    response.data.access_token && setToken(response.data.access_token);
                    setId(response.data.metadata.id);
                    setName(response.data.metadata.name);
                    setPreviousName(response.data.metadata.name);
                    setMessages(response.data.content.chat);

                    setLastPrompt("");
                    // set lastPrompt to the last user message
                    try {
                        let lastUserMessage = "";
                        response.data.content.chat.forEach((message) => {
                            if (message.role && message.role === "user") {
                                lastUserMessage = message.content;
                            }
                        });
                        setLastPrompt(lastUserMessage);
                    } catch (err) {
                        console.log(err);
                    }
                    if (!chatOpen) { setChatOpen(true); }
                }).catch(error => {
                    system.error(`System Error loading chat.`, error, "/docdb/chat GET");
                });
            }
        }
    }, [loadChat]);

    useEffect(()=>{
        // Auto-scroll during chat streaming unless the user scrolls
        const chatMessagesBottom = chatMessagesContainerRef.current.scrollTop + chatMessagesContainerRef.current.clientHeight;
        const streamingChatResponseCardBottom = chatMessagesRef.current.offsetTop + chatMessagesRef.current.clientHeight;        
        const isScrolledOffBottom = streamingChatResponseCardBottom - chatMessagesBottom > 300;
        if (!isScrolledOffBottom) {
            streamingChatResponseCardRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
    }, [streamingChatResponse]);
    
    const appendMessage = (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
        setChatOpen(true);
        setTimeout(() => {
            chatMessagesRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
        }, 0);
    }

    const showReady = () => {
        setPromptPlaceholder(userPromptReady.current);
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
        setChatPrompt("");
    }

    const create = () => {
        let request = {
            name: name,
            tags: tags,
            content: {
                chat: messages,
            }
        };
        const url = `${serverUrl}/docdb/${folder}/documents`;
        axios.post(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            setId(response.data.metadata.id);
            onChange(id, name, "created", "");
            system.info(`Chat "${response.data.metadata.name}" created.`);
            system.debug("Chat created", response, url + " POST");
        }).catch(error => {
            system.error(`System Error creating chat`, error, url + " POST");
        });
    }

    const loadAiLibrary = () => {
        axios.get(`${serverUrl}/docdb/notes/documents`, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            response.data.documents.sort((a, b) => (a.name > b.name) ? 1 : -1);
            setAiLibrary(response.data.documents);
        }).catch(error => {
            system.error(`System Error loading Chat AI Library.`, error, "/docdb/notes/documents GET");
        });
    };

    const clone = () => {
        let request = {
            name: name + " clone",
            tags: tags,
            content: {
                chat: messages,
            }
        };
        const url = `${serverUrl}/docdb/${folder}/documents`;
        axios.post(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            setId(response.data.metadata.id);
            setName(response.data.metadata.name);
            onChange(id, name, "created", "");
            system.info(`Cloned chat into "${response.data.metadata.name}".`);
            system.debug("Chat cloned", response, url + " POST");
        }).catch(error => {
            system.error(`System Error cloning chat`, error, url + " POST");
        });
    }

    const chatAsObject = () => {
        let chat = {
            metadata: {
                name: name,
                tags: [],
            },
            content: {
                chat: messages,
            }
        };
        return chat;
    }

    const chatAsJSON = () => {
        let chat = chatAsObject();
        return JSON.stringify(chat, null, 4);
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
        downloadFile(filename + ".json", chatAsJSON());
    }

    const handleUploadFile = (event) => {
        console.log("handleUploadFile", event)
        const reader = new FileReader();
        let uploadedChat = null;
        reader.onload = (event) => {
            try {
                uploadedChat = JSON.parse(event.target.result);
                reset();
                chatLoading.current = true; // prevent saves whilst we are updating state during load
                if (uploadedChat?.metdata && uploadedChat.metadata.hasOwnProperty("name")) {
                    setName(uploadedChat.metadata.name);
                } else {
                    reset();
                    throw new Error("No chat name found in file being uploaded.");
                }
                setPreviousName(uploadedChat.metadata.name);

                if (uploadedChat?.metadata && uploadedChat.metadata.hasOwnProperty("tags")) {
                    setTags(uploadedChat.metadata.tags);
                } else {
                    reset();
                    throw new Error("No tags found in chat file being uploaded.");
                }

                if (uploadedChat?.content && uploadedChat.content.hasOwnProperty("chat")) {
                    setMessages(uploadedChat.content.chat);
                } else {
                    reset();
                    throw new Error("No chat found in chat file being uploaded.");
                }
            } catch (error) {
                system.error("Error uploaded chat. Are you sure it is a Chat file?", error);
            }
            chatLoading.current = false;
        };
        reader.readAsText(event);
        setUploadingFile(false);
        setFileToUpload(null);
    };

    const handleUploadRequest = () => {
        setUploadingFile(true);
    }

    const save = () => {
        if (!chatLoaded) {
            setChatLoaded(true);
            return; // don't save on load, just on change
        }
        let request = chatAsObject();

        axios.put(`${serverUrl}/docdb/${folder}/documents/${id}`, request, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "changed", "");
        }).catch(error => {
            system.error(`System Error saving chat.`, error, `/docdb/${folder}/documents/${id} PUT`);
        })
    }

    const closeChatStream = (message) => {
        let chatResponse = streamingChatResponseRef.current;
        if (message) {
            chatResponse += "\n\n" + message;
        }
        streamingChatResponseRef.current = "";
        setStreamingChatResponse("");
        if (chatResponse !== "") {
            appendMessage({"role": "assistant", "content": chatResponse});
        }
        showReady();
    }

    const getChatStream = useCallback(async (requestData) => {
            try {
                const url = `${serverUrl}/chat/v2`;
                const request = {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                    },
                    body: JSON.stringify(requestData),
                };

                system.debug("getChatStream Request", request, url + " POST");
                const response = await fetch(url , request);
                if (response.status !== 200) {
                    system.error(`System Error reading chat stream: ${response.status} ${response?.reason}`, response, "/chat/v2 POST");
                    showReady();
                    return;
                }
                system.debug("getChatStream Response", response, url + " POST");
            
                let decoder = new TextDecoderStream();
                if (!response.body) return;
                const reader = response.body
                    .pipeThrough(decoder)
                    .getReader();
                try {
                    while (!stopStreamingRef.current) {
                        var {value, done} = await reader.read();
                        if (value) { 
                            streamingChatResponseRef.current += value;
                            let numChars = value.length;
                            setMessagesSize(x => x + numChars);
                            setStreamingChatResponse(streamingChatResponseRef.current);
                        }
                        if (done || stopStreamingRef.current) {
                            if (stopStreamingRef.current) { 
                                closeChatStream("\n\n(Chat stopped by user)")
                            } else {
                                closeChatStream();
                            }
                            reader.releaseLock();
                            break;
                        }
                    }
                    stopStreamingRef.current = false;
                } catch(error) {
                    system.error(`System Error reading chat stream.`, error, "/chat/v2 POST");
                    closeChatStream("\n\n(Response truncated due to error in chat stream)");
                    reader.releaseLock();
                } finally {
                    showReady();
                    reader.releaseLock();
                }
            } catch (error) {
                system.error(`System Error reading chat stream.`, error, "/chat/v2 POST");
                showReady();
        }

    }, [stopStreamingRef.current]);

    const updateAiLibraryFullText = () => {
        let fullText = "";
        let notesSize = 0;
        Object.values(selectedAiLibraryNotes).forEach((note) => {
            fullText += "KNOWLEDGE_ARTICLE_TITLE:" + note.metadata.name + "\nKNOWLEDGE_ARTICLE_CONTENT:\n" + note.content.note + "\n\n";
            notesSize += note.content.note.length;
        });
        setSelectedAiLibraryFullText(fullText);
        setSelectedAiLibraryFullTextSize(notesSize);
    }

    const sendPrompt = async (prompt) => {
        showWaiting();
        // setup as much of the request as we can before calling appendMessage
        // as that will wait for any re-rendering and the id could change in that time
        let knowledgePrompt = "";
        if (selectedAiLibraryFullText !== "") {
            knowledgePrompt = "Given the following knowledge articles:\n\n" + selectedAiLibraryFullText + 
            `\n\nRespond to the following prompt (if there is not enough information in the knowledge articles to
            respond then say so and give your best response):\n\n`;
        }
        let requestData = {
            model_settings: myModelSettings,
            system_prompt: systemPrompt,
            prompt: knowledgePrompt + prompt,
            id: id,
            name: name,
            persona: myPersona,
        };
        appendMessage({"role": "user", "content": prompt});
        // add the messages as chatHistory but remove the sidekick metadata       
        requestData.chatHistory = messages.map((message) => {
            let newMessage = {...message};
            delete newMessage.metadata;
            return newMessage;
        }
        );

        if (myShouldAskAgainWithPersona) {
            setMyShouldAskAgainWithPersona(null);
            setMyPersona(persona);
        }

        // Get GPT to name the chat based on the content of the first message
        if (name === newChatName) {
            try {
                // Use AI to name the chat
                const ai = new AI(serverUrl, token, setToken, system);
                let generatedName = await ai.nameTopic(requestData.prompt);
                if (generatedName && generatedName !== "" && name === newChatName) { setName(generatedName); }
            } catch (err) {
                system.error("System Error auto-naming chat", err, "ai.nameTopic");
            }
        }
        getChatStream(requestData);
    }

    const handleChatPromptInput = (event) => {
        setChatPromptIsEmpty(!event.target.textContent)
    }

    const handleChatPromptKeydown = (event) => {
        setPromptLength(chatPromptRef.current.innerText.length);
        if(event.key === 'Enter'  && !event.shiftKey && chatPromptRef.current.innerText !== "") {
            setLastPrompt(chatPromptRef.current.innerText);
            setPromptToSend({prompt: chatPromptRef.current.innerText, timestamp: Date.now()});
            event.preventDefault();
        } else if(event.key === 'Escape') {
            setChatPrompt("");
            event.preventDefault();
        }
    }

    const setChatPrompt = (text) => {
        if (chatPromptRef.current) {
            chatPromptRef.current.innerText = text;
            setChatPromptIsEmpty(text === "");
            setPromptLength(text.length);
        }
    }

    const handleRegenerateChatName = async () => {
        const ai = new AI(serverUrl, token, setToken, system);
        let generatedName = await ai.nameTopic(messagesAs("text"));
        if (generatedName && generatedName !== "") { 
            system.info(`Generated name for chat: "${generatedName}".`);
            renameChat(generatedName);
        }
    }

    const handleStopStreaming = (event) => {
        console.log("handleStopStreaming");
        stopStreamingRef.current = true;
        // wait a second and then close the chat stream
        setTimeout(() => {
            closeChatStream(); console.log("closeChatStream");
        }, 1000);
    }

    const handleAskAgain = () => {
        if (lastPrompt) {
            sendPrompt(lastPrompt);
        }
    }

    const handleReload = () => {
        setChatPrompt(lastPrompt);
    }

    const extractNameFromPrompt = (prompt) => {
        if (prompt.startsWith("# ")) {
          const newlineIndex = prompt.indexOf("\n");
          if (newlineIndex !== -1 && newlineIndex > 2 && newlineIndex < 50) {
            return prompt.substring(2, newlineIndex).trim();
          }
        }
        return null;
    };

    const handleSavePromptAsTemplate = () => {
        const promptTemplateName = extractNameFromPrompt(chatPromptRef.current.innerText);
        if (promptTemplateName) {
            const url = `${serverUrl}/docdb/prompt_templates/documents`;
            axios.post(url, {
                "name": promptTemplateName,
                "tags": [],
                "content": {
                    "prompt_template": chatPromptRef.current.innerText.replace(/^.*?\n/, '')
                },
            }, {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then(response => {
                response.data.access_token && setToken(response.data.access_token);
                onChange(response.data.metadata.id, response.data.metadata.name, "created", "promptTemplate");
                system.info(`Prompt template "${response.data.metadata.name}" created.`);
                system.debug("Prompt template created", response, "/docdb/prompt_templates/documents POST");
            }).catch(error => {
                system.error(`System Error creating prompt template.`, error, url + " POST");
            });
        } else {
            system.warning("Failed to save prompt template: Please start your prompt template with a heading on the first line, e.g. # My Prompt Template (press Shift+Return to enter a newline). Prompt template not saved.");
        }
    }
    
    const handleTitleChange = (event) => {
        setName(event.target.value);
    }

    const handleNewChat = () => {
        reset();
        setPromptFocus();
    }

    const handleCloneChat = () => {
        clone(name + " clone");
    }

    const renameChat = (newName) => {
        setName(newName);
        let url = `${serverUrl}/docdb/${folder}/documents/${id}/rename`;
        axios.put(url, {
            name: newName,
        }, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            setPreviousName(name);
            setPromptFocus();
            onChange(id, name, "renamed", "");
            system.info(`Chat renamed to "${name}".`);
            system.debug("Chat renamed", response, url + " PUT");
        }).catch(error => {
            system.error(`System Error renaming chat`, error, url + " PUT");
        })
    }

    const handleRenameChat = () => {
        if (name !== previousName && name !== "") {
            if (id === "") {
                create();
            } else {
                renameChat(name);
            }
        } else {
            setName(previousName);
        }
        setPromptFocus();
    }
    
    const handleMessageContextMenu = (event, message, index) => {
        event.preventDefault();
        setMessageContextMenu(
          messageContextMenu === null
            ? {
                mouseX: event.clientX + 2,
                mouseY: event.clientY - 6,
                message: message,
                index: index,
              }
            : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
              // Other native context menus might behave differently.
              // With this behavior we prevent contextmenu from the backdrop re-locating existing context menus.
              null,
        );
    };

    const handleMessageContextMenuClose = () => {
        setMessageContextMenu(null);
    };

    const handleCopyHighlightedText = () => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const text = range.toString();
        navigator.clipboard.writeText(text);
        setMessageContextMenu(null);
    };
    
    const handleCopyMessageAsText = () => {
        const selectedText = messageContextMenu.message.content;
        navigator.clipboard.writeText(selectedText);
        setMessageContextMenu(null);
    };

    const handleClose = () => {
        setChatOpen(false);
        setWindowMaximized(false);
    }

    const messagesAs = (format="markdown") => {
        let text = "";
        messages.forEach((message) => {
            let role = message.role.charAt(0).toUpperCase() + message.role.slice(1)
            if (format === "markdown") {
                text += `**${role}:**\n\n`;
            } else {
                text += role + ":\n\n" 
            }
            text += message.content + "\n\n\n";
        });
        return text;
    }

    const handleCopyAllAsText = () => {
        navigator.clipboard.writeText(messagesAs("text"));
        setMessageContextMenu(null);
    };

    const handleCopyMessageAsHTML = () => {
        new ContentFormatter(messageContextMenu.message.content).copyAsHtml();
        setMessageContextMenu(null);
    };

    const handleCopyAllAsHTML = () => {
        let html = messagesAs("markdown");
        new ContentFormatter(html).copyAsHtml();
        setMessageContextMenu(null);
    };

    const reset = () => {
        let chatLoadingState = chatLoading.current;
        chatLoading.current = true;
        setId("");
        setName(newChatName);
        setPreviousName(newChatName);
        setMessages([]);
        setChatPrompt("");
        setLastPrompt("");
        chatLoading.current = chatLoadingState;
    }

    const closeChatWindow = () => {
        reset();
        setChatOpen(false);
    };

    const deleteChat = () => {
        let url = `${serverUrl}/docdb/${folder}/documents/${id}`;
        axios.delete(url, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            system.info(`Chat "${name}" deleted.`);
            system.debug("Chat deleted", response, url + " DELETE");
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "deleted", "");
            closeChatWindow();
        }).catch(error => {
            system.error(`System Error deleting chat.`, error, url + " DELETE");
        });
    }

    const handleDeleteChat = () => {
        deleteChat()
    }

    const handleDeleteThisMessage = () => {
        const updatedMessages = messages.filter((message, index) => index !== messageContextMenu.index);
        setMessages(updatedMessages);
        setMessageContextMenu(null);
    };

    const handleDeleteThisAndPreviousMessage = () => {
        const updatedMessages = messages.filter((message, index) => index !== messageContextMenu.index);
        if (messageContextMenu.index > 0) {
            updatedMessages.splice(messageContextMenu.index - 1, 1);
        }
        setMessages(updatedMessages);
        setMessageContextMenu(null);
    };

    const handleDeleteAllMessages = () => {
        setMessages([]);
        setMessageContextMenu(null);
    };

    const handleUseAsChatInput = () => {
        setChatPrompt(messageContextMenu.message.content);
        setMessageContextMenu(null);
    };

    const handleAppendToChatInput = () => {
        let newPrompt = chatPromptRef.current.innerText.trim() + " " + messageContextMenu.message.content.trim();
        setChatPrompt(newPrompt);
        setPromptFocus();
        setMessageContextMenu(null);
    };

    const handleAppendToNote = () => {
        setAppendNoteContent({ content: messageContextMenu.message.content, timestamp: Date.now() });
        setMessageContextMenu(null);
    };

    const handleAppendAllToNote = () => {
        let newNoteContent = "";
        messages.forEach((message) => {
            newNoteContent += message.content + "\n\n";
        });
        setAppendNoteContent({ content: newNoteContent, timestamp: Date.now() });
        setMessageContextMenu(null);
    };

    const handleToggleMarkdownRendering = () => {
        let newSetting = !markdownRenderingOn;
        setMarkdownRenderingOn(newSetting);
    };

    const handleToggleAILibraryOpen = () => {
        if (aiLibraryOpen) {
            setAiLibraryOpen(false);
        } else {
            loadAiLibrary();
            setAiLibraryOpen(true);
        }
    }

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

    const handleloadKnowledgeToAi = (event) => {
        const noteStub = event.target.value;
        if (noteStub && noteStub.id) {
            system.info(`Chat loading knowledge to AI: "${noteStub.name}"`);
            system.debug("Chat loading knowledge to AI", noteStub);
            let url = `${serverUrl}/docdb/notes/documents/${noteStub.id}`;
            axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(response => {
                response.data.access_token && setToken(response.data.access_token);
                const aiLibraryNote = response.data;
                const updatedSelectedAiLibraryNotes = { ...selectedAiLibraryNotes, [aiLibraryNote.metadata.id]: aiLibraryNote };
                setSelectedAiLibraryNotes(updatedSelectedAiLibraryNotes);
                // reset the Select component
                setSelectedAiLibraryNoteId("");
            }).catch(error => {
                console.log("Chat AI library note load error", error);
                system.error(`System Error loading Chat AI library note`, error, url);
            });
        }
    }

    const handleUnloadKnowledgeFromAi = (id) => {
        if (id && id in selectedAiLibraryNotes) {
            system.info(`Chat unloading knowledge from AI: "${selectedAiLibraryNotes[id].metadata.name}"`);
            system.debug("Chat unloading knowledge from AI", selectedAiLibraryNotes[id].metadata);
            const updatedSelectedAiLibraryNotes = { ...selectedAiLibraryNotes };
            delete updatedSelectedAiLibraryNotes[id];
            setSelectedAiLibraryNotes(updatedSelectedAiLibraryNotes);
        }
    }
    
    const editorEventHandlers = new NativeTextEditorEventHandlers(
        { hotKeyHandlers: { "save": save }, darkMode: darkMode }
    );
    
    const toolbar =
    <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
        <CommentIcon/>
        <Typography sx={{mr:2}}>Chat</Typography>
        <Tooltip title={ id === "" ? "You are in a new chat" : "New chat"}>
            <span>
                <IconButton edge="start" color="inherit" aria-label="menu"
                    disabled={ id === "" } onClick={handleNewChat}
                >
                    <AddCommentIcon/>
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title={ id === "" ? "You can clone this chat once it has something in it" : "Clone this chat" }>
            <span>
                <IconButton edge="start" color="inherit" aria-label="clone chat"
                    disabled={ id === "" } onClick={handleCloneChat}
                >
                    <FileCopyIcon/>
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title={ "Download chat" }>
            <IconButton edge="start" color="inherit" aria-label="download chat" onClick={handleDownload}>
                <FileDownloadIcon/>
            </IconButton>
        </Tooltip>
        <Tooltip title={ "Upload chat" }>
            <IconButton edge="start" color="inherit" aria-label="upload chat" onClick={handleUploadRequest}>
                <FileUploadIcon/>
            </IconButton>
        </Tooltip>
        <Tooltip title={ markdownRenderingOn ? "Turn off markdown and code rendering" : "Turn on markdown and code rendering" }>
            <IconButton edge="start" color="inherit" aria-label="delete chat" onClick={handleToggleMarkdownRendering}>
                { markdownRenderingOn ? <CodeOffIcon/> : <CodeIcon/> }
            </IconButton>
        </Tooltip>
        <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
            <Tooltip title={ "Delete chat" }>
                <IconButton edge="end" color="inherit" aria-label="delete chat" onClick={handleDeleteChat}>
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

    const fileUploadBar =
    <Box>
        { uploadingFile
        ?
            <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                    <MuiFileInput value={fileToUpload} onChange={handleUploadFile} placeholder='Click to upload a chat'/>
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

    const render = <Card id="chat-panel" ref={chatWindowRef}
                    sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, 
                    width: windowMaximized ? "calc(100vw - 12px)" : null, minWidth: "500px", maxWidth: windowMaximized ? null : maxWidth ? maxWidth : "600px" }}>
    {toolbar}
    {fileUploadBar}
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        <Box sx={{ display:"flex", direction: "row" }}>
            <TextField
                sx={{ mt: 2, flexGrow: 1, paddingBottom: "6px" }}
                id="chat-name"
                autoComplete='off'
                label="Chat name"
                variant="outlined"
                value={name}
                onClick={(event) => {
                        if (name === newChatName) {
                        event.target.select();
                        }
                    }
                }
                onKeyDown={
                    (event) => {
                        if(event.key === 'Enter') {
                            handleRenameChat()
                            event.preventDefault();
                        } else if(event.key === 'Escape') {
                            setName("");
                            event.preventDefault();
                        }
                            
                    }
                }
                onBlur={() => {handleRenameChat();}}
                onChange={handleTitleChange}
            />
            <Toolbar sx={{ paddingLeft: "0px" }}>
                <Tooltip title={ "Regenerate chat name" } sx={{ ml: "auto" }}>
                    <span>
                        <IconButton edge="end" color="inherit" aria-label="regenerate chat name" 
                            disabled={name === newChatName} onClick={handleRegenerateChatName}>
                            <ReplayIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
            </Toolbar>
        </Box>
        <StyledBox sx={{ overflow: 'auto', flex: 1, minHeight: "300px" }} ref={chatMessagesContainerRef}>
            <List id="message-list" ref={chatMessagesRef}>
                {messages && messages.map((message, index) => (
                    <ListItem sx={{ paddingLeft: 0 }} key={index}>
                        <Box style={{width:'100%'}} onContextMenu={(event) => { handleMessageContextMenu(event, message, index); }}>
                            <Card sx={{ 
                                padding: 2, 
                                width: "100%", 
                                backgroundColor: message.role === "user" ? (darkMode ? blueGrey[800] : "lightblue") : (darkMode ? lightBlue[900] : "lightyellow"),
                                cursor: message.role === "user" ? "pointer" : "default",
                            }}
                            onClick={() => message.role === "user" && setChatPrompt(message.content)}
                        >
                                {
                                    markdownRenderingOn
                                    ?
                                        <SidekickMarkdown  markdown={message.content}/>
                                    :
                                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                            {message.content}
                                        </Typography>
                                }
                            </Card>
                            <Menu
                                open={messageContextMenu !== null}
                                onClose={handleMessageContextMenuClose}
                                anchorReference="anchorPosition"
                                anchorPosition={
                                messageContextMenu !== null
                                    ? { 
                                        top: messageContextMenu.mouseY,
                                        left: messageContextMenu.mouseX,
                                        message: message,
                                        index: index,
                                    }
                                    : undefined
                                }
                            > 
                                <MenuItem disabled={!window.getSelection().toString()} onClick={handleCopyHighlightedText}>Copy highlighted text</MenuItem>
                                <MenuItem onClick={handleCopyMessageAsText}>Copy message as text</MenuItem>
                                <MenuItem onClick={handleCopyAllAsText}>Copy all as text</MenuItem>
                                <MenuItem onClick={handleCopyMessageAsHTML}>Copy message as html</MenuItem>
                                <MenuItem onClick={handleCopyAllAsHTML}>Copy all as html</MenuItem>
                                <MenuItem divider />
                                <MenuItem onClick={handleAppendToChatInput}>Append message to chat input</MenuItem>
                                <MenuItem onClick={handleUseAsChatInput}>Use message as chat input</MenuItem>
                                <MenuItem divider />
                                <MenuItem disabled={!noteOpen} onClick={handleAppendToNote}>Append message to note</MenuItem>
                                <MenuItem disabled={!noteOpen} onClick={handleAppendAllToNote}>Append all to note</MenuItem>
                                <MenuItem divider />
                                <MenuItem onClick={handleDeleteThisMessage}>Delete this message</MenuItem>
                                <MenuItem onClick={handleDeleteThisAndPreviousMessage}>Delete this and previous message</MenuItem>
                                <MenuItem onClick={handleDeleteAllMessages}>Delete all messages</MenuItem>
                            </Menu>
                        </Box>
                    </ListItem>
                ))}
                {streamingChatResponse && streamingChatResponse !== "" && 
                <ListItem id="streamingChatResponse">
                    <Card id="streaming-response-message" sx={{ 
                        padding: 2, 
                        width: "100%", 
                        backgroundColor: darkMode ? lightBlue[900] : "lightyellow",
                        cursor: "default",
                    }}
                    >
                        <Typography sx={{ whiteSpace: 'pre-wrap' }} ref={streamingChatResponseCardRef}>
                            {streamingChatResponse}
                        </Typography>
                    </Card>
                </ListItem>}
            </List>
        </StyledBox>
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "128px" }}>
            <SecondaryToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
                <Typography sx={{mr:2}}>Prompt Editor</Typography>
                <Tooltip title={ promptEngineerOpen ? "Hide Prompt Engineer" : "Show Prompt Engineer"}>
                    <IconButton edge="start" color="inherit" aria-label="prompt engineer" onClick={togglePromptEngineerOpen}>
                        <BuildIcon/>
                    </IconButton>
                </Tooltip>
                <Tooltip title={ "Save prompt as template" }>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label="save prompt as template"
                            disabled={promptPlaceholder === userPromptWaiting} onClick={handleSavePromptAsTemplate}>
                            <SaveIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={ aiLibraryOpen ? "Hide AI Library" : `Show AI Library (${Object.keys(selectedAiLibraryNotes).length} knowledge notes loaded)`}>
                    <IconButton edge="start" color="inherit" aria-label={ aiLibraryOpen ? "Hide AI Library" : "Show AI Library"}
                        onClick={handleToggleAILibraryOpen}>
                        { Object.keys(selectedAiLibraryNotes).length === 0 ? <LocalLibraryOutlinedIcon/> : <LocalLibraryIcon/> }
                    </IconButton>
                </Tooltip>
                <Tooltip title={ "Ask again" }>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label="Ask again" 
                            disabled={promptPlaceholder === userPromptWaiting} onClick={handleAskAgain}>
                            <ReplayIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={ "Reload last prompt for editing" }>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label="Reload last prompt for editing"
                            disabled={promptPlaceholder === userPromptWaiting} onClick={handleReload}>
                            <RedoIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Box ml="auto">
                    {streamingChatResponse !== "" && <Tooltip title={ "Stop" }>
                        <span>
                            <IconButton id="chat-stop" edge="end" color="inherit" aria-label="stop"
                                onClick={() => { handleStopStreaming(); }}
                            >
                                <StopCircleIcon/>
                            </IconButton>
                        </span>
                    </Tooltip>}
                    <TextStatsDisplay name="Prompt" sizeInCharacters={promptLength} maxTokenSize={myModelSettings.contextTokenSize}/>
                    <Tooltip title={ "Send prompt to AI" }>
                        <span>
                            <IconButton edge="end" color="inherit" aria-label="send" disabled={promptPlaceholder === userPromptWaiting}
                                onClick={() => { setPromptToSend({prompt: chatPromptRef.current.innerText, timestamp: Date.now()}); }}
                            >
                                <SendIcon/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </SecondaryToolbar>
            <div
                // Using a div with a reference to the DOM element instead of TextField for performance reasons
                // For large text content, TextField lag in rendering individual key strokes is unacceptable
                id="chat-prompt"
                ref={chatPromptRef}
                contentEditable={promptPlaceholder === userPromptWaiting ? "false" : "true"}
                onInput={handleChatPromptInput}
                onKeyDown={
                    (event) => {
                        editorEventHandlers.onKeyDown(event);
                        handleChatPromptKeydown(event);
                    }
                }
                onPaste={editorEventHandlers.onPaste}
                dataPlaceholder={promptPlaceholder}
                className={chatPromptIsEmpty ? 'empty' : ''}
                style={{
                    ...editorEventHandlers.style,
                    overflow: "auto",
                    minHeight: "56px",
                    maxHeight: "300px",
                    flex: 1,
                    marginTop: "auto",
                    padding: "18.5px 14px",
                }}
            >
            </div>
            { aiLibraryOpen ? 
                <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 1, backgroundColor: darkMode ? grey[900] : grey[100] }}>
                    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", width: "100%" }}>
                        <FormLabel>
                            Loaded knowledge: { Object.keys(selectedAiLibraryNotes).length === 0 ? "None" : ""} 
                            <TextStatsDisplay name="AI Library" sizeInCharacters={selectedAiLibraryFullTextSize} 
                                maxTokenSize={myModelSettings.contextTokenSize}/>
                        </FormLabel>
                        <List dense sx={{ width: "100%", overflow: "auto", maxHeight: "100px" }}>
                            {Object.values(selectedAiLibraryNotes).map(note =>(
                                <ListItem 
                                    key={"loaded-ai-knowledge-" + note.metadata.id}
                                    secondaryAction={
                                        <Tooltip title={ "Unload knowledge from AI" }>
                                            <IconButton edge="end" aria-label="Unload knowledge from AI"
                                                onClick={() => {handleUnloadKnowledgeFromAi(note.metadata.id)}}>
                                                <CloseIcon />
                                            </IconButton>
                                        </Tooltip>
                                      }
                                >
                                    {note.metadata.name}
                                </ListItem>
                            ))}
                        </List>
                        <FormControl sx={{ minWidth: 120, width: "100%" }}>
                            <Box sx={{ display: "flex", direction: "row", width: "100%" }}>
                                <InputLabel id="ai-library-helper-label">Select knowledge to add</InputLabel>
                                <Select
                                sx={{width: "100%"}}
                                labelId="ai-library-select-helper-label"
                                id="ai-library-select-helper"
                                label="Select notes to add to AI knowledge"
                                value={selectedAiLibraryNoteId}
                                onChange={handleloadKnowledgeToAi}
                                >
                                    {(showOnlyNotesInAiLibrary ? aiLibrary.filter(noteStub => noteStub.properties.inAILibrary) : aiLibrary).map((noteStub) => (
                                        <MenuItem key={'ai-library-item-' + noteStub.id} value={noteStub}>{noteStub.name}</MenuItem>
                                    ))}
                                </Select>
                                <Tooltip title={ showOnlyNotesInAiLibrary ? "Select box will show notes that are in the AI Library. Click to show all notes" : "Show only notes in AI library" }>
                                    <IconButton onClick={() => { setShowOnlyNotesInAiLibrary(x=>!x) }}>
                                        { showOnlyNotesInAiLibrary ? <LocalLibraryIcon/> : <LocalLibraryOutlinedIcon/> }
                                    </IconButton>
                                </Tooltip>
                                <IconButton onClick={handleAiLibraryHelpPopoverOpen}>
                                <HelpIcon />
                                </IconButton>
                                <Popover
                                id="ai-library-help-popover"
                                open={aiLibraryHelpPopoverOpen}
                                    anchorEl={anchorAiLibraryHelpEl}
                                onClick={handleAiLibraryHelpPopoverClose}
                                onClose={handleAiLibraryHelpPopoverClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                >
                                <FormHelperText sx={{ p: 2, width: "300px" }}>
                                    Add knowledge the AI can use to answer questions by creating notes and clicking the book icon in the notes main toolbar to add them to the AI library, then select notes from this list for the AI to use in answering your questions. Click the X next to loaded knowledge notes to unload them. Loaded knowledge takes up space in the AI context window, so ensure it is concise.
                                </FormHelperText>
                                </Popover>
                            </Box>
                        </FormControl>
                    </Box>
                </Paper> : null
            }
            <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 2, backgroundColor: darkMode ? grey[900] : grey[100] }}>
                <Typography color="textSecondary">Prompts: {promptCount}</Typography>
                <Typography color="textSecondary">Responses: {responseCount}</Typography>
                <Typography color="textSecondary">K-Notes: { Object.keys(selectedAiLibraryNotes).length }</Typography>
                <Typography color="textSecondary">Total size: 
                    <TextStatsDisplay sx={{ ml:1 }} name="prompt + context" sizeInCharacters={messagesSize + promptLength + selectedAiLibraryFullTextSize}
                    maxTokenSize={myModelSettings.contextTokenSize} />
                </Typography>
            </Paper>
        </Box>
    </Box>
</Card>;
    return ( chatOpen ? render : null )
  }

export default Chat;