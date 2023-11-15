import axios from 'axios'
import { debounce } from "lodash";

import { useEffect, useCallback, useRef, useState, useContext } from 'react';
import { Box, TextField, Typography, Toolbar, Tooltip, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";

import RedoIcon from '@mui/icons-material/Redo';
import ReplayIcon from '@mui/icons-material/Replay';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import SendIcon from '@mui/icons-material/Send';

import { SystemContext } from './SystemContext';

import { grey } from '@mui/material/colors';

const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[300],
}));

// Component: AIPromptResponse
// This component is used to enable the user to enter a prompt,
// which is returned to the containing component for optional modification,
// before being sent to the AI.
// The response from the AI is then streamed to the streamingChatResponseRef,
// which should be a useRef to an element returned by the containing component.
// Once the streaming is complete, the streamingChatResponseRef is cleared,
// and the AI response is set to the full response,
// so the containing component can take appropriate action on completion.
//
// input: serverUrl: string - the URL of the server
// input: token: string - the token to use for authentication
// output: setToken: function - the function to call to set the token after refreshing it
// input: systemPrompt: string - the system prompt to use when calling the AI
// input: streamingOn: boolean - whether to stream the response from the AI or wait for the full response
// output: streamingChatResponseRef: {current: string} - a ref to the element to stream the response to
// output: streamingChatResponse: string - the response from the AI
// output: setStreamingChatResponse: function - the function to call to update the streaming response from the AI
// output: setAIResponse: function - the function to call to set the full response from the AI
// input: onChange: function - the function to call when a prompt template is created or deleted
// input: focusOnPrompt: boolean - sets the focus on the prompt text area
// input: promptPlaceholder: string - sets the placeholder text in the prompt text area
// output: promptEntered: {prompt: prompt, timestamp: Date.now()}
//      The containing component should use promptEntered to set userPromptToSend to the AI
//      This should be based on the promptEntered and may just be a copy of it
//      or may contain additional text, e.g. to reaffirm system prompt directives
// input: userPromptToSend: {prompt: prompt, timestamp: Date.now()}

