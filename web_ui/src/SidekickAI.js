import { debounce } from "lodash";
import axios from 'axios'
import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Tabs, Tab, Box, Toolbar, IconButton, Typography, TextField,
    List, ListItem, Menu, MenuItem, Tooltip, FormControl } from '@mui/material';
import { styled } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import { StyledBox } from './theme';
import { ClassNames } from "@emotion/react";
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';


// Icons
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import RedoIcon from '@mui/icons-material/Redo';
import SendIcon from '@mui/icons-material/Send';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

import { SystemContext } from './SystemContext';
import ContentFormatter from './ContentFormatter';

import { lightBlue, grey, blueGrey } from '@mui/material/colors';

const SidekickAI = ({
    sidekickAIOpen, setSidekickAIOpen, serverUrl, token, setToken, 
    chatStreamingOn, windowPinnedOpen, setWindowPinnedOpen, darkMode}) => {

    const theme = useTheme();
    const StyledToolbar = styled(Toolbar)(({ theme }) => ({
        backgroundColor: darkMode ? grey[900] : grey[500],
        gap: 2,
    }));
    
    const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
        backgroundColor: darkMode ? grey[800] : grey[300],
    }));

    const StyledLink = styled(Link)(({ theme }) => ({
        color: darkMode ? theme.palette.grey[800] : theme.palette.grey[300],
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
    }));
        
    const system = useContext(SystemContext);
    const [streamingChatResponse, setStreamingChatResponse] = useState("");
    const userPromptReady = "Ask a question about sidekick...";
    const userPromptWaiting = "Waiting for response...";
    const [sidekickAIPrompt, setSidekickAIPrompt] = useState("");
    const [lastPrompt, setLastPrompt] = useState("");
    const [promptToSend, setPromptToSend] = useState(false);
    const [messages, setMessages] = useState([]);

    const [newStreamDelta, setNewStreamDelta] = useState({value: "", done: true, timestamp: Date.now()});
    const streamingChatResponseRef = useRef("");
    const [stopStreaming, setStopStreaming] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [promptPlaceholder, setPromptPlaceholder] = useState(userPromptReady);
    const [messageContextMenu, setMessageContextMenu] = useState(null);

    const TABS = {
        MANUAL: 0,
        PROMPTS: 1,
        SIDEKICK_AI: 2
    }
    const [tabIndex, setTabIndex] = useState(TABS.MANUAL);

    const [sidekickManual, setSidekickManual] = useState("");
    const [sidekickPromptEngineeringGuide, setSidekickPromptEngineeringGuide] = useState("");
    const [sideKickAIGuide, setSideKickAIGuide] = useState("");

    const sidekickAISystemPrompt = `You are Sidekick-GPT.

    Sidekick is an AI powered tool for creativity, thinking, learning, exploring ideas, problem-solving, knowledge-building, and getting things done.
    
    You are an AI implemented as a Large Language Model (LLM) and you are the brain in the Sidekick app. 
    
    Your goal as an AI powered tool is to help your user understand how they can make use of the features and functionality in the app and the capabilities of Generative AI available through the app Chat window.
    
    If asked about how to do something related to the sidekick app you use the information below to answer the question, giving them a short simple answer for simple requests and step by step guidance for more invovled requests. You also suggest related functionality that may be relevant to their task.
    
    You provide concise answers that directly answer the question. Do not make things up.`;
    
    const sidekickAIPromptDirective = `You only answer questions about the Sidekick app and how to use it based on the knowledge you have been given, you do not make things up or guess, or provide guidance on prompt engineering and how to get the best quality response from the sidekick app chat. If the following includes questions that are not about the Sidekick app or how to use it then explain how they could use the Sidekick app to answer their question, e.g. by using the Note tool to sketch out the question in more detail, selecting an appropriate persona from the Persona tool, creating a prompt using the Prompt Composer tool, Using the Chat window to get ideas from GPT-3.5-turbo or GPT-4, using the Note tool to collect the best parts of the Chat. Do not make up anything about the sidekick tool features and how to do things in the tool: only use information provided in the manual. Keep comments on use of the tool short and fact based.
    `;

    const aiWelcomeMessage = "Hello! I'm Sidekick, an AI-powered tool designed to assist you with creativity, problem-solving, learning, and more. I'm here to help you understand how to use the Sidekick app and make the most of its features. Feel free to ask me any questions you have about the app or prompt engineering, and I'll do my best to assist you. Ask me for help in other areas and I'll walk you through how to use the Sidekick app to find the answers you need."

    const [width, setWidth] = useState(0);
    const handleResize = useCallback( 
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById("sidekick-ai-panel");
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(()=>{
        Promise.all([
            fetch("sidekick_manual.md").then(response => response.text()),
            fetch("sidekick_prompt_engineering_guide.md").then(response => response.text()),
            fetch("sidekick_ai.md").then(response => response.text())
          ]).then(([manualData, guideData, aiData]) => {
            setSidekickManual(manualData);
            setSidekickPromptEngineeringGuide(guideData);
            setSideKickAIGuide(aiData);
            setSystemPrompt(sidekickAISystemPrompt + "\nHere is the sidekick manual:\n" + sideKickAIGuide);
          }).catch(error => console.error(error));
        setMessages([]);
        setSidekickAIPrompt("");
        setLastPrompt("");
        setPromptToSend({prompt: "", timestamp: Date.now()});
    }, []);

    useEffect(()=>{
    }, [setSidekickAIOpen]);

    useEffect(()=>{
    }, [messages]);

    useEffect(()=>{
        if(promptToSend && promptToSend.prompt !== "") {
            setLastPrompt(promptToSend.prompt);
            sendPrompt(promptToSend.prompt);
        }
    }, [promptToSend]);

    useEffect(()=>{
    }, [sidekickAIPrompt]);

    useEffect(()=>{
        setStreamingChatResponse(r => r + newStreamDelta.value);
        if (newStreamDelta.done) {
            console.log("Stream complete");
            const chatResponse = streamingChatResponse;
            setStreamingChatResponse("");
            if (chatResponse !== "" )
            {
                appendMessage({"role": "assistant", "content": chatResponse});
            }
            showReady();
        }
    }, [newStreamDelta]);
    
    const appendMessage = (message) => {
        if (message === null || message === undefined || message === "") {
            return;
        }
        setMessages(prevMessages => [...prevMessages, message]);
        setSidekickAIOpen(true);
        setTimeout(() => {
            try {
                const messageList = document.getElementById("sidekick-ai-message-list");
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
    
        const inputField = document.getElementById("sidekick-ai-prompt");
        if (inputField) {
            if (inputField.disabled) {
                // Create a MutationObserver to watch for changes to the 'disabled' attribute
                const observer = new MutationObserver((mutationsList, observer) => {
                    for(let mutation of mutationsList) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                            if (!inputField.disabled) {
                                inputField.focus();
                                observer.disconnect();
                            }
                        }
                    }
                });
    
                // Start observing the input field with the configured parameters
                observer.observe(inputField, { attributes: true });
            } else {
                inputField.focus();
            }
        }
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
        setSidekickAIPrompt('');
    }

    const getChatStream = useCallback(async (requestData) => {
        const url = `${serverUrl}/chat/v2`;
        try {
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
                    if (value) { 
                        streamingChatResponseRef.current += value;
                        setStreamingChatResponse(streamingChatResponseRef.current);
                    }
                    if (done) {
                        const chatResponse = streamingChatResponseRef.current;
                        streamingChatResponseRef.current = "";
                        setStreamingChatResponse("");
                        if (chatResponse !== "") { 
                            appendMessage({"role": "assistant", "content": chatResponse}); 
                        }
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
          system.error(`System Error reading chat stream.`, error, url + " POST");
        }

    }, [stopStreaming]);

    const sendPrompt = async (prompt) => {
        // Select the sidekick AI tab
        setTabIndex(TABS.SIDEKICK_AI);
        // setup as much of the request as we can before calling appendMessage
        // as that will wait for any re-rendering and the id could change in that time
        let requestData = {
            model_settings: {
                provider: "OpenAI",
                request: {
                    model: "gpt-3.5-turbo",
                    temperature: 0.3,
                    top_p: 1,
                    presence_penalty: 0,
                    frequency_penalty: 0
                }
            },
            system_prompt: systemPrompt,
            prompt: sidekickAIPromptDirective + prompt,
        }

        console.log('sendSidekickAIPrompt request', requestData);
        appendMessage({"role": "user", "content": prompt});
        // add the messages as chatHistory but remove the sidekick metadata       
        requestData.chatHistory = messages.map((message) => {
            let newMessage = {...message};
            delete newMessage.metadata;
            return newMessage;
        }
        );

        showWaiting();
        getChatStream(requestData);
    }

    const handleSendToSidekickAI = (event) => {
        if(event.key === 'Enter'  && !event.shiftKey && sidekickAIPrompt) {
            setLastPrompt(sidekickAIPrompt);
            setPromptToSend({prompt: sidekickAIPrompt, timestamp: Date.now()});
            event.preventDefault();
        } else if(event.key === 'Escape') {
            setSidekickAIPrompt("");
            event.preventDefault();
        }
    }

    const handleReload = () => {
        setSidekickAIPrompt(lastPrompt);
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

    const generateSlug = (string) => {
        if (!string) return "";
        let str = string.replace(/[^a-zA-Z0-9 ]/g, '');
        str = str.replace(/\s+/g, '-');
        str = str.toLowerCase();
        return str;
    };

    const Heading = ({ level, children, ...props }) => {
        const sectionName = children.find(child => child.type === 'text')?.props.value || '';
        const sectionSlug = generateSlug(sectionName);
        const HeadingElement = `h${level}`;
        return (
          <HeadingElement id={sectionSlug} {...props}>
            {children}
          </HeadingElement>
        );
    };

    let helpComponents = {};
    for (let i = 1; i <= 6; i++) {
        const HeadingElement = `h${i}`;
        helpComponents[HeadingElement] = ({ node, children, ...props }) => {
            const sectionName = node.children[0]?.value;
            const sectionSlug = generateSlug(sectionName);
            return (
            <Heading level={i} id={sectionSlug} {...props}>
                {children}
            </Heading>
            );
        };
    }
    
    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const handleLinkClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setTimeout(() => {
            window.history.replaceState({}, document.title, "/");
        }, 0);
    };

    const render = <Card id="sidekick-ai-panel"
        sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", 
        flex:1, minWidth: "380px", maxWidth: "450px"}}>
    <StyledToolbar className={ClassNames.toolbar}>
        <HelpIcon/>
        <Typography sx={{mr:2}}>Sidekick AI Help</Typography>
        <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
            <Tooltip title={windowPinnedOpen ? "Unpin window" : "Pin window open"}>
                <IconButton onClick={() => { setWindowPinnedOpen(state => !state); }}>
                    {windowPinnedOpen ? <PushPinIcon /> : <PushPinOutlinedIcon/>}
                </IconButton>
            </Tooltip>
            <Tooltip title="Close window">
                <IconButton onClick={() => { window.history.replaceState({}, document.title, "/"); setSidekickAIOpen(false); }}>
                    <CloseIcon />
                </IconButton>
            </Tooltip>
        </Box>
    </StyledToolbar>
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        <Tabs sx={{ position: 'sticky', top: 0, background: darkMode ? grey[800] : grey[300], padding: "6px" }} value={tabIndex} onChange={handleTabChange}>
            <Tab label="Manual" />
            <Tab label="Prompts" />
            <Tab label="Sidekick AI" />
        </Tabs>
        <StyledBox sx={{ overflow: 'auto', flex: 1 }}>

            {tabIndex === TABS.MANUAL && (
                <StyledBox id="sidekick-manual-top" sx={{ overflow: 'auto', flex: 1 }}>
                    <img alt="Sidekick AI" src="./logo512.png" style={{ maxWidth: "100%" }} />
                    <Typography>You could read the manual, which is below, or you could just ask the AI about Sidekick at the bottom of this window.</Typography>
                    <br/>
                    <ReactMarkdown
                        components={{...helpComponents,
                            link: ({ href, children }) => (
                                <StyledLink to={href}
                                    onClick={handleLinkClick}>
                                        {children}
                                </StyledLink>
                            ),
                        }}
                        children={sidekickManual}
                    ></ReactMarkdown>
                </StyledBox>
            )}
            {tabIndex === TABS.PROMPTS && (
                <StyledBox id="sidekick-prompt-engineering-guide-top" sx={{ overflow: 'auto', flex: 1 }}>
                    <img alt="Sidekick AI" src="./logo512.png" style={{ maxWidth: "100%" }} />
                    <Typography>The better the quality of your prompt, the better the quality of the response from the AI.</Typography>
                    <br/>
                    <ReactMarkdown
                        components={{...helpComponents,
                            link: ({ href, children }) => (
                                <StyledLink to={href}
                                    onClick={handleLinkClick}>
                                        {children}
                                </StyledLink>
                            ),
                        }}
                        children={sidekickPromptEngineeringGuide}
                    ></ReactMarkdown>
                </StyledBox>
            )}
            {tabIndex === TABS.SIDEKICK_AI && (
                <Box>
                    <img alt="Sidekick AI" src="./logo512.png" style={{ maxWidth: "100%" }} />
                    <StyledBox sx={{ overflow: 'auto', flex: 1 }}>
                        <List id="sidekick-ai-message-list">
                            {messages && messages.length === 0 && <Typography>{aiWelcomeMessage}</Typography>}
                            {messages && messages.map((message, index) => (
                                <ListItem key={index}>
                                    <div onContextMenu={(event) => { handleMessageContextMenu(event, message, index); }}>
                                        <Card sx={{ 
                                            padding: 2, 
                                            width: "100%", 
                                            backgroundColor: message.role === "user" ? (darkMode ? blueGrey[500] : "lightblue") : (darkMode ? lightBlue[900] : "lightyellow"),
                                            cursor: message.role === "user" ? "pointer" : "default",
                                        }}
                                        onClick={() => message.role === "user" && setSidekickAIPrompt(message.content)}
                                    >
                                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                            {message.content}
                                        </Typography>
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
                                            <MenuItem divider />                                        
                                            <MenuItem onClick={handleDeleteThisMessage}>Delete this message</MenuItem>
                                            <MenuItem onClick={handleDeleteThisAndPreviousMessage}>Delete this and previous message</MenuItem>
                                            <MenuItem onClick={handleDeleteAllMessages}>Delete all messages</MenuItem>
                                        </Menu>
                                    </div>
                                </ListItem>
                            ))}
                            {streamingChatResponse && streamingChatResponse !== "" && <ListItem id="sidekickAIStreamingChatResponse">
                                <Card sx={{ 
                                    padding: 2, 
                                    width: "100%", 
                                    backgroundColor: darkMode ? lightBlue[900] : "lightyellow",
                                    cursor: "default",
                                }}
                                >
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {streamingChatResponse}
                                    </Typography>
                                </Card>
                            </ListItem>}
                        </List>
                    </StyledBox>
                </Box>
            )}
        </StyledBox>
        <SecondaryToolbar className={ClassNames.toolbar}>
            <Tooltip title={ "Reload last prompt for editing" }>
                <span>
                <IconButton edge="start" color="inherit" aria-label="menu"
                    disabled={streamingChatResponse !== ""} onClick={handleReload}>
                    <RedoIcon/>
                </IconButton>
                </span>
            </Tooltip>
            <Box ml="auto">
                <Tooltip title={ "Ask Sidekick AI" }>
                    <IconButton edge="end" color="inherit" aria-label="send" disabled={streamingChatResponse !== ""}
                        onClick={() => { setPromptToSend({prompt: sidekickAIPrompt, timestamp: Date.now()}); }}
                    >
                        <SendIcon/>
                    </IconButton>
                </Tooltip>
            </Box>
        </SecondaryToolbar>
        <FormControl>
            <TextField 
                sx={{ width: "100%", mt: "auto"}}
                id="sidekick-ai-prompt"
                name="sidekick-ai-prompt"
                multiline 
                variant="outlined" 
                value={sidekickAIPrompt} 
                onChange={e => setSidekickAIPrompt(e.target.value)} 
                onKeyDown={handleSendToSidekickAI}
                placeholder={promptPlaceholder}
                disabled={streamingChatResponse !== ""}
            />
        </FormControl>
    </Box>
</Card>;
    return ( sidekickAIOpen ? render : null )
  }

export default SidekickAI;