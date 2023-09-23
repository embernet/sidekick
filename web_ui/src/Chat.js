import axios from 'axios'
import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Box, Toolbar, IconButton, Typography, TextField,
    List, ListItem, Menu, MenuItem, Tooltip
     } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ReactMarkdown from 'react-markdown';
import hljs from 'highlight.js';

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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { SystemContext } from './SystemContext';
import ContentFormatter from './ContentFormatter';

import { grey } from '@mui/material/colors';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    gap: 2,
  }));

const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[300],
}));

const Chat = ({
    provider, modelSettings, persona, 
    newPromptPart, loadChat, setAppendNoteContent,
    focusOnPrompt, setFocusOnPrompt, chatRequest, chatOpen, setChatOpen,
    temperatureText, setTemperatureText, modelSettingsOpen, setModelSettingsOpen,
    onChange, personasOpen, setPersonasOpen, setOpenChatId, shouldAskAgainWithPersona, serverUrl, token, setToken,
    streamingChatResponse, setStreamingChatResponse, chatStreamingOn}) => {

    const system = useContext(SystemContext);
    const [id, setId] = useState("");
    const [name, setName] = useState("New chat");
    const [previousName, setPreviousName] = useState("New chat");
    const userPromptReady = "Enter message...";
    const userPromptWaiting = "Waiting for response...";
    const [prompt, setPrompt] = useState("");
    const [lastPrompt, setLastPrompt] = useState("");
    const [promptToSend, setPromptToSend] = useState(false);
    const [messages, setMessages] = useState([]);
    const [myModelSettings, setMyModelSettings] = useState({});
    const [myPersona, setMyPersona] = useState({});
    const [previousPersona, setPreviousPersona] = useState({});
    const [myShouldAskAgainWithPersona, setMyShouldAskAgainWithPersona] = useState(null);

    const [newStreamDelta, setNewStreamDelta] = useState({value: "", done: true, timestamp: Date.now()});
    const streamingChatResponseRef = useRef("");
    const [stopStreaming, setStopStreaming] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [promptPlaceholder, setPromptPlaceholder] = useState(userPromptReady);
    const [messageContextMenu, setMessageContextMenu] = useState(null);
    const [syntaxHighlightingOn, setSyntaxHighlightingOn] = useState(true);
    const [settings, setSettings] = useState({});
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [folder, setFolder] = useState("chats");
    const [tags, setTags] = useState([]);
    const [myServerUrl, setMyServerUrl] = useState(serverUrl);

    const setPromptFocus = () => {
        let cp = document.getElementById("chat-prompt")
        if (cp !== null) { cp.focus(); }
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
    }, []);

    useEffect(()=>{
        if (chatOpen) {
            if (!loadChat) {
                create();
            }
        } else {
            resetChat();
        }
    }, [chatOpen]);

    useEffect(()=>{
        setOpenChatId(id);
        console.log("setOpenChatId", id);
    }, [id]);

    useEffect(()=>{
        if (id !== "" && id !== null) {
            save();
        }
    }, [messages]);

    useEffect(()=>{
        settings["rendered"] = syntaxHighlightingOn;
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
    }, [syntaxHighlightingOn]);

    useEffect(()=>{
        if ("rendered" in settings) {
            setSyntaxHighlightingOn(settings.rendered);
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
        setStreamingChatResponse(r => r + newStreamDelta.value);
        if (newStreamDelta.done) {
            console.log("Stream complete");
            const chatResponse = streamingChatResponse;
            setStreamingChatResponse("");
            appendMessage({"role": "assistant", "content": chatResponse});
            showReady();
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
            try {
                const messageList = document.getElementById("message-list");
                if (messageList === null) {
                    return;
                }
                const lastMessage = messageList.lastChild;
                lastMessage.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
            } catch (err) {
                console.log(err);
            } 
            finally {}
        }, 0);
    }

    const showReady = () => {
        setPromptPlaceholder(userPromptReady);
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
        setPrompt('');
    }

    const save = (prompt) => {
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
                while (true) {
                    var {value, done} = await reader.read();
                    //setNewStreamDelta({value: value, done: done, timestamp:Date.now()});
                    if (value) { 
                        streamingChatResponseRef.current += value;
                        setStreamingChatResponse(streamingChatResponseRef.current);
                    }
                    if (done) {
                        const chatResponse = streamingChatResponseRef.current;
                        streamingChatResponseRef.current = "";
                        setStreamingChatResponse("");
                        appendMessage({"role": "assistant", "content": chatResponse});
                        showReady();
                        console.log("closing chat stream");
                        reader.cancel();
                        reader.releaseLock();
                        break;
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
          console.log(error);
          system.error(`Error reading chat stream: ${error}`);
        }

    }, [stopStreaming]);

    const sendPrompt = (prompt) => {
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

    const handleStopStreaming = (event) => {
        console.log("handleStopStreaming");
        setStopStreaming(true);
    }

    const handleAskAgain = () => {
        if (lastPrompt) {
            sendPrompt(lastPrompt);
        }
    }

    const handleReload = () => {
        setPrompt(lastPrompt);
    }
    
    const handleTitleChange = (event) => {
        setName(event.target.value);
    }

    const handleNewChat = () => {
        create();
    }

    const create = () => {
        setId("");
        setName("New chat");
        setPreviousName("New chat");
        setMessages([]);
        setPrompt("");
        setLastPrompt("");
        let request = {
            name: "New chat",
            content: {
                chat: [],
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
            document.getElementById("chat-name").focus();
            document.getElementById("chat-name").select();
            console.log("create chat Response", response);
        }).catch(error => {
            console.log("create chat error", error);
            system.error(`Error creating chat: ${error}`);
        });
}

    const handleRenameChat = () => {
        if (name !== previousName && name !== "") {
            axios.put(`${serverUrl}/docdb/${folder}/documents/${id}/rename`, {
                name: name,
            }, {
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(response => {
                console.log("/renameChat Response", response);
                response.data.access_token && setToken(response.data.access_token);
                setPreviousName(name);
                onChange(id, name, "renamed", "");
            }).catch(error => {
                console.log(error);
                system.error(`Error renaming chat: ${error}`);
            })                                    
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

    const resetChat = () => {
        setId(null);
        setName("New chat");
        setPreviousName("New chat");
        setMessages([]);
        setPrompt("");
        setLastPrompt("");
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
            resetChat();
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
        setAppendNoteContent(messageContextMenu.message.content);
        setMessageContextMenu(null);
    };

    const handleAppendAllToNote = () => {
        let newNoteContent = "";
        messages.forEach((message) => {
            newNoteContent += message.content + "\n\n";
        });
        setAppendNoteContent(newNoteContent);
        setMessageContextMenu(null);
    };

    const handleSyntaxHighlightingChange = () => {
        let newSetting = !syntaxHighlightingOn;
        setSyntaxHighlightingOn(newSetting);
    };

      const highlightCodeBlocks = (text) => {
        try {
            const codeRegex = /```([a-zA-Z]+)([\s\S]*?)```/g;
            let lastIndex = 0;
            const highlightedText = [];
            let match;
            while ((match = codeRegex.exec(text)) !== null) {
            const language = match[1];
            const code = match[2];
            const startIndex = match.index;
            const endIndex = codeRegex.lastIndex;
            const before = text.slice(lastIndex, startIndex);
            const after = text.slice(endIndex);
            highlightedText.push(<ReactMarkdown key={lastIndex} sx={{ whiteSpace: 'pre-wrap' }}>{before}</ReactMarkdown>);
            highlightedText.push(
                <Card>
                    <Toolbar className={ClassNames.toolbar}>
                    <Typography sx={{ mr: 2 }}>{language}</Typography>
                        <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
                            <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => { navigator.clipboard.writeText(code); }}>
                                <ContentCopyIcon/>
                            </IconButton>
                        </Box>
                    </Toolbar>
                    <SyntaxHighlighter key={lastIndex + 1} language={language} style={docco}>
                        {code}
                    </SyntaxHighlighter>
                </Card>
            );
            lastIndex = codeRegex.lastIndex;
            if (lastIndex === text.length) {
                highlightedText.push(<ReactMarkdown key={lastIndex} sx={{ whiteSpace: 'pre-wrap' }}>{after}</ReactMarkdown>);
            }
            }
            if (lastIndex < text.length) {
            highlightedText.push(<Typography key={lastIndex} sx={{ whiteSpace: 'pre-wrap' }}>{text.slice(lastIndex)}</Typography>);
            }
            return <>{highlightedText}</>;
        } catch (err) {
            console.log(err);
            system.error(`Error highlighting code blocks: ${err}`);
            return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>;
        }
    };

    const render = <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "400px"}}>
    <StyledToolbar className={ClassNames.toolbar}>
        <CommentIcon/>
        <Typography sx={{mr:2}}>Chat</Typography>
        <IconButton edge="start" color="inherit" aria-label="menu"
            onClick={handleNewChat}
        >
            <AddCommentIcon/>
        </IconButton>
        <Tooltip title={ syntaxHighlightingOn ? "Turn off code highlighting" : "Turn on code highlighting" }>
            <IconButton edge="end" color="inherit" aria-label="delete chat" onClick={handleSyntaxHighlightingChange}>
                { syntaxHighlightingOn ? <CodeIcon/> : <CodeOffIcon/> }
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
        <TextField
            sx={{ mt: 2 }}
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
                                    syntaxHighlightingOn
                                    ?
                                        highlightCodeBlocks(message.content)
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
                                <MenuItem onClick={handleCopyMessageAsText}>Copy message as text</MenuItem>
                                <MenuItem onClick={handleCopyAllAsText}>Copy all as text</MenuItem>
                                <MenuItem onClick={handleCopyMessageAsHTML}>Copy message as html</MenuItem>
                                <MenuItem onClick={handleCopyAllAsHTML}>Copy all as html</MenuItem>
                                <MenuItem onClick={handleAppendToChatInput}>Append message to chat input</MenuItem>
                                <MenuItem onClick={handleUseAsChatInput}>Use message as chat input</MenuItem>
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
        <SecondaryToolbar className={ClassNames.toolbar}>
            <Tooltip title={ "Ask again" }>
                <IconButton edge="start" color="inherit" aria-label="menu" 
                    disabled={streamingChatResponse !== ""} onClick={handleAskAgain}>
                    <ReplayIcon/>
                </IconButton>
            </Tooltip>
            <Tooltip title={ "Reload last prompt for editing" }>
                <IconButton edge="start" color="inherit" aria-label="menu"
                    disabled={streamingChatResponse !== ""} onClick={handleReload}>
                    <RedoIcon/>
                </IconButton>
            </Tooltip>
            <Typography id="personaname" sx={{ ml:2, mr: 1 }} onClick={() => setPersonasOpen(!personasOpen)}>
                {myPersona.name}
            </Typography>
            <Typography id="temperature" sx={{ mr: 2 }} onClick={() => setModelSettingsOpen(!modelSettingsOpen)}>
                ({temperatureText})
            </Typography>
            <Typography id="modelname" sx={{ mr: 2 }} onClick={() => setModelSettingsOpen(!modelSettingsOpen)}>
                {myModelSettings.request && myModelSettings.request.model}
            </Typography>
            <Box ml="auto">
                {/* TODO: Fix {streamedChatResponse !== "" && <Tooltip title={ "Stop" }>
                    <IconButton edge="end" color="inherit" aria-label="stop"
                        onClick={() => { handleStopStreaming(); }}
                    >
                        <StopCircleIcon/>
                    </IconButton>
                </Tooltip>} */}
                <Tooltip title={ "Send prompt to AI" }>
                    <IconButton edge="end" color="inherit" aria-label="send" disabled={streamingChatResponse !== ""}
                        onClick={() => { setPromptToSend({prompt: prompt, timestamp: Date.now()}); }}
                    >
                        <SendIcon/>
                    </IconButton>
                </Tooltip>
            </Box>
        </SecondaryToolbar>
        <TextField 
            sx={{ width: "100%", mt: "auto"}}
                id="chat-prompt"
                multiline 
                variant="outlined" 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                onKeyDown={handleSend}
                placeholder={promptPlaceholder}
                disabled={streamingChatResponse !== ""}
        />
    </Box>
</Card>;
    return ( chatOpen ? render : null )
  }

export default Chat;