const AIPromptResponse = ({serverUrl, token, setToken, customUserPromptReady, systemPrompt,
    streamingOn, streamingChatResponseRef, streamingChatResponse,
    setStreamingChatResponse, setAIResponse, onChange, focusOnPrompt,
    setUserPromptEntered, userPromptToSend, setUserPromptToSend,
    controlName, toolbarButtons, sendButtonTooltip}) => {

    const system = useContext(SystemContext);
    const defaultUserPromptReady = "Enter prompt...";
    const userPromptReady = useRef(customUserPromptReady && customUserPromptReady !== "" ? customUserPromptReady : defaultUserPromptReady);
    const userPromptWaiting = "Waiting for response...";
    const [promptPlaceholder, setPromptPlaceholder] = useState(userPromptReady.current);
    const [prompt, setPrompt] = useState("");
    const [lastPrompt, setLastPrompt] = useState("");
    const [newStreamDelta, setNewStreamDelta] = useState(null);
    const stopStreamingRef = useRef(false);
    // create a unique id for the prompt TextArea
    const promptId = "prompt-" + Math.random().toString(36);

    const [width, setWidth] = useState(0);

    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(promptId);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);


    const setPromptFocus = () => {
        document.getElementById(promptId)?.focus();
    }

    const showReady = () => {
        setPromptPlaceholder(userPromptReady.current);
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
        setPrompt('');
    }

    const reset = () => {
        setPrompt("");
        showReady();
        stopStreamingRef.current = false;
    }

    useEffect(()=>{
        reset();
    }, []);

    useEffect(()=>{
        setPromptFocus();
    }, [prompt]);
    
    useEffect(()=>{
        if (promptPlaceholder === userPromptReady.current) {
            setPromptFocus();
        }
    }, [promptPlaceholder]);
    
    useEffect(()=>{
        if(userPromptToSend) {
            sendPrompt(userPromptToSend.prompt);
            setUserPromptEntered(null);
            setUserPromptToSend(null);
        }
    }, [userPromptToSend]);

    useEffect(()=>{
        setPromptFocus();
    }, [focusOnPrompt]);

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
                setAIResponse(chatResponse);
                showReady();
            }
        }
    }, [newStreamDelta]);

    const extractNameFromPrompt = (prompt) => {
        if (prompt.startsWith("# ")) {
          const newlineIndex = prompt.indexOf("\n");
          if (newlineIndex !== -1 && newlineIndex > 2 && newlineIndex < 50) {
            return prompt.substring(2, newlineIndex).trim();
          }
        }
        return null;
    };

    const handleUserPromptEntered = (event) => {
        event.preventDefault();
        setLastPrompt(prompt);
        setUserPromptEntered({prompt: prompt, timestamp: Date.now()});
    };

    const handleUserPromptKeyDown = (event) => {
        if(event.key === 'Enter'  && !event.shiftKey && prompt) {
            handleUserPromptEntered(event);
        } else if(event.key === 'Escape') {
            setPrompt("");
            event.preventDefault();
        }
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
                        setAIResponse(chatResponse);
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
          system.error(`System Error reading chat stream.`, error);
        }

    }, [stopStreamingRef.current]);

    const sendPrompt = async (prompt) => {        
        // Send the chat history and prompt using the streaming/non-streaming API
        // based on what the user selected in ModelSettings
        let requestData = {
            model_settings: {
                provider: "OpenAI",
                request: {
                    frequency_penalty: 0,
                    model: "gpt-3.5-turbo",
                    presence_penalty: 0,
                    temperature: 0.7,
                    top_p: 1
                }
            },
            system_prompt: systemPrompt,
            prompt: prompt
        };
        console.log('sendPrompt request', requestData);
        console.log("AIPR.sendPrompt", requestData);
        showWaiting();
        switch (streamingOn) {
            case false:
                let result = "";
                await axios.post(`${this.serverUrl}/chat/v1`, requestData, {
                    headers: {
                        Authorization: 'Bearer ' + this.token
                      }
                })
                .then((response) => {
                    console.log("/chat response", response);
                    result = response;
                })
                .catch((error) => {
                    console.log(error);
                    throw error;
                });
                return result;
            default:
            case true:
                getChatStream(requestData);
                break;
        }

    };
    let render = <Box>
        <SecondaryToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
            <Typography sx={{mr:2}}>{controlName}</Typography>
            <Tooltip title={ "Ask again" }>
                <span>
                <IconButton edge="start" color="inherit" aria-label="menu" 
                    disabled={streamingChatResponse !== ""} onClick={handleAskAgain}>
                    <ReplayIcon/>
                </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={ "Reload last prompt for editing" }>
                <span>
                    <IconButton edge="start" color="inherit" aria-label="menu"
                        disabled={streamingChatResponse !== ""} onClick={handleReload}>
                        <RedoIcon/>
                    </IconButton>
                </span>
            </Tooltip>
            {toolbarButtons}
            <Box ml="auto">
                {streamingChatResponse !== "" && <Tooltip title={ "Stop" }>
                    <IconButton id="chat-stop" edge="end" color="inherit" aria-label="stop"
                        onClick={() => { handleStopStreaming(); }}
                    >
                        <StopCircleIcon/>
                    </IconButton>
                </Tooltip>}
                <Tooltip title={ sendButtonTooltip ? sendButtonTooltip : "Send prompt to AI" }>
                    <span>
                        <IconButton edge="end" color="inherit" aria-label="send" disabled={streamingChatResponse !== ""}
                            onClick={handleUserPromptEntered}
                        >
                            <SendIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </SecondaryToolbar>
        <TextField 
            sx={{ width: "100%", mt: "auto", overflow: "auto", maxHeight: "338px", minHeight: "54px" }}
            id={promptId}
            multiline 
            variant="outlined" 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            onKeyDown={handleUserPromptKeyDown}
            placeholder={promptPlaceholder}
            disabled={streamingChatResponse !== ""}
        />
    </Box>
    return render;
}

export default AIPromptResponse;