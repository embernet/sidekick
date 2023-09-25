import axios from 'axios'
import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Accordion, AccordionSummary, AccordionDetails ,Box, Toolbar, IconButton, Typography, TextField,
    List, ListItem, Menu, MenuItem, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import ReactMarkdown from 'react-markdown';
import hljs from 'highlight.js';

// Icons
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import RedoIcon from '@mui/icons-material/Redo';
import SendIcon from '@mui/icons-material/Send';

import { SystemContext } from './SystemContext';
import ContentFormatter from './ContentFormatter';
import AI from './AI';


import { grey } from '@mui/material/colors';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[500],
    gap: 2,
  }));

const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[300],
}));

const SidekickAI = ({
    sidekickAIOpen, setSidekickAIOpen, serverUrl, token, setToken, chatStreamingOn}) => {

    const system = useContext(SystemContext);
    const [streamingChatResponse, setStreamingChatResponse] = useState("");
    const [id, setId] = useState("");
    const [name, setName] = useState("New chat");
    const [previousName, setPreviousName] = useState("New chat");
    const userPromptReady = "Ask a question about sidekick...";
    const userPromptWaiting = "Waiting for response...";
    const [sidekickAIPrompt, setSidekickAIPrompt] = useState("");
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
    const [manualExpanded, setManualExpanded] = useState(true);
    const [aiHelpExpanded, setAiHelpExpanded] = useState(false);

    const sidekickAISystemPrompt = `You are Sidekick-GPT.

    Sidekick is an AI powered tool for creativity, thinking, learning, exploring ideas, problem-solving, knowledge-building, and getting things done.
    
    You are an AI implemented as a Large Language Model (LLM) and you are the brain in the Sidekick app. 
    
    Your goal as an AI powered tool is to help your user understand how they can make use of the features and functionality in the app and the capabilities of Generative AI available through the app Chat window.
    
    If asked about how to do something related to the sidekick app you use the information below to answer the question, giving them step by step guidance, and suggesting related functionality that may be relevant to their task.
    
    You provide concise answers that directly answer the question.`;
    
    const sidekickManual = `# Sidekick overview
    
    Sidekick provides a chat interface to OpenAI's GPT models along with pre-canned AI personas and a prompt fragment library to help you get more out of the AI and a working environment where you can create notes by selecting the most interesting and useful parts of the chat to edit and organise into a more complete text aligned with what you want.
    

    # Sidekick Tools
    
    Sidekick has the following Tools:

    - Chat Explorer: A window that lets you explore the chat history.
    - Chat: A window that lets you talk to OpenAI's GPT-3.5-turbo and GPT-4 models.
    - AI Personas: A window that lets you select from a library of pre-canned AI personas to change the perspective from which the AI responds to your prompts.
    - Prompt Composer: A window that lets you create prompts by selecting from a library of prompt fragments.
    - Notes Explorer: A window that lets you explore the notes you have created.
    - Note: A window that lets you create and edit notes.
    - Model Settings: A window that lets you change the model settings for the AI.
    - App Settings: A window that lets you change the app settings, and things related to your userid.
    - Help: A window that lets you access the Sidekick manual and AI help.

    Each of these is described in more detail below.

    ## Chat
    
    ### What is Chat?
    
    Chat is a window that lets you talk to OpenAI's GPT-3.5-turbo and GPT-4 models. Each time you enter a prompt, the entire chat history is sent to the AI along with the prompt. The AI then responds to the prompt based on the chat history and the prompt.
    
    ### How to access Chat
    
    Click on the Chat icon in the Sidekick toolbar
    
    ### Chat Tool Features
    
    - Talk to OpenAI's GPT-3.5-turb and GPT-4 models
    - Create a new chat by clicking the New Chat icon in the Chat Toolbar
    - Code is syntax highlighted; this can be turned on and off via the code highlighting button on the Chat Toolbar
    - Right clicking on a message in the chat lets you:
      - Copy the message to the clipboard as text
      - Copy the message to the clipboard as HTML
      - Append the message to the prompt
      - Use the message as the prompt
      - Append the message to a note
      - Append all messages in the chat to a note
      - Delete a message
      - Delete all messages in the chat
    - The chat history is saved in the Sidekick database
      
    ### Chat Tips, Questions and Answers:
    
    - If you want a quicker chat response and your questions are not complex then try using the GPT-3.5-turbo model. If you want a more complex response then try using the GPT-4 model. You can change the model in the Model Settings window.
    - Why delete messages from the chat? Curating the chat history by deleting individual messages that were not what you wanted can be a useful way to improve the AI's responses. The chat history is sent back to the AI each time you send a new prompt, so deleting messages that were not what you wanted can help the AI learn what you do want.
    - Chats are automatically named. New empty chats are named "New Chat" until you interact with it to create some content. If this is their name when you enter a prompt, they will be automatically given a name based on the text in the prompt.
    
    ## AI Personas Tool
    
    ### What are AI Personas?
    
    AI Personas are pre-canned personalities that you can use to change the perspective from which the AI responds to your prompts.
    
    ### How to access AI Personas
    
    Click on the AI Personas icon in the Sidekick toolbar, or click on the persona name in the Chat window secondary toolbar just above where you enter your prompt.
    
    ### AI Personas Overview
    
    The Personas tool lets you change the persona of the AI so the response can be provided from a perspective that suits your purpose. You can filter personas by name, keywords in their profile, and favourite status. So you can search for personas that are good at a particular topic or that have a particular personality. E.g. try searching for expert, creative, logic, company.

    ### AI Personas Toolbar

    - "Show/Hide descriptions": Click on the Show/Hide descriptions icon to show or hide the persona descriptions. This makes it easier to see more personas at once.

    ### AI Personas Features

    - Select from a library of pre-canned AI personas
    - Filter the list of personas by name, keywords in their profile, and favourite status
    - Favourite personas you use often by clicking on the heart icon next to the persona name
    - Change the AI Persona to use in subsequent prompts to the AI in the Chat window by clicking on the persona name in the Personas window
    - Right click on a persona in the Personas window to:
        - "Ask again with this persona" - This will send the last prompt to the AI again using the selected persona. In this way, you can easily get multiple perspectives on the same question.
        - "Set as default persona" - This will set the selected persona as the default persona to use in subsequent prompts to the AI in the Chat window. This will be remembered across sessions.


    ### AI Personas Tips, Questions and Answers:

    - Why use AI Personas? Using AI Personas can help you get more out of the AI by changing the perspective from which the AI responds to your prompts. This can help you get a different perspective on your ideas and problems, and can help you get more out of the AI by using the persona that is best suited to your purpose.
    - How do I favourite an AI Persona? Click on the heart icon next to the persona name.
    - How do I unfavourite an AI Persona? Click on the heart icon next to the persona name.
    - How do I change the AI Persona? Click on the persona name in the Personas window.
    - How do I search for an AI Persona? Enter a search term in the filter box in the Personas window. You can search by name, keywords in the persona profile. You can filter the list of personas by favourite by clicking the heart next to the filter box in the Personas window.
    
    ## Prompt Composer

    ### What is the Prompt Composer?

    The Prompt Composer is a tool that lets you create prompts by selecting from a library of prompt fragments.

    ### How to access the Prompt Composer

    Click on the Prompt Composer icon in the Sidekick toolbar.

    ### Prompt Composer Overview

    The Prompt Composer lets you create prompts by selecting from a library of prompt fragments. The library is broken down into categories of intent, detail, voice, perspective, and format.

    ### Prompt Composer Toolbar

    - "Show/Hide descriptions": Click on the Show/Hide icon to expand or collapse the categories of prompt fragment.

    ### Prompt Composer Features

    - Click on the category name to expand or collapse the category of prompt fragment.
    - Click on the prompt fragment to add it to the prompt.

    # What can I use Sidekick for?

    - Creativity: Sidekick can help you be more creative by helping you explore ideas, and by helping you get more out of the AI by using the persona that is best suited to your purpose.
    - Brainstorming: Use the Chat tool to ask the AI to come up with different ideas for a problem you are working on. Use the personas to come up with ideas from different perspectives and to list pros and cons from those perspectives. Use the Note tool to collect the best ideas from the Chat.
    - Thinking: Use the Chat tool to ask the AI to help you think through a problem you are working on. Ask the AI to break a problem down into its parts, create a list of the steps involved in a process, come up with a strategy to achieve a goal, or to help you understand a concept.
    - Learning: Use the Chat tool to ask the AI to help you learn about a topic you are interested in. Ask the AI to explain a concept, provide history, or relevance of different ideas to something you are working on. Ask for a list of resources to learn more about a topic.
    - Problem-solving: Use the Chat tool to ask the AI to help you solve a problem you are working on. Ask the AI to help you understand the problem, break it down into its parts, come up with a strategy to solve it, or to help you understand how to work around a problem or come at it from a different direction.
    - Knowledge-building: Use the Note tool to collect the best parts of the Chats, and to edit and organise them into a more complete text aligned with what you want.
    - Software Engineering: Software engineering includes requirements analysis, system design, programming, testing, and operations. Use the Chat tool to provide code snippets, explain concepts, and provide examples, design patterns, recommend libraries and languages to use to perform specific tasks. Use the Note tool to collect the parts most relevant to you so you can create your own play book of how to code more effectively.
    
    `;

    const sidekickAIPromptDirective = `You only answer questions about the  Sidekick app and how to use it. If the following includes questions that are not about the Sidekick app or how to use it then explain how they could use the Sidekick app to answer their question, e.g. by using the Note tool to sketch out the question in more detail, selecting an appropriate persona from the Persona tool, creating a prompt using the Prompt Composer tool, Using the Chat window to get ideas from GPT-3.5-turbo or GPT-4, using the Note tool to collect the best parts of the Chat.
    `;

    useEffect(()=>{
        setMessages([]);
        setSidekickAIPrompt("");
        setLastPrompt("");
        setPromptToSend({prompt: "", timestamp: Date.now()});
        setSystemPrompt(sidekickAISystemPrompt + "\nHere is the sidekick manual:\n" + sidekickManual);
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
        document.getElementById("chat-prompt")?.focus();
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
        setSidekickAIPrompt('');
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
          console.log(error);
          system.error(`Error reading chat stream: ${error}`);
        }

    }, [stopStreaming]);

    const sendPrompt = async (prompt) => {
        setManualExpanded(false);
        setAiHelpExpanded(true);
        // setup as much of the request as we can before calling appendMessage
        // as that will wait for any re-rendering and the id could change in that time
        let requestData = {
            model_settings: {
                provider: "OpenAI",
                request: {
                    model: "gpt-3.5-turbo",
                    temperature: 0.9,
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

    const handleUseAsChatInput = () => {
        setSidekickAIPrompt(messageContextMenu.message.content);
        setMessageContextMenu(null);
    };

    const handleAppendToChatInput = () => {
        let newPrompt = sidekickAIPrompt.trim() + " " + messageContextMenu.message.content.trim();
        setSidekickAIPrompt(newPrompt);
        setMessageContextMenu(null);
    };

    const render = <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "400px"}}>
    <StyledToolbar className={ClassNames.toolbar}>
        <HelpIcon/>
        <Typography sx={{mr:2}}>Sidekick AI Help</Typography>
        <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
            <Tooltip title="Close window">
                <IconButton onClick={() => { setSidekickAIOpen(false); }}>
                    <CloseIcon />
                </IconButton>
            </Tooltip>
        </Box>
    </StyledToolbar>
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>

        <Box sx={{ overflow: 'auto', flex: 1 }}>
        <Accordion expanded={manualExpanded} onChange={() => setManualExpanded(!manualExpanded)} >
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="sidekick-help-content"
            id="sidekick-help-header"
            >
                <Typography>Sidekick Manual</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Typography sx={{ whiteSpace: 'pre-line' }}>
                    {sidekickManual}
                </Typography>
            </AccordionDetails>
        </Accordion>
        <Accordion sx={{ position: 'sticky', top: 0, zIndex: 1 }} expanded={aiHelpExpanded} onChange={() => setAiHelpExpanded(!aiHelpExpanded)}> 
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="sidekick-ai-content"
            id="sidekick-ai-header"
            >
            <Typography>Sidekick AI Help</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <List id="sidekick-ai-message-list">
                    {messages && messages.length === 0 && <Typography>Ask a question about Sidekick below.</Typography>}
                    {messages && messages.map((message, index) => (
                        <ListItem key={index}>
                            <div onContextMenu={(event) => { handleMessageContextMenu(event, message, index); }}>
                                <Card sx={{ 
                                    padding: 2, 
                                    width: "100%", 
                                    backgroundColor: message.role === "user" ? "lightblue" : "lightyellow",
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
            </AccordionDetails>
        </Accordion>
      </Box>
        <SecondaryToolbar className={ClassNames.toolbar}>
            <Tooltip title={ "Reload last prompt for editing" }>
                <IconButton edge="start" color="inherit" aria-label="menu"
                    disabled={streamingChatResponse !== ""} onClick={handleReload}>
                    <RedoIcon/>
                </IconButton>
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
        <TextField 
            sx={{ width: "100%", mt: "auto"}}
                id="sidekick-ai-prompt"
                multiline 
                variant="outlined" 
                value={sidekickAIPrompt} 
                onChange={e => setSidekickAIPrompt(e.target.value)} 
                onKeyDown={handleSendToSidekickAI}
                placeholder={promptPlaceholder}
                disabled={streamingChatResponse !== ""}
        />
    </Box>
</Card>;
    return ( sidekickAIOpen ? render : null )
  }

export default SidekickAI;