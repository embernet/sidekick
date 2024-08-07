import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from "lodash";

import { Card, Box, Typography, TextField } from '@mui/material';
import { lightBlue } from '@mui/material/colors';
import AIPromptResponse from './AIPromptResponse';

import SidekickMarkdown from './SidekickMarkdown';
import ScriptTemplate from './ScriptTemplate';
import { memo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ScriptPrompt = memo(({ cells,
    cellName, setCellName,
    cellParameters, setCellParameters,
    cellValue, setCellValue,
    modelSettings, persona, serverUrl, token, setToken, darkMode, markdownRenderingOn, system, language }) => {
    // Set the initial state of the cell
    // taking into account the user may switch between cell types in the UI
    const [myCellName, setMyCellName] = useState(cellName || "");
    const [myCellValue, setMyCellValue] = useState({ response: typeof cellValue === "string" ? cellValue : "" });
    // If the cellParameters are not set, use the cellValue as the template
    // This enables the user to switch between cell types and keep the same value
    const [scriptTemplateParameters, setScriptTemplateParameters] =
        useState({ template: cellParameters?.template || (typeof cellValue === "string" ? cellValue : "") });
    
    // UI state
    const [prompt, setPrompt] = useState("");
    const [userPromptToSend, setUserPromptToSend] = useState("");
    const [response, setResponse] = useState(cellValue?.response || "");
    const [AIResponse, setAIResponse] = useState("");
    const [streamingChatResponse, setStreamingChatResponse] = useState("");
    const streamingChatResponseRef = useRef("");
    const myId= uuidv4();

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`script-prompt-${myId}`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    const listToDict = (list) => {
        list.reduce((acc, cell) => {
        acc[cell.name] = cell;
        return acc;
        }, {});
    };

    useEffect(() => {
        cellName !== myCellName && setCellName && setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        cellValue !== myCellValue && setCellValue && setCellValue(myCellValue);
    }
    , [myCellValue]);

    useEffect(()=>{
        if (AIResponse !== "") {
            setResponse(AIResponse);
            setMyCellValue({ ...myCellValue, response: AIResponse});
        }
    },[AIResponse]);

    useEffect(()=>{
        setCellParameters({...cellParameters, template: scriptTemplateParameters?.template || ""});
    }, [scriptTemplateParameters]);

    const handleNameChange = (event) => {
        setMyCellName(event.target.value);
    }

    const handleResponseChange = (event) => {
        setMyCellValue(event.target.value);
    };

    return (
        <Box id={`script-prompt-${myId}`}>
            <TextField label="cell name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                value={myCellName} onChange={handleNameChange}
            />
            <ScriptTemplate cells={cells}
                        valueLabel={"Edit the template to generate a prompt"}
                        cellName={cellName}
                        cellParameters={scriptTemplateParameters} setCellParameters={setScriptTemplateParameters}
                        cellValue={myCellValue} setCellValue={setPrompt}
                    />
            <br/>
            <AIPromptResponse 
                serverUrl={serverUrl}
                token={token}
                setToken={setToken}
                modelSettings={modelSettings}
                streamingOn={true}
                customUserPromptReady={""}
                systemPrompt={persona.system_prompt}
                streamingChatResponseRef={streamingChatResponseRef}
                streamingChatResponse={streamingChatResponse}
                setStreamingChatResponse={setStreamingChatResponse}
                setAIResponse={setAIResponse}
                setUserPromptEntered={null}
                interactiveMode={true}
                showPrompt={false}
                userPromptToSend={userPromptToSend}
                passiveUserPromptToSend={prompt}
                setUserPromptToSend={setUserPromptToSend}
                controlName="Ask the AI"
                toolbarButtons={null}
                sendButtonTooltip=""
                onBlur={null}
                darkMode={darkMode}
                language={language}
            />
            { !streamingChatResponse &&
                <Card id="response" label="Response" variant="outlined"
                        sx={{ 
                            padding: 2, 
                            width: "100%", 
                            backgroundColor: (darkMode ? lightBlue[900] : "lightyellow"),
                            cursor: "default",
                        }}
                >
                    {
                        markdownRenderingOn
                        ?
                            <SidekickMarkdown markdown={response} />
                        :
                            <Typography sx={{ whiteSpace: 'pre-wrap', width: "100%" }}>
                                {response}
                            </Typography>
                    }
                </Card>
            }
            <Box sx={{ width: "100%" }}>
                {streamingChatResponse && streamingChatResponse !== "" && 
                <Card id="streamingChatResponse" label="Response"
                    sx={{ 
                        padding: 2, 
                        width: "100%", 
                        backgroundColor: (darkMode ? lightBlue[900] : "lightyellow"),
                        cursor: "default",
                    }}
                    >
                        <Typography
                            sx={{ whiteSpace: 'pre-wrap', width: "100%" }}
                            onChange={handleResponseChange}
                        >
                            {streamingChatResponse}
                        </Typography>
                    </Card>
                }
            </Box>
        </Box>
    );
});

export default ScriptPrompt;
