import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Box, Paper, Toolbar, IconButton, Typography, TextField,
    List, ListItem, Menu, MenuItem, Tooltip, Button
     } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";

// Icons
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
import SaveIcon from '@mui/icons-material/Save';

import { SystemContext } from './SystemContext';
import ContentFormatter from './ContentFormatter';
import AI from './AI';


import { grey, blue } from '@mui/material/colors';
import SidekickMarkdown from './SidekickMarkdown';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
  }));

const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[300],
}));

const Chat = ({
    provider, modelSettings, persona, 
    newPromptPart, newPrompt, loadChat, setAppendNoteContent,
    focusOnPrompt, setFocusOnPrompt, chatRequest, chatOpen, setChatOpen,
    temperatureText, setTemperatureText, modelSettingsOpen, toggleModelSettingsOpen, togglePersonasOpen,
    onChange, personasOpen, promptEngineerOpen, togglePromptEngineerOpen, setOpenChatId, shouldAskAgainWithPersona, serverUrl, token, setToken,
    streamingChatResponse, setStreamingChatResponse, chatStreamingOn }) => {

    const newChatName = "New Chat"

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
        const { width } = entries[0].contentRect;
        setWidth(width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById("chat-panel");
        const observer = new ResizeObserver(handleResize);
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
    const [prompt, setPrompt] = useState("");
    const [lastPrompt, setLastPrompt] = useState("");
    const [promptToSend, setPromptToSend] = useState(false);
    const [messages, setMessages] = useState([]);
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
    const [markdownRenderingOn, setMarkdownRenderingOn] = useState(true);
    const [settings, setSettings] = useState({});
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [folder, setFolder] = useState("chats");
    const [tags, setTags] = useState([]);
    const [myServerUrl, setMyServerUrl] = useState(serverUrl);

    const applyCustomSettings = () => {
        axios.get(`${serverUrl}/custom_settings/chat`).then(response => {
            if ("userPromptReady" in response.data) {
                userPromptReady.current = defaultUserPromptReady + " (" + response.data.userPromptReady + ")";
                setPromptPlaceholder(userPromptReady.current);
            }
        }).catch(error => {
          console.error("Error getting Chat custom settings:", error);
        });
      }
        
    const setPromptFocus = () => {
        document.getElementById("chat-prompt")?.focus();
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
            console.log("get chat_settings error:", error);
            system.error(`Error loading chat settings: ${error}`);
        });
        applyCustomSettings();
    }, []);

    useEffect(()=>{
        if (chatOpen) {
            if (!loadChat) {
                reset();
            }
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
            console.log("save chat", messages.length, messages);
            if (id !== "" && id !== null) {
                save();
            } else {
                create();
            }
        }
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
                console.log("put chat_settings error:", error);
                system.error(`Error saving chat settings: ${error}`);
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
        console.log("newPromptPart", newPromptPart);
        if(typeof newPromptPart === "string") {
            let newPrompt = prompt.trim() + " " + newPromptPart.trim() + " ";
            setPrompt(newPrompt);
            setPromptFocus();
        }
    }, [newPromptPart]);

    useEffect(()=>{
        console.log("newPrompt", newPrompt);
        if (!chatOpen) { setChatOpen(true); }
        if (newPrompt) {
            if (streamingChatResponse !== "") {
                system.info("Please wait for the current chat to finish loading before loading a prompt template.");
            } else {
                axios.get(`${serverUrl}/docdb/prompt_templates/documents/${newPrompt["id"]}`, {
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                }).then(response => {
                    console.log("/docdb/prompt_templates GET Response:", response);
                    response.data.access_token && setToken(response.data.access_token);
                    setLastPrompt(prompt);
                    setPrompt("# " + response.data.metadata.name + "\n" + response.data.content.prompt_template);
                }).catch(error => {
                    console.error("/docdb/prompt_templates GET error", error);
                    system.error(`Error loading prompt_template: ${error}`);
                });
            }
        }

        if(typeof newPrompt === "string") {
            setPrompt(newPrompt);
            setPromptFocus();
        }
    }, [newPrompt]);

    useEffect(()=>{
        if(promptToSend) {
            setLastPrompt(promptToSend.prompt);
            sendPrompt(promptToSend.prompt);
        }
    }, [promptToSend]);

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
        setPromptFocus();
    }, [prompt]);

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
        if (loadChat) {
            if (streamingChatResponse !== "") {
                system.info("Please wait for the current chat to finish loading before loading another chat.");
            } else {
                console.log("loadChat", loadChat);
                axios.get(`${serverUrl}/docdb/${folder}/documents/${loadChat["id"]}`, {
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                }).then(response => {
                    console.log("/docdb/chat Response", response);
                    response.data.access_token && setToken(response.data.access_token);
                    setId(response.data.metadata.id);
                    setName(response.data.metadata.name);
                    setPreviousName(response.data.metadata.name);
                    setMessages(response.data.content.chat);
                    setPrompt("");
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
                    console.error("/docdb/chat error", error);
                    system.error(`Error loading chat: ${error}`);
                });
            }
        }
    }, [loadChat]);
    
    const appendMessage = (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
        setChatOpen(true);
        setTimeout(() => {
            document.getElementById("message-list")?.lastChild?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
        }, 0);
    }

    const showReady = () => {
        setPromptPlaceholder(userPromptReady.current);
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
        setPrompt('');
    }

    const create = () => {
        let request = {
            name: name,
            tags: tags,
            content: {
                chat: messages,
            }
        };
        axios.post(`${serverUrl}/docdb/${folder}/documents`, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            console.log("New chat Response", response);
            response.data.access_token && setToken(response.data.access_token);
            setId(response.data.metadata.id);
            setName(response.data.metadata.name);
            setPreviousName(response.data.metadata.name);
            setTags(response.data.metadata.tags);
            setMessages(response.data.content.chat);
            onChange(id, name, "created", "");
            document.getElementById("chat-name")?.focus();
            document.getElementById("chat-name")?.select();
            console.log("create chat Response", response);
        }).catch(error => {
            console.log("create chat error", error);
            system.error(`Error creating chat: ${error}`);
        });
    }

    const save = () => {
        let request = {
            metadata: {
                name: name,
                tags: [],
            },
            content: {
                chat: messages,
            }
        };
        console.log('Save chat request', request);

        axios.put(`${serverUrl}/docdb/${folder}/documents/${id}`, request, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("/docdb/save Response", response);
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "changed", "");
        }).catch(error => {
            console.log("/docdb/save error", error);
            system.error(`Error saving chat: ${error}`);
        })
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
            console.log("getChatStream request", request);

            const response = await fetch(url , request);
            console.log("getChatStream response", response);
          
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
                        setStreamingChatResponse(streamingChatResponseRef.current);
                    }
                    if (done || stopStreamingRef.current) {
                        let chatResponse = streamingChatResponseRef.current;
                        if (stopStreamingRef.current) { chatResponse += "\n\n(Chat stopped by user)" }
                        streamingChatResponseRef.current = "";
                        setStreamingChatResponse("");
                        appendMessage({"role": "assistant", "content": chatResponse});
                        showReady();
                        reader.releaseLock();
                        break;
                    }
                }
                stopStreamingRef.current = false;
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
          console.log(error);
          system.error(`Error reading chat stream: ${error}`);
        }

    }, [stopStreamingRef.current]);

    const sendPrompt = async (prompt) => {
        // setup as much of the request as we can before calling appendMessage
        // as that will wait for any re-rendering and the id could change in that time
        let requestData = {
            model_settings: myModelSettings,
            system_prompt: systemPrompt,
            prompt: prompt,
            id: id,
            name: name,
            persona: myPersona,
        };
        console.log('sendPrompt request', requestData);
        appendMessage({"role": "user", "content": prompt});
        // add the messages as chatHistory but remove the sidekick metadata       
        requestData.chatHistory = messages.map((message) => {
            let newMessage = {...message};
            delete newMessage.metadata;
            return newMessage;
        }
        );

        console.log('request', requestData);
        if (myShouldAskAgainWithPersona) {
            setMyShouldAskAgainWithPersona(null);
            setMyPersona(persona);
        }

        showWaiting();

        // Get GPT to name the chat based on the content of the first message
        if (name === newChatName) {
            // Use AI to name the chat
            const ai = new AI(serverUrl, token, setToken, system);
            let generatedName = await ai.nameTopic(requestData.prompt);
            if (generatedName && generatedName !== "") { setName(generatedName); }
        }

        // Send the chat history and prompt using the streaming/non-streaming API
        // based on what the user selected in ModelSettings
        switch (chatStreamingOn) {
            case false:
                setStreamingChatResponse("Waiting for response...");
                axios.post(`${serverUrl}/chat/v1`, requestData, {
                    headers: {
                        Authorization: 'Bearer ' + token
                      }
                })
                .then((response) => {
                    console.log("/chat response", response);
                    setStreamingChatResponse("");
                    response.data.access_token && setToken(response.data.access_token);
                    appendMessage(response.data.chat_response[1]); // 1 is the assistant message, 0 is the user message
                    showReady();
                })
                .catch((error) => {
                    console.log(error);
                    appendMessage({"role": "assistant", "content": error, "metadata": {"error": true}});
                    showReady();
                });
                break;
            default:
            case true:
                getChatStream(requestData);
                break;
        }
    }

    const handleSend = (event) => {
        if(event.key === 'Enter'  && !event.shiftKey && prompt) {
            setLastPrompt(prompt);
            setPromptToSend({prompt: prompt, timestamp: Date.now()});
            event.preventDefault();
        } else if(event.key === 'Escape') {
            setPrompt("");
            event.preventDefault();
        }
    }

    const handleRegenerateChatName = async () => {
        const ai = new AI(serverUrl, token, setToken, system);
        let generatedName = await ai.nameTopic(messagesAs("text"));
        if (generatedName && generatedName !== "") { renameChat(generatedName); }
    }

    const handleStopStreaming = (event) => {
        console.log("handleStopStreaming");
        stopStreamingRef.current = true;
    }

    const handleAskAgain = () => {
        if (lastPrompt) {
            sendPrompt(lastPrompt);
        }
    }

    const handleReload = () => {
        setPrompt(lastPrompt);
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
        const promptTemplateName = extractNameFromPrompt(prompt);
        if (promptTemplateName) {
            axios.post(`${serverUrl}/docdb/prompt_templates/documents`, {
                "name": promptTemplateName,
                "tags": [],
                "content": {
                    "prompt_template": prompt.replace(/^.*?\n/, '')
                },
            }, {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then(response => {
                console.log("Create prompt template Response", response);
                response.data.access_token && setToken(response.data.access_token);
                onChange(response.data.metadata.id, response.data.metadata.name, "created", "promptTemplate");
                system.info(`Prompt template ${response.data.metadata.name} created.`);
            }).catch(error => {
                console.log("create prompt template error", error);
                system.error(`Error creating prompt template: ${error}`);
            });
        } else {
            system.error("Please start your prompt template with a heading on the first line, e.g. # My Prompt Template (press Shift+Return to enter a newline). Prompt template not saved. ");
        }
    }
    
    const handleTitleChange = (event) => {
        setName(event.target.value);
    }

    const handleNewChat = () => {
        reset();
        setPromptFocus();
    }

    const renameChat = (newName) => {
        setName(newName);
        axios.put(`${serverUrl}/docdb/${folder}/documents/${id}/rename`, {
            name: newName,
        }, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            console.log("/renameChat Response", response);
            response.data.access_token && setToken(response.data.access_token);
            setPreviousName(name);
            setPromptFocus();
            onChange(id, name, "renamed", "");
        }).catch(error => {
            console.log(error);
            system.error(`Error renaming chat: ${error}`);
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
        setId("");
        setName(newChatName);
        setPreviousName(newChatName);
        setMessages([]);
        setPrompt("");
        setLastPrompt("");
    }

    const closeChatWindow = () => {
        reset();
        setChatOpen(false);
    };

    const deleteChat = () => {
        axios.delete(`${serverUrl}/docdb/${folder}/documents/${id}`, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("delete chat Response", response);
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "deleted", "");
            closeChatWindow();
        }).catch(error => {
            console.log("delete chat error", error);
            system.error(`Error deleting chat: ${error}`);
        });
    }

    const handleDeleteChat = () => {
        deleteChat()
    }

    const handleDeleteThisMessage = () => {
        const updatedMessages = messages.filter((message, index) => index !== messageContextMenu.index);
        console.log("updatedMessages", updatedMessages);
        setMessages(updatedMessages);
        setMessageContextMenu(null);
    };

    const handleDeleteThisAndPreviousMessage = () => {
        const updatedMessages = messages.filter((message, index) => index !== messageContextMenu.index);
        if (messageContextMenu.index > 0) {
            updatedMessages.splice(messageContextMenu.index - 1, 1);
        }
        console.log("updatedMessages", updatedMessages);
        setMessages(updatedMessages);
        setMessageContextMenu(null);
    };

    const handleDeleteAllMessages = () => {
        setMessages([]);
        setMessageContextMenu(null);
    };

    const handleUseAsChatInput = () => {
        setPrompt(messageContextMenu.message.content);
        setMessageContextMenu(null);
    };

    const handleAppendToChatInput = () => {
        let newPrompt = prompt.trim() + " " + messageContextMenu.message.content.trim();
        setPrompt(newPrompt);
        setMessageContextMenu(null);
    };

    const handleAppendToNote = () => {
        console.log("handleAppendToNote", messageContextMenu.message.content);
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

    const render = <Card id="chat-panel" sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "400px" }}>
    <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 } }>
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
            <Tooltip title="Close window">
                <IconButton onClick={() => { setChatOpen(false); }}>
                    <CloseIcon />
                </IconButton>
            </Tooltip>
        </Box>
    </StyledToolbar>
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        <Box sx={{ display:"flex", direction: "row" }}>
            <TextField
                sx={{ mt: 2, flexGrow: 1 }}
                id="chat-name"
                autoComplete='off'
                label="Chat name"
                variant="outlined"
                value={name}
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
            <Toolbar>
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
        <Box sx={{ overflow: 'auto', flex: 1 }}>
            <List id="message-list">
                {messages && messages.map((message, index) => (
                    <ListItem key={index}>
                        <div onContextMenu={(event) => { handleMessageContextMenu(event, message, index); }}>
                            <Card sx={{ 
                                padding: 2, 
                                width: "100%", 
                                backgroundColor: message.role === "user" ? "lightblue" : "lightyellow",
                                cursor: message.role === "user" ? "pointer" : "default",
                            }}
                            onClick={() => message.role === "user" && setPrompt(message.content)}
                        >
                                {
                                    markdownRenderingOn
                                    ?
                                        <SidekickMarkdown markdown={message.content}/>
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
                                <MenuItem onClick={handleAppendToNote}>Append message to note</MenuItem>
                                <MenuItem onClick={handleAppendAllToNote}>Append all to note</MenuItem>
                                <MenuItem divider />
                                <MenuItem onClick={handleDeleteThisMessage}>Delete this message</MenuItem>
                                <MenuItem onClick={handleDeleteThisAndPreviousMessage}>Delete this and previous message</MenuItem>
                                <MenuItem onClick={handleDeleteAllMessages}>Delete all messages</MenuItem>
                            </Menu>
                        </div>
                    </ListItem>
                ))}
                {streamingChatResponse && streamingChatResponse !== "" && <ListItem id="streamingChatResponse">
                    <Card sx={{ 
                        padding: 2, 
                        width: "100%", 
                        backgroundColor: "lightyellow",
                        cursor: "default",
                    }}
                    >
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                            {streamingChatResponse}
                        </Typography>
                    </Card>
                </ListItem>}
            </List>
        </Box>
        <SecondaryToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
            <Typography sx={{mr:2}}>Prompt Editor</Typography>
            <Tooltip title={ "Ask again" }>
                <IconButton edge="start" color="inherit" aria-label="menu" 
                    disabled={streamingChatResponse !== ""} onClick={handleAskAgain}>
                    <ReplayIcon/>
                </IconButton>
            </Tooltip>
            <Tooltip title={ "Reload last prompt for editing" }>
                <span>
                    <IconButton edge="start" color="inherit" aria-label="menu"
                        disabled={streamingChatResponse !== ""} onClick={handleReload}>
                        <RedoIcon/>
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={ "Save prompt as template" }>
                <span>
                    <IconButton edge="start" color="inherit" aria-label="save prompt as template"
                        disabled={streamingChatResponse !== ""} onClick={handleSavePromptAsTemplate}>
                        <SaveIcon/>
                    </IconButton>
                </span>
            </Tooltip>
            <Box ml="auto">
                {streamingChatResponse !== "" && <Tooltip title={ "Stop" }>
                    <IconButton id="chat-stop" edge="end" color="inherit" aria-label="stop"
                        onClick={() => { handleStopStreaming(); }}
                    >
                        <StopCircleIcon/>
                    </IconButton>
                </Tooltip>}
                <Tooltip title={ "Send prompt to AI" }>
                    <span>
                        <IconButton edge="end" color="inherit" aria-label="send" disabled={streamingChatResponse !== ""}
                            onClick={() => { setPromptToSend({prompt: prompt, timestamp: Date.now()}); }}
                        >
                            <SendIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </SecondaryToolbar>
        <TextField 
            sx={{ width: "100%", mt: "auto", overflow: "auto", maxHeight: "40%" }}
                id="chat-prompt"
                multiline 
                variant="outlined" 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                onKeyDown={handleSend}
                placeholder={promptPlaceholder}
                disabled={streamingChatResponse !== ""}
        />
        <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 1, backgroundColor: grey[100] }}>
            <Tooltip title={ personasOpen ? "Hide AI Personas" : "Show AI Personas"}>
                <Button id="button-personas" variant="outlined" size="small" color="primary" sx={{ fontSize: "0.8em", textTransform: 'none' }} onClick={togglePersonasOpen}>
                    {myPersona.name}
                </Button>
            </Tooltip>
            <Tooltip title={ modelSettingsOpen ? "Hide Model Settings" : "Show Model Settings" }>
                <Button id="button-model-settings" variant="outlined" size="small" color="primary" sx={{ fontSize: "0.8em", textTransform: 'none' }} onClick={toggleModelSettingsOpen}>
                    {myModelSettings.request && myModelSettings.request.model} ({temperatureText})
                </Button>
            </Tooltip>
            <Tooltip title={ promptEngineerOpen ? "Hide Prompt Engineer" : "Show Prompt Engineer"}>
                <Button id="button-prompt-engineer" variant="outlined" size="small" color="primary" sx={{ fontSize: "0.8em", textTransform: 'none' }} onClick={togglePromptEngineerOpen}>
                    Prompt Engineer
                </Button>
            </Tooltip>
        </Paper>
    </Box>
</Card>;
    return ( chatOpen ? render : null )
  }

export default Chat;