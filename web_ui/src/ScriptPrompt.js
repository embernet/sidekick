import React, { useState, useEffect, useRef } from 'react';
import { Card, Box, Typography, TextField } from '@mui/material';
import { lightBlue } from '@mui/material/colors';
import AIPromptResponse from './AIPromptResponse';

import SidekickMarkdown from './SidekickMarkdown';
import ScriptTemplate from './ScriptTemplate';


const ScriptPrompt = ({ cells,
    cellName, setCellName,
    cellParameters, setCellParameters,
    cellValue, setCellValue,
    modelSettings, persona, serverUrl, token, setToken, darkMode, markdownRenderingOn, system }) => {
    const [myCellName, setMyCellName] = useState(cellName || "");
    const [myCellValue, setMyCellValue] = useState(cellValue || "");
    const [scriptTemplateParameters, setScriptTemplateParameters] = useState({ template: cellParameters?.template || "" });
    const [prompt, setPrompt] = useState("");
    const [userPromptToSend, setUserPromptToSend] = useState("");
    const [response, setResponse] = useState(cellValue?.response || "");
    const [AIResponse, setAIResponse] = useState("");
    const [streamingChatResponse, setStreamingChatResponse] = useState("");
    const streamingChatResponseRef = useRef("");
    const [cellsByName, setCellsByName] = useState({});

    const listToDict = (list) => {
        list.reduce((acc, cell) => {
        acc[cell.name] = cell;
        return acc;
        }, {});
    };

    useEffect(() => {
        setCellsByName(listToDict(cells));
    }, [cells]);

    useEffect(() => {
        setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        setCellValue(myCellValue);
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
        <Box>
            <TextField label="cell name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                value={myCellName} onChange={handleNameChange}
            />
            <ScriptTemplate cells={cells}
                        valueLabel="Edit the template to generate a prompt"
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
};

export default ScriptPrompt;
