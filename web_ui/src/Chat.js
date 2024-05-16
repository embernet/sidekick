import axios from 'axios'
import { debounce } from "lodash";
import React from 'react';

import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, Box, Paper, Toolbar, IconButton, Typography, TextField,
    List, ListItem, ListSubheader, Menu, MenuItem, Tooltip, Popover,
    ListItemText, ListItemIcon
     } from '@mui/material';
import { ClassNames } from "@emotion/react";
import { InputLabel, FormHelperText, FormControl, Select } from '@mui/material';
import { lightBlue,grey, blueGrey } from '@mui/material/colors';
import { MuiFileInput } from 'mui-file-input';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
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
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SpeakerNotesOffIcon from '@mui/icons-material/SpeakerNotesOff';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SchemaIcon from '@mui/icons-material/Schema';

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
    streamingChatResponse, setStreamingChatResponse, chatStreamingOn, maxWidth, isMobile }) => {
    
    const panelWindowRef = useRef(null);
    const chatMessagesContainerRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const streamingChatResponseCardRef = useRef(null);
    const promptEditorMenuRef = useRef(null);
    const [chatPanelKey, setChatPanelKey] = useState(Date.now()); // used to force re-renders

    const newChatName = "New Chat"

    // TODO - refactor <ActionMenu> to be generated from this JSON object and move it into its own component so it can be used from Note as well
    const promptTemplates = {
        "Analysis": {
            "Balanced Scorecard": {
                "prompt": "Perform a Balanced Scorecard analysis on the chat content, identifying key metrics across financial, customer, internal process, and learning & growth perspectives.",
                "tooltip": "The Balanced Scorecard (BSC) is a strategic planning and management framework that translates an organization's vision and strategy into a coherent set of performance measures across four perspectives: financial, customer, internal processes, and learning and growth."
            },
            "Benefits Analysis": {
                "prompt": "Conduct a Benefits Analysis on the topics discussed, identifying potential benefits, costs, and risks.",
                "tooltip": "Benefits Analysis is a technique used to evaluate the potential benefits, costs, and risks associated with a decision, project, or investment. It helps in making informed decisions and assessing the value of an initiative."
            },
            "Business Model Canvas": {
                "prompt": "Create a Business Model Canvas based on the chat content, identifying key partners, activities, resources, value propositions, customer relationships, channels, customer segments, cost structure, and revenue streams.",
                "tooltip": "The Business Model Canvas is a strategic management template for developing new or documenting existing business models. It allows users to describe, design, challenge, invent, and pivot their business model."
            },
            "Competitive Analysis": {
                "prompt": "Conduct a Competitive Analysis on the chat content, identifying key competitors, their strengths and weaknesses, and potential strategies for differentiation.",
                "tooltip": "Competitive Analysis is the process of evaluating your competitors' strategies, strengths, weaknesses, and market positions to identify opportunities and threats. It helps in shaping strategic responses to enhance competitive advantage."
            },
            "Design Thinking": {
                "prompt": "Apply Design Thinking principles to the conversation, identifying user needs, brainstorming solutions, and proposing prototypes.",
                "tooltip": "Design Thinking is a user-centric approach that involves empathizing with users, defining problems, ideating solutions, prototyping, and testing. It fosters innovation and solves complex problems in a user-focused way."
            },
            "Failure Modes Effects Analysis (FMEA)": {
                "prompt": "Carry out a Failure Modes Effects Analysis (FMEA) on the issues discussed, ranking them by severity, occurrence, and detection.",
                "tooltip": "Failure Modes Effects Analysis (FMEA) is a systematic technique for identifying potential failure modes within a system, classifying them according to their severity, occurrence, and detectability, to prioritize fixes and prevent future failures."
            },
            "Gap Analysis": {
                "prompt": "Conduct a Gap Analysis on the current discussion, identifying the difference between the current and desired states.",
                "tooltip": "Gap Analysis is a process of comparing the actual performance with the potential or desired performance. It helps in identifying the gaps in a system, process, or business offering to recommend steps to bridge these gaps and enhance performance."
            },
            "Kano Model Analysis": {
                "prompt": "Perform a Kano Model Analysis on the needs or features discussed, categorizing them as Must-be, Performance, or Delighters.",
                "tooltip": "Kano Model Analysis categorizes customer preferences into must-haves, performance attributes, and delighters or wow factors, helping in prioritizing features based on their impact on customer satisfaction."
            },
            "Market Entry Strategy": {
                "prompt": "Develop a Market Entry Strategy based on the conversation so far, including recommended modes of entry and potential barriers.",
                "tooltip": "Market Entry Strategy involves analyzing and selecting the most viable approach to enter a new market, considering factors like competition, barriers to entry, market demand, and strategic fit."
            },
            "MoSCoW Prioritisation": {
                "prompt": "Apply MoSCoW Prioritisation to the topics discussed, categorizing them as Must have, Should have, Could have, or Won't have.",
                "tooltip": "MoSCoW Prioritisation is a decision-making technique that helps in categorizing tasks and requirements into Must haves, Should haves, Could haves, and Won't haves, facilitating effective prioritization and resource allocation."
            },
            "PEST Analysis": {
                "prompt": "Conduct a PEST Analysis on the dialogue, examining Political, Economic, Social, and Technological factors.",
                "tooltip": "PEST Analysis is a framework for analyzing the macro-environmental factors (Political, Economic, Social, Technological) that can impact an organization's strategies and future performance. It helps in understanding the broader forces affecting the business landscape."
            },
            "Porters Five Forces": {
                "prompt": "Analyze the chat content using Porter's Five Forces framework, identifying competitive rivalry, supplier power, buyer power, threat of substitution, and threat of new entry.",
                "tooltip": "Porter's Five Forces is a model for analyzing an industry's competitive environment. It examines five forces that determine the intensity of competition and market profitability: competitive rivalry, bargaining power of suppliers, bargaining power of buyers, threat of new entrants, and threat of substitute products or services."
            },
            "Root Cause Analysis": {
                "prompt": "Perform a Root Cause Analysis on the issues raised in the chat, identifying underlying causes and suggesting solutions.",
                "tooltip": "Root Cause Analysis (RCA) is a methodical approach used to identify the fundamental causes of problems or incidents to address the root issues, preventing recurrence rather than treating symptoms."
            },
            "SMART Goals": {
                "prompt": "Formulate SMART Goals based on the objectives discussed in the chat, ensuring they are Specific, Measurable, Achievable, Relevant, and Time-bound.",
                "tooltip": "SMART Goals framework helps in setting clear, achievable goals by ensuring they are Specific, Measurable, Achievable, Relevant, and Time-bound. It provides a structured approach to goal setting for better performance and outcomes."
            },
            "Six Thinking Hats": {
                "prompt": "Apply the Six Thinking Hats method to the conversation, analyzing it from different perspectives: facts, emotions, caution, benefits, creativity, and process.",
                "tooltip": "Six Thinking Hats is a critical thinking process that helps individuals and teams discuss and solve problems more effectively by looking at the situation from six distinct perspectives (White: facts, Red: emotions, Black: caution, Yellow: optimism, Green: creativity, Blue: process), facilitating a more rounded and thorough analysis."
            },
            "Stakeholder Analysis": {
                "prompt": "Conduct a Stakeholder Analysis on the chat content, identifying key stakeholders, their interests, and potential strategies for engagement.",
                "tooltip": "Stakeholder Analysis is a technique used to identify and assess the influence and interests of key people, groups of people, or organizations that may significantly impact the success of your activity or project. It helps in developing strategies for engaging stakeholders effectively."
            },
            "SWOT Analysis": {
                "prompt": "Carry out a SWOT Analysis on the chat so far, identifying Strengths, Weaknesses, Opportunities, and Threats.",
                "tooltip": "SWOT Analysis is a strategic planning tool used to identify and understand the Strengths, Weaknesses, Opportunities, and Threats related to business competition or project planning. It helps in crafting strategies that align with the organization's capabilities and market opportunities."
            },
            "Value Chain Analysis": {
                "prompt": "Perform a Value Chain Analysis on the discussion, examining activities that create value and could lead to competitive advantage.",
                "tooltip": "Value Chain Analysis is a process of examining the steps involved in bringing a product or service from conception to distribution and beyond. It helps in identifying where value is added and how it can be enhanced to achieve a competitive advantage."
            },
            "VPEC-T Analysis": {
                "prompt": "Apply VPEC-T Analysis to the chat content, examining Values, Policies, Events, Content, and Trust.",
                "tooltip": "VPEC-T Analysis stands for Values, Policies, Events, Content, and Trust. It's a framework for analyzing complex situations by examining the critical elements that influence decisions and actions in any context, focusing on understanding stakeholders' perspectives and the foundational elements that guide interactions."
            },
            "Wardley Mapping": {
                "prompt": "Create a Wardley Map based on the chat content, visualizing the landscape of the discussion and identifying areas for strategic focus.",
                "tooltip": "Wardley Mapping is a strategy tool that helps in visualizing the structure of a business or service, mapping the components needed to serve the customer or user. It assists in understanding the current landscape, predicting future trends, and identifying strategic opportunities."
            },
            "What If Analysis": {
                "prompt": "Conduct a What If Analysis on the chat, exploring alternative scenarios and their potential outcomes.",
                "tooltip": "What If Analysis is a systematic process to explore and evaluate potential outcomes of different scenarios based on varying parameters. It helps in decision making by anticipating possible challenges and opportunities, allowing for better preparedness and strategic planning."
            },
            "Why-Why Analysis": {
                "prompt": "Perform a Why-Why Analysis on the chat content, asking 'why' repeatedly to drill down to the root cause of a problem.",
                "tooltip": "Why-Why Analysis is a problem-solving technique that involves repeatedly asking the question 'Why?' to peel away the layers of symptoms and reach the core of a problem. It's a simple yet effective method for uncovering the root cause of a problem and ensuring that solutions address this foundational issue."
            }
        },
        "Creativity": {
            "Balanced Scorecard": {
                "prompt": "Perform a Balanced Scorecard analysis on the chat content, identifying key metrics across financial, customer, internal process, and learning & growth perspectives.",
                "tooltip": "The Balanced Scorecard (BSC) is a strategic planning and management framework that translates an organization's vision and strategy into a coherent set of performance measures across four perspectives: financial, customer, internal processes, and learning and growth."
            },
            "Benefits Analysis": {
                "prompt": "Conduct a Benefits Analysis on the topics discussed, identifying potential benefits, costs, and risks.",
                "tooltip": "Benefits Analysis is a technique used to evaluate the potential benefits, costs, and risks associated with a decision, project, or investment. It helps in making informed decisions and assessing the value of an initiative."
            },
            "Business Model Canvas": {
                "prompt": "Create a Business Model Canvas based on the chat content, identifying key partners, activities, resources, value propositions, customer relationships, channels, customer segments, cost structure, and revenue streams.",
                "tooltip": "The Business Model Canvas is a strategic management template for developing new or documenting existing business models. It allows users to describe, design, challenge, invent, and pivot their business model."
            },
            "Competitive Analysis": {
                "prompt": "Conduct a Competitive Analysis on the chat content, identifying key competitors, their strengths and weaknesses, and potential strategies for differentiation.",
                "tooltip": "Competitive Analysis is the process of evaluating your competitors' strategies, strengths, weaknesses, and market positions to identify opportunities and threats. It helps in shaping strategic responses to enhance competitive advantage."
            },
            "Design Thinking": {
                "prompt": "Apply Design Thinking principles to the conversation, identifying user needs, brainstorming solutions, and proposing prototypes.",
                "tooltip": "Design Thinking is a user-centric approach that involves empathizing with users, defining problems, ideating solutions, prototyping, and testing. It fosters innovation and solves complex problems in a user-focused way."
            },
            "Failure Modes Effects Analysis (FMEA)": {
                "prompt": "Carry out a Failure Modes Effects Analysis (FMEA) on the issues discussed, ranking them by severity, occurrence, and detection.",
                "tooltip": "Failure Modes Effects Analysis (FMEA) is a systematic technique for identifying potential failure modes within a system, classifying them according to their severity, occurrence, and detectability, to prioritize fixes and prevent future failures."
            },
            "Gap Analysis": {
                "prompt": "Conduct a Gap Analysis on the current discussion, identifying the difference between the current and desired states.",
                "tooltip": "Gap Analysis is a process of comparing the actual performance with the potential or desired performance. It helps in identifying the gaps in a system, process, or business offering to recommend steps to bridge these gaps and enhance performance."
            },
            "Kano Model Analysis": {
                "prompt": "Perform a Kano Model Analysis on the needs or features discussed, categorizing them as Must-be, Performance, or Delighters.",
                "tooltip": "Kano Model Analysis categorizes customer preferences into must-haves, performance attributes, and delighters or wow factors, helping in prioritizing features based on their impact on customer satisfaction."
            },
            "Market Entry Strategy": {
                "prompt": "Develop a Market Entry Strategy based on the conversation so far, including recommended modes of entry and potential barriers.",
                "tooltip": "Market Entry Strategy involves analyzing and selecting the most viable approach to enter a new market, considering factors like competition, barriers to entry, market demand, and strategic fit."
            },
            "MoSCoW Prioritisation": {
                "prompt": "Apply MoSCoW Prioritisation to the topics discussed, categorizing them as Must have, Should have, Could have, or Won't have.",
                "tooltip": "MoSCoW Prioritisation is a decision-making technique that helps in categorizing tasks and requirements into Must haves, Should haves, Could haves, and Won't haves, facilitating effective prioritization and resource allocation."
            },
            "PEST Analysis": {
                "prompt": "Conduct a PEST Analysis on the dialogue, examining Political, Economic, Social, and Technological factors.",
                "tooltip": "PEST Analysis is a framework for analyzing the macro-environmental factors (Political, Economic, Social, Technological) that can impact an organization's strategies and future performance. It helps in understanding the broader forces affecting the business landscape."
            },
            "Porters Five Forces": {
                "prompt": "Analyze the chat content using Porter's Five Forces framework, identifying competitive rivalry, supplier power, buyer power, threat of substitution, and threat of new entry.",
                "tooltip": "Porter's Five Forces is a model for analyzing an industry's competitive environment. It examines five forces that determine the intensity of competition and market profitability: competitive rivalry, bargaining power of suppliers, bargaining power of buyers, threat of new entrants, and threat of substitute products or services."
            },
            "Root Cause Analysis": {
                "prompt": "Perform a Root Cause Analysis on the issues raised in the chat, identifying underlying causes and suggesting solutions.",
                "tooltip": "Root Cause Analysis (RCA) is a methodical approach used to identify the fundamental causes of problems or incidents to address the root issues, preventing recurrence rather than treating symptoms."
            },
            "SMART Goals": {
                "prompt": "Formulate SMART Goals based on the objectives discussed in the chat, ensuring they are Specific, Measurable, Achievable, Relevant, and Time-bound.",
                "tooltip": "SMART Goals framework helps in setting clear, achievable goals by ensuring they are Specific, Measurable, Achievable, Relevant, and Time-bound. It provides a structured approach to goal setting for better performance and outcomes."
            },
            "Six Thinking Hats": {
                "prompt": "Apply the Six Thinking Hats method to the conversation, analyzing it from different perspectives: facts, emotions, caution, benefits, creativity, and process.",
                "tooltip": "Six Thinking Hats is a critical thinking process that helps individuals and teams discuss and solve problems more effectively by looking at the situation from six distinct perspectives (White: facts, Red: emotions, Black: caution, Yellow: optimism, Green: creativity, Blue: process), facilitating a more rounded and thorough analysis."
            },
            "Stakeholder Analysis": {
                "prompt": "Conduct a Stakeholder Analysis on the chat content, identifying key stakeholders, their interests, and potential strategies for engagement.",
                "tooltip": "Stakeholder Analysis is a technique used to identify and assess the influence and interests of key people, groups of people, or organizations that may significantly impact the success of your activity or project. It helps in developing strategies for engaging stakeholders effectively."
            },
            "SWOT Analysis": {
                "prompt": "Carry out a SWOT Analysis on the chat so far, identifying Strengths, Weaknesses, Opportunities, and Threats.",
                "tooltip": "SWOT Analysis is a strategic planning tool used to identify and understand the Strengths, Weaknesses, Opportunities, and Threats related to business competition or project planning. It helps in crafting strategies that align with the organization's capabilities and market opportunities."
            },
            "Value Chain Analysis": {
                "prompt": "Perform a Value Chain Analysis on the discussion, examining activities that create value and could lead to competitive advantage.",
                "tooltip": "Value Chain Analysis is a process of examining the steps involved in bringing a product or service from conception to distribution and beyond. It helps in identifying where value is added and how it can be enhanced to achieve a competitive advantage."
            },
            "VPEC-T Analysis": {
                "prompt": "Apply VPEC-T Analysis to the chat content, examining Values, Policies, Events, Content, and Trust.",
                "tooltip": "VPEC-T Analysis stands for Values, Policies, Events, Content, and Trust. It's a framework for analyzing complex situations by examining the critical elements that influence decisions and actions in any context, focusing on understanding stakeholders' perspectives and the foundational elements that guide interactions."
            },
            "Wardley Mapping": {
                "prompt": "Create a Wardley Map based on the chat content, visualizing the landscape of the discussion and identifying areas for strategic focus.",
                "tooltip": "Wardley Mapping is a strategy tool that helps in visualizing the structure of a business or service, mapping the components needed to serve the customer or user. It assists in understanding the current landscape, predicting future trends, and identifying strategic opportunities."
            },
            "What If Analysis": {
                "prompt": "Conduct a What If Analysis on the chat, exploring alternative scenarios and their potential outcomes.",
                "tooltip": "What If Analysis is a systematic process to explore and evaluate potential outcomes of different scenarios based on varying parameters. It helps in decision making by anticipating possible challenges and opportunities, allowing for better preparedness and strategic planning."
            },
            "Why-Why Analysis": {
                "prompt": "Perform a Why-Why Analysis on the chat content, asking 'why' repeatedly to drill down to the root cause of a problem.",
                "tooltip": "Why-Why Analysis is a problem-solving technique that involves repeatedly asking the question 'Why?' to peel away the layers of symptoms and reach the core of a problem. It's a simple yet effective method for uncovering the root cause of a problem and ensuring that solutions address this foundational issue."
            }
        },
    }

    const reRenderChatPanel = () => {
        // e.g. to force resize when isMobile as some components may not resize correctly such as when a menu closes
        setChatPanelKey(Date.now());
    };

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
            if (isMobile) { reRenderChatPanel();}
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
    const defaultUserPromptReady = 'Enter prompt (or "/" for commands and prompt templates)...';
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
    const [menuPromptsAnchorEl, setMenuPromptsAnchorEl] = useState(null);
    const [menuDiagramsAnchorEl, setMenuDiagramsAnchorEl] = useState(null);
    const [menuPanelAnchorEl, setMenuPanelAnchorEl] = useState(null);
    const [menuPromptEditorAnchorEl, setMenuPromptEditorAnchorEl] = useState(null);
    const [menuMessageContext, setMenuMessageContext] = useState(null);
    const [menuCommandsAnchorEl, setMenuCommandsAnchorEl] = useState(null);
    const [menuCommandsOnSelectionAnchorEl, setMenuCommandsOnSelectionAnchorEl] = useState(null);
    const [menuExplorationAnchorEl, setMenuExplorationAnchorEl] = useState(null);
    const [menuInsightsAnchorEl, setMenuInsightsAnchorEl] = useState(null);
    const [menuAnalysisAnchorEl, setMenuAnalysisAnchorEl] = useState(null);
    const [menuCreativityAnchorEl, setMenuCreativityAnchorEl] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [markdownRenderingOn, setMarkdownRenderingOn] = useState(true);
    const [settings, setSettings] = useState({});
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const chatLoading = useRef(false);
    const [folder, setFolder] = useState("chats");
    const [tags, setTags] = useState([]);
    const [bookmarked, setBookmarked] = useState(false);
    const [starred, setStarred] = useState(false);
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
            setTimeout(() => {
                chatPrompt?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
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
        // onOpen
        if (chatOpen) {
            if (isMobile) {
                panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
            }
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
        if (messages.length > 0 && !chatLoading.current) {
            // don't save if this hook was called as a result of loading a chat
            if (id !== "" && id !== null) {
                save();
            } else {
                create();
            }
        } else {
            // reset the loading state so that future changes will be saved
            chatLoading.current = false;
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
    }, [messages, starred, bookmarked, tags]);

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

    const appendToChatPrompt = (text) => {
        let newPrompt = chatPromptRef.current.innerText.trim() + " " + text.trim() + " ";
        setChatPrompt(newPrompt);
        setPromptFocus();
    }

    useEffect(()=>{
        if (newPromptPart?.text) {
            if (!chatOpen) { setChatOpen(Date.now()); }
            if (streamingChatResponse !== "") {
                system.warning("Please wait for the current chat to finish loading before adding a prompt part.");
            } else {
                appendToChatPrompt(newPromptPart.text);
            }
        }
    }, [newPromptPart]);

    useEffect(()=>{
        if (newPromptTemplate?.id) {
            if (!chatOpen) { setChatOpen(Date.now()); }
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
                    setPromptFocus();
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
        panelWindowRef?.current?.scrollIntoView({ behavior: 'instant' });
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
        if (loadChat) {
            if (streamingChatResponse !== "") {
                system.warning("Please wait for the current chat to finish loading before loading another chat.");
            } else {
                // prevent saves whilst we are updating state during load
                chatLoading.current = true; // note: this will be reset in the [messages] useEffect hook
                
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
                    setTags(response.data.metadata?.tags || []);
                    setStarred(response.data.metadata?.properties?.starred || false);
                    setBookmarked(response.data.metadata?.properties?.bookmarked || false);

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
                    if (isMobile && chatOpen) {
                        panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
                    }
                    if (!chatOpen) { setChatOpen(Date.now()); }
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
        if (!chatOpen) { setChatOpen(Date.now()) };
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
        let newChatObject = {
            name: name,
            tags: tags,
            properties: {
                starred: starred,
                bookmarked: bookmarked,
            },
            content: {
                chat: messages,
            }
        };
        const url = `${serverUrl}/docdb/${folder}/documents`;
        axios.post(url, newChatObject, {
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
                tags: tags,
                properties: {
                    starred: starred,
                    bookmarked: bookmarked,
                },
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
                // prevent saves whilst we are updating state during load
                chatLoading.current = true; // note: this will be reset in the [messages] useEffect hook

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
                    setTags([]);
                }

                if (uploadedChat?.metadata?.properties && uploadedChat.metadata.properties.hasOwnProperty("starred")) {
                    setStarred(uploadedChat.metadata.starred);
                } else {
                    setStarred(false);
                }

                if (uploadedChat?.metadata?.properties && uploadedChat.metadata.properties.hasOwnProperty("bookmarked")) {
                    setStarred(uploadedChat.metadata.bookmarked);
                } else {
                    setBookmarked(false);
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
        };
        reader.readAsText(event);
        setUploadingFile(false);
        setFileToUpload(null);
    };

    const handleUploadRequest = () => {
        setUploadingFile(true);
    }

    const save = () => {
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

    const handleChatPromptKeyup = (event) => {
        setPromptLength(chatPromptRef.current.innerText.length);
    }

    const handleChatPromptKeydown = (event) => {
        if(event.key === 'Enter'  && !event.shiftKey && chatPromptRef.current.innerText !== "") {
            setLastPrompt(chatPromptRef.current.innerText);
            setPromptToSend({prompt: chatPromptRef.current.innerText, timestamp: Date.now()});
            event.preventDefault();
        } else if(event.key === 'Escape') {
            setChatPrompt("");
            event.preventDefault();
        } else if(event.key === '/' && chatPromptRef.current.innerText === "") {
            event.preventDefault();
            setMenuPromptEditorAnchorEl(promptEditorMenuRef.current);
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
    };

    const handleStopStreaming = (event) => {
        console.log("handleStopStreaming");
        stopStreamingRef.current = true;
        // wait a second and then close the chat stream
        setTimeout(() => {
            closeChatStream(); console.log("closeChatStream");
        }, 1000);
    };

    const handleAskAgain = () => {
        if (lastPrompt) {
            // if the last user message is the same as the last prompt, just say "Ask again"
            console.log(messages);
            if (messages.length > 1 && lastPrompt === messages[messages.length - 2].content) {
                sendPrompt("That answer wasn't quite what I was looking for. Please try again.");
            } else {
                sendPrompt(lastPrompt);
            }
        }
    };

    const handleReload = () => {
        setChatPrompt(lastPrompt);
        setPromptFocus();
    };

    const handleDeleteLastPromptResponse = () => {
        if (messages.length > 1) {
            setMessages(messages.slice(0, -2));
        }
    };

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
                "properties": {
                    "starred": false,
                    "bookmarked": false,
                },
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

    const handleMenuMessageContextOpen = (event, message, index) => {
        // to handle right-click and click on a message
        event.preventDefault();
        setMenuMessageContext(
          menuMessageContext === null
            ? {
                mouseX: event.clientX + 2,
                mouseY: event.clientY - 6,
                message: message,
                index: index,
              }
            : null,
        );
    };

    const handleMenuMessageContextClose = () => {
        setMenuMessageContext(null);
    };

    const handleMenuPanelOpen = (event) => {
        setMenuPanelAnchorEl(event.currentTarget);
    };

    const handleMenuPanelClose = () => {
        setMenuPanelAnchorEl(null);
    };

    const handleMenuPromptEditorOpen = (event) => {
        setMenuPromptEditorAnchorEl(event.currentTarget);
    };

    const handleMenuPromptEditorClose = () => {
        setMenuPromptEditorAnchorEl(null);
    }

    const closeMenus = () => {
        handleMenuPanelClose();
        handleMenuCommandsClose();
        handleMenuCommandsOnSelectionClose();
        handleMenuExplorationClose();
        handleMenuAnalysisClose();
        handleMenuInsightsClose();
        handleMenuCreativityClose();
        handleMenuMessageContextClose();
        handleMenuPromptEditorClose();
        handleMenuPromptsClose();
        handleMenuDiagramsClose();
    }

    const runMenuAction = (functionToRun, thenFocusOnPrompt=true) => {
        closeMenus();
        if (thenFocusOnPrompt) {
            setFocusOnPrompt(Date.now());
        }
        functionToRun && functionToRun();
    };

    const handleMenuPromptsOpen = (event) => {
        setMenuPromptsAnchorEl(event.currentTarget);
    };

    const handleMenuPromptsClose = () => {
        setMenuPromptsAnchorEl(null);
    };
    
    const handleMenuDiagramsOpen = (event) => {
        setMenuDiagramsAnchorEl(event.currentTarget);
    };

    const handleMenuDiagramsClose = () => {
        setMenuDiagramsAnchorEl(null);
    };

    const handleMenuCommandsOpen = (event) => {
        setMenuCommandsAnchorEl(event.currentTarget);
    };

    const handleMenuCommandsClose = () => {
        setMenuCommandsAnchorEl(null);
    };

    const handleMenuInsightsOpen = (event) => {
        setMenuInsightsAnchorEl(event.currentTarget);
    };

    const handleMenuInsightsClose = () => {
        setMenuInsightsAnchorEl(null);
    };

    const handleMenuExplorationOpen = (event) => {
        setMenuExplorationAnchorEl(event.currentTarget);
    };

    const handleMenuExplorationClose = () => {
        setMenuExplorationAnchorEl(null);
    };

    const handleMenuAnalysisOpen = (event) => {
        setMenuAnalysisAnchorEl(event.currentTarget);
    }

    const handleMenuAnalysisClose = () => {
        setMenuAnalysisAnchorEl(null);
    };

    const handleMenuCreativityOpen = (event) => {
        setMenuCreativityAnchorEl(event.currentTarget);
    };

    const handleMenuCreativityClose = () => {
        setMenuCreativityAnchorEl(null);
    };

    const handleMenuCommandsOnSelectionOpen = (event) => {
        setMenuCommandsOnSelectionAnchorEl(event.currentTarget);
    };

    const handleMenuCommandsOnSelectionClose = () => {
        setMenuCommandsOnSelectionAnchorEl(null);
    };

    const handleCopyHighlightedText = () => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const text = range.toString();
        navigator.clipboard.writeText(text);
        setMenuMessageContext(null);
    };
    
    const handleCopyMessageAsText = () => {
        const selectedText = menuMessageContext.message.content;
        navigator.clipboard.writeText(selectedText);
        setMenuMessageContext(null);
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
        setMenuMessageContext(null);
    };

    const handleCopyMessageAsHTML = () => {
        new ContentFormatter(menuMessageContext.message.content).copyAsHtml();
        setMenuMessageContext(null);
    };

    const handleCopyAllAsHTML = () => {
        let html = messagesAs("markdown");
        new ContentFormatter(html).copyAsHtml();
        setMenuMessageContext(null);
    };

    const reset = () => {
        let chatLoadingState = chatLoading.current;
        chatLoading.current = true;
        setId("");
        setName(newChatName);
        setPreviousName(newChatName);
        setMessages([]);
        setTags([]);
        setStarred(false);
        setBookmarked(false);
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
        const updatedMessages = messages.filter((message, index) => index !== menuMessageContext.index);
        setMessages(updatedMessages);
        setMenuMessageContext(null);
    };

    const handleDeleteThisAndPreviousMessage = () => {
        const updatedMessages = messages.filter((message, index) => index !== menuMessageContext.index);
        if (menuMessageContext.index > 0) {
            updatedMessages.splice(menuMessageContext.index - 1, 1);
        }
        setMessages(updatedMessages);
        setMenuMessageContext(null);
    };

    const handleDeleteAllMessages = () => {
        setMessages([]);
        setMenuMessageContext(null);
    };

    const handleDeleteAllMessagesUpToHere = () => {
        const updatedMessages = messages.slice(menuMessageContext.index + 1);
        setMessages(updatedMessages);
        setMenuMessageContext(null);
    };

    const handleDeleteAllMessagesFromHere = () => {
        if (menuMessageContext.index > 0) {
            const updatedMessages = messages.slice(0, menuMessageContext.index);
            setMessages(updatedMessages);
            setMenuMessageContext(null);
        }
    };

    const handleUseAsChatInput = () => {
        setChatPrompt(menuMessageContext.message.content);
        setPromptFocus();
        setMenuMessageContext(null);
    };

    const handleAppendToChatInput = () => {
        let newPrompt = chatPromptRef.current.innerText.trim() + " " + menuMessageContext.message.content.trim();
        setChatPrompt(newPrompt);
        setPromptFocus();
        setMenuMessageContext(null);
    };

    const handleAppendToNote = () => {
        setAppendNoteContent({ content: menuMessageContext.message.content, timestamp: Date.now() });
        setMenuMessageContext(null);
    };

    const handleAppendAllToNote = () => {
        let newNoteContent = "";
        messages.forEach((message) => {
            newNoteContent += message.content + "\n\n";
        });
        setAppendNoteContent({ content: newNoteContent, timestamp: Date.now() });
        setMenuMessageContext(null);
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

    const ActionMenu = React.forwardRef(({name, prompt, tooltip, onClick}, ref) => {
        const menuItem = 
            <MenuItem
                sx={{ width: "100%", whiteSpace: 'normal' }}
                ref={ref}
                onClick={
                    (event) => 
                        {
                            onClick && onClick();
                            if (event.altKey || messages.length === 0) {
                                runMenuAction(()=>{setChatPrompt(prompt)});
                            } else {
                                runMenuAction(()=>{sendPrompt(prompt)});
                            }
                        }
                }
                onKeyDown={
                    (event) => {
                        if (event.key === 'ArrowRight') {
                            onClick && onClick();
                            runMenuAction(()=>{setChatPrompt(prompt)});
                        }
                    }
                }

            >
                {name === undefined ? prompt : name}
            </MenuItem>;
        const result = tooltip ?
            <Tooltip title={tooltip} placement="right">
                {menuItem}
            </Tooltip>
            : menuItem;
        return result;
    });
    
    const ActionOnTextMenu = ({prompt, text, onClick}) => {
        return (
            <MenuItem onClick={ (event) => {
                onClick && onClick();
                if (event.altKey) {
                    runMenuAction(()=>{setChatPrompt(prompt + ": " + text)});
                } else {
                    runMenuAction(()=>{sendPrompt(prompt + ": " + text)});
                }
                }}>{prompt}</MenuItem>
        )
    }

    const promptSelectionInstructions = "Click on a prompt to run it, ALT+Click (or Right-Arrow when using via slash command) to place in prompt editor so you can edit it";
    const diagramSelectionInstructions = "Click on a diagram (or press enter) to generate it based on context, ALT+Click (or Right-Arrow when using via slash command) to place in prompt editor so you can edit it and describe what you want";
    const toolbar =
    <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
        <IconButton edge="start" color="inherit" aria-label="Sidekick Chat Menu"
            onClick={handleMenuPanelOpen}
            disabled={promptPlaceholder === userPromptWaiting}
        >
            <CommentIcon/>
        </IconButton>
        <Typography sx={{mr:2}}>Chat</Typography>
        <Tooltip title={ id === "" ? "You are in a new chat" : "New chat"}>
            <span>
                <IconButton edge="start" color="inherit" aria-label="menu"
                    disabled={ id === "" } onClick={handleNewChat}
                >
                    <AddOutlinedIcon/>
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title={ bookmarked ? "Unbookmark this chat" : "Bookmark this chat"}>
            <span>
                <IconButton edge="start" color="inherit" aria-label={bookmarked ? "Unbookmark this chat" : "Bookmark this chat"}
                    disabled={ id === "" } onClick={ () => {setBookmarked(x=>!x)} }
                >
                    {bookmarked ? <BookmarkIcon/> : <BookmarkBorderIcon/>}
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title={ starred ? "Unstar this chat" : "Star this chat"}>
            <span>
                <IconButton edge="start" color="inherit" aria-label={starred ? "Unstar this chat" : "Star this chat"}
                    disabled={ id === "" } onClick={ () => {setStarred(x=>!x)} }
                >
                    {starred ? <StarIcon/> : <StarBorderIcon/>}
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
            {
                isMobile ? null :
                    <Tooltip title={ windowMaximized ? "Shrink window" : "Expand window" }>
                        <IconButton edge="end" color="inherit" aria-label={ windowMaximized ? "Shrink window" : "Expand window" } onClick={handleToggleWindowMaximise}>
                            { windowMaximized ? <CloseFullscreenIcon/> : <OpenInFullIcon/> }
                        </IconButton>
                    </Tooltip>
            }
            <Tooltip title="Close window">
                <IconButton onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </Tooltip>
        </Box>
        <Menu
            id="menu-chat"
            anchorEl={menuPanelAnchorEl}
            open={Boolean(menuPanelAnchorEl)}
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
            <MenuItem onClick={handleMenuPromptsOpen}
                onKeyDown={
                    (event) => {
                        if (event.key === 'ArrowRight') {
                            handleMenuPromptsOpen(event);
                        }
                    }
                }    
            >
                <ListItemIcon><LibraryBooksIcon/></ListItemIcon>
                Prompt Library
                <IconButton  edge="end" style={{ padding: 0 }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </MenuItem>
            <MenuItem onClick={() => {handleMenuPanelClose(); handleNewChat();}}>
                <ListItemIcon><AddOutlinedIcon/></ListItemIcon>
                New Chat
            </MenuItem>
            <MenuItem onClick={() => {handleMenuPanelClose(); handleCloneChat();}} disabled={id === ""}>
                <ListItemIcon><FileCopyIcon/></ListItemIcon>
                Clone Chat
            </MenuItem>
            <MenuItem onClick={() => {handleMenuPanelClose(); handleDownload();}}>
                <ListItemIcon><FileDownloadIcon/></ListItemIcon>
                Download Chat
            </MenuItem>
            <MenuItem onClick={() => {handleMenuPanelClose(); handleUploadRequest();}}>
                <ListItemIcon><FileUploadIcon/></ListItemIcon>
                Upload Chat
            </MenuItem>
            <MenuItem onClick={() => {handleMenuPanelClose(); handleToggleMarkdownRendering();}}>
            <ListItemIcon>{ markdownRenderingOn ? <CodeOffIcon/> : <CodeIcon/> }</ListItemIcon>
                { markdownRenderingOn ? "Turn off markdown rendering" : "Turn on markdown rendering" }</MenuItem>
            {
                isMobile ? null :
                <MenuItem onClick={() => {handleMenuPanelClose(); handleToggleWindowMaximise();}}>
                    <ListItemIcon>{ windowMaximized ? <CloseFullscreenIcon/> : <OpenInFullIcon/> }</ListItemIcon>
                    { windowMaximized ? "Shrink window" : "Expand window" }
                </MenuItem>
            }
            <MenuItem onClick={() => {handleMenuPanelClose(); handleDeleteChat();}}>
                <ListItemIcon><DeleteIcon/></ListItemIcon>
                Delete Chat
            </MenuItem>
        </Menu>
        <Menu
            id="menu-prompt-editor"
            anchorEl={menuPromptEditorAnchorEl}
            open={Boolean(menuPromptEditorAnchorEl)}
            onClose={closeMenus}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        closeMenus();
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <MenuItem
                onClick={handleMenuPromptsOpen}
                onKeyDown={
                    (event) => {
                        if (event.key === 'ArrowRight') {
                            handleMenuPromptsOpen(event);
                        }
                    }
                }
                >
                <ListItemIcon><LibraryBooksIcon/></ListItemIcon>
                Prompt Library
                <IconButton  edge="end" style={{ padding: 0 }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </MenuItem>
            <MenuItem
                onClick={handleMenuDiagramsOpen}
                onKeyDown={
                    (event) => {
                        if (event.key === 'ArrowRight') {
                            handleMenuDiagramsOpen(event);
                        }
                    }
                }
                >
                <ListItemIcon><SchemaIcon/></ListItemIcon>
                Diagrams
                <IconButton  edge="end" style={{ padding: 0 }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </MenuItem>
            <MenuItem onClick={() => {runMenuAction(togglePromptEngineerOpen, false);}}>
                <ListItemIcon><BuildIcon/></ListItemIcon>
                Prompt Engineer
            </MenuItem>
            <MenuItem onClick={() => {runMenuAction(handleReload);}}>
                <ListItemIcon><RedoIcon/></ListItemIcon>
                Reload last prompt for editing
            </MenuItem>
            <MenuItem onClick={() => {runMenuAction(handleAskAgain);}}>
                <ListItemIcon><ReplayIcon/></ListItemIcon>
                Ask again
            </MenuItem>
            <MenuItem onClick={() => {runMenuAction(handleDeleteLastPromptResponse);}}>
                <ListItemIcon><SpeakerNotesOffIcon/></ListItemIcon>
                Delete last prompt/response
            </MenuItem>
            <MenuItem onClick={() => {runMenuAction(handleNewChat);}}>
                <ListItemIcon><AddOutlinedIcon/></ListItemIcon>
                New Chat
            </MenuItem>
            <MenuItem onClick={() => {runMenuAction(handleToggleMarkdownRendering);}}>
                <ListItemIcon>{ markdownRenderingOn ? <CodeOffIcon/> : <CodeIcon/> }</ListItemIcon>
                { markdownRenderingOn ? "Turn off markdown rendering" : "Turn on markdown rendering" }
            </MenuItem>
            {
                isMobile ? null :
                <MenuItem onClick={() => {runMenuAction(handleToggleWindowMaximise);}}>
                    <ListItemIcon>{ windowMaximized ? <CloseFullscreenIcon/> : <OpenInFullIcon/> }</ListItemIcon>
                    { windowMaximized ? "Shrink window" : "Expand window" }
                </MenuItem>
            }
            <MenuItem onClick={() => {runMenuAction(handleClose, false);}}>
                <ListItemIcon><CloseIcon/></ListItemIcon>
                Close Window
            </MenuItem>
        </Menu>
        <Menu
            id="chat-context-menu"
            open={menuMessageContext !== null}
            sx={{ width: isMobile ? "400px" : "100%" }}
            onClose={handleMenuMessageContextClose}
            anchorReference="anchorPosition"
            anchorPosition={
                menuMessageContext !== null
                ? { 
                    top: menuMessageContext.mouseY,
                    left: menuMessageContext.mouseX,
                    message: menuMessageContext.message,
                    index: menuMessageContext.index,
                }
                : { top: 0, left: 0 } // Default position
            }
        > 
            <MenuItem
                style={{ minHeight: '30px' }}
                disabled={!window.getSelection().toString() || promptPlaceholder === userPromptWaiting}
                onClick={handleMenuCommandsOnSelectionOpen}>
                <ListItemText>Commands on selection</ListItemText>
                <IconButton  edge="end" style={{ padding: 0 }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </MenuItem>
            <MenuItem
                style={{ minHeight: '30px' }} 
                disabled={messages.length === 0 || !!window.getSelection().toString() || promptPlaceholder === userPromptWaiting}
                onClick={handleMenuPromptsOpen}
            >
                <ListItemText>Prompts</ListItemText>
                <IconButton  edge="end" style={{ padding: 0 }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </MenuItem>
            <MenuItem
                style={{ height: '30px' }} 
                disabled={!window.getSelection().toString()}
                onClick={handleCopyHighlightedText}>
                Copy highlighted text
            </MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyMessageAsText}>Copy message as text</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyAllAsText}>Copy all as text</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyMessageAsHTML}>Copy message as html</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyAllAsHTML}>Copy all as html</MenuItem>
            <MenuItem divider style={{ minHeight: '10px' }} />
            <MenuItem style={{ height: '30px' }} onClick={handleAppendToChatInput}>Append message to chat input</MenuItem>
            <MenuItem style={{ minHeight: '10px' }} onClick={handleUseAsChatInput}>Use message as chat input</MenuItem>
            <MenuItem divider style={{ minHeight: '10px' }} />
            <MenuItem style={{ minHeight: '30px' }} disabled={!noteOpen} onClick={handleAppendToNote}>Append message to note</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} disabled={!noteOpen} onClick={handleAppendAllToNote}>Append all to note</MenuItem>
            <MenuItem divider style={{ minHeight: '10px' }} />
            <MenuItem style={{ minHeight: '30px' }} onClick={handleDeleteThisMessage}>Delete this message</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleDeleteThisAndPreviousMessage}>Delete this and previous message</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleDeleteAllMessagesUpToHere}>Delete this and all previous messages</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleDeleteAllMessagesFromHere}>Delete this and all subseqeunt messages</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleDeleteAllMessages}>Delete all messages</MenuItem>
        </Menu>
        <Menu 
            id="menu-prompts"
            anchorEl={menuPromptsAnchorEl}
            open={Boolean(menuPromptsAnchorEl)}
            onClose={handleMenuPromptsClose}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        handleMenuPromptsClose(event);
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            >
            <Tooltip title={promptSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuPromptsClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Prompts
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuPromptsClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <Tooltip title="Quickly send one of a number of simple common commands to the AI." placement="right">
                <MenuItem onClick={handleMenuCommandsOpen}
                    onKeyDown={
                        (event) => {
                            if (event.key === 'ArrowRight') {
                                handleMenuCommandsOpen(event);
                            }
                        }
                    }
                >
                    <ListItemText>Commands</ListItemText>
                    <IconButton  edge="end" style={{ padding: 0 }}>
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <Tooltip title="Explore the situation further by asking a series of simple questions that span causes, effects, stakeholders, perspectives, and strategies for preventing, improving, or coping with a situation." placement="right">
                <MenuItem onClick={handleMenuExplorationOpen}
                    onKeyDown={
                        (event) => {
                            if (event.key === 'ArrowRight') {
                            handleMenuExplorationOpen(event);
                            }
                        }
                    }
                >
                    <ListItemText>Exploration</ListItemText>
                    <IconButton  edge="end" style={{ padding: 0 }}>
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <Tooltip title="Apply well-known analytical and strategic tools and methodologies designed to inform decision-making, improve the rigor and completeness of problem-solving, and navigate complex challenges effectively." placement="right">
                <MenuItem onClick={handleMenuAnalysisOpen}
                    onKeyDown={
                        (event) => {
                            if (event.key === 'ArrowRight') {
                                handleMenuAnalysisOpen(event);
                            }
                        }
                    }
                >
                    <ListItemText>Analysis</ListItemText>
                    <IconButton  edge="end" style={{ padding: 0 }}>
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <Tooltip title="Apply creativity methods to stimulate out-of-the-box thinking, explore new perspectives, and generate new ideas to overcome challenges and avoid getting stuck in a rut." placement="right">
                <MenuItem onClick={handleMenuCreativityOpen}
                    onKeyDown={
                        (event) => {
                            if (event.key === 'ArrowRight') {
                                handleMenuCreativityOpen(event);
                            }
                        }
                    }
                >
                    <ListItemText>Creativity</ListItemText>
                    <IconButton  edge="end" style={{ padding: 0 }}>
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <Tooltip title="Get insights to help with understanding and learning more about the situation to come up with strategies and actions to improve it." placement="right">
                <MenuItem onClick={handleMenuInsightsOpen}
                    onKeyDown={
                        (event) => {
                            if (event.key === 'ArrowRight') {
                                handleMenuInsightsOpen(event);
                            }
                        }
                    }
                >
                    <ListItemText>Insights</ListItemText>
                    <IconButton  edge="end" style={{ padding: 0 }}>
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
        </Menu>
        <Menu 
            id="menu-diagrams"
            anchorEl={menuDiagramsAnchorEl}
            open={Boolean(menuDiagramsAnchorEl)}
            onClose={handleMenuDiagramsClose}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        handleMenuDiagramsClose(event);
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Tooltip title={diagramSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuDiagramsClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Diagrams
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuDiagramsClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <ActionMenu name="Flowchart" prompt="Provide mermaid markdown for a flowchart for this"/>
            <ActionMenu name="Mind Map" prompt="Provide mermaid markdown for a mind map for this"/>
            <ActionMenu name="Use Case Diagram" prompt="Provide mermaid markdown for a use case diagram based on a left to right flowchart diagram that uses stadium-shaped nodes by wrapping the node names in round and square brackets ([node name]) for this"/>
            <ActionMenu name="Functional Decomposition Diagram" prompt="Provide mermaid markdown for a functional decomposition diagram showing functions as boxes. Sub-functions  of each function should be shown as subgraphs in their own boxes inside the box for the function they belong to for this"/>
            <ActionMenu name="Sequence Diagram" prompt="Provide mermaid markdown for a sequence diagram for this"/>
            <ActionMenu name="Class Diagram" prompt="Provide mermaid markdown for a class diagram for this"/>
            <ActionMenu name="Perimeter Diagram" prompt="Provide mermaid markdown for a perimeter diagram showing the perimeter as a box with a dashed line and the components of the system inside connected via firewall to systems outside the perimeter for this"/>
            <ActionMenu name="Entity Relationship Diagram" prompt="Provide mermaid markdown for an entity relationship diagram for this"/>
            <ActionMenu name="State Diagram" prompt="Provide mermaid markdown for a state diagram for this"/>
            <ActionMenu name="Timeline" prompt="Provide mermaid markdown for a timeline for this"/>
            <ActionMenu name="Gantt Chart" prompt="Provide mermaid markdown for a Gantt chart breaking it down into phases as appropriate for this"/>
        </Menu>
        <Menu
            id="menu-commands"
            anchorEl={menuCommandsAnchorEl}
            sx={{ width: isMobile ? "400px" : "100%" }}
            open={Boolean(menuCommandsAnchorEl)}
            onClose={handleMenuCommandsClose}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        handleMenuCommandsClose(event);
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: isMobile ? 'left' : 'right', // make better use of small screen space on mobile
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Tooltip title={promptSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuCommandsClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Commands
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuCommandsClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <ActionMenu prompt="Continue"/>
            <ActionMenu prompt="Summarise"/>
            <ActionMenu name="Summarise as bullets" prompt="Summarise key points as a bullet list"/>
            <ActionMenu name="Elaborate" prompt="Please elaborate on that"/>
            <ActionMenu name="Give examples" prompt="Please provide some examples"/>
            <ActionMenu prompt="Provide more detail"/>
            <ActionMenu prompt="Explain in simple terms"/>
            <ActionMenu prompt="Explain in detail"/>
            <ActionMenu name="Pros and cons" prompt="What are the pros and cons of that?"/>
            <ActionMenu name="Pivot topic" prompt="Let's pivot the conversation. Tell me about something different but related?"/>
            <ActionMenu name="Alternative perspective" prompt="Please provide an alternative perspective"/>
            <ActionMenu name="Contrary view" prompt="Propose a contrary view, explain how it is contrary and why it might be relevant and worth considering"/>
            <ActionMenu name="Compare options" prompt="Given the situation and potential options, compare and contrast options discussed with a few other possible options"/>
            <ActionMenu name="Be me" prompt="Given my previous messages and how I am directing this chat and where and how I am digging into the topics discussed, predict the next question I would ask, and answer it."/>
            <ActionMenu name="Ask a friend" prompt="Imagine I get my give smartest friends and colleagues to work on this with me. They are each very different in their experience, skills, and motivations, but they are all super-smart and keen to help. Predict a question each might ask and then answer it."/>
            <ActionMenu name="Background and history" prompt="Please give the background and history"/>
            <ActionMenu name="Predict the future" prompt="Predict future outcomes or scenarios this could lead to"/>
            <ActionMenu name="Go up a level" prompt="Let's go up a level. Describe the super-system that this system operates within. What is its role, what other systems are related to it, how do they support or hinder eachother?"/>
            <ActionMenu name="Go down a level" prompt="Let's go down a level. Describe the sub-systems of this system. What are they? How do they manifest in the system? What are their roles and dependencies?"/>
            <ActionMenu name="Simplify" prompt="How can we simplify this? Explain with examples."/>
            <ActionMenu name="Evolve with no action" prompt="What might this situation evolve into if no action is taken?"/>
            <ActionMenu name="Evolve with worsening action" prompt="What might this situation evolve into if the tensions are not resolved and the actions that are taken progressively make things worse?"/>
            <ActionMenu name="Evolve with improving action" prompt="What might this situation evolve into if the tensions are resolved and actions are taken to progressively improve the situation?"/>
            <ActionMenu name="Evolve with best action" prompt="What might this situation evolve into if the tensions are resolved and the best possible actions are taken to improve the situation?"/>
            <ActionMenu name="Report" prompt="Write a report summarising what we discussed. Use markdown for sections to include: Abstract (a one sentence summary), Introduction and Background, Topics discussed, Insights, Conclusions, Potential next steps. Where the chat does not include enough content to answer these sections, extrapolate it."/>
        </Menu>
        <Menu
            id="menu-commands-on-selection"
            anchorEl={menuCommandsOnSelectionAnchorEl}
            sx={{ width: isMobile ? "400px" : "100%" }}
            open={Boolean(menuCommandsOnSelectionAnchorEl)}
            onClose={handleMenuCommandsOnSelectionClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}                            
        >
            <Tooltip title={promptSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuCommandsOnSelectionClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Commands on selection
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuCommandsOnSelectionClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <ActionOnTextMenu prompt="Define" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Expand on" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Explain in simple terms" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Explain in detail" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Provide synonyms for" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Provide antonyms for" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Give examples of" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Give counter-examples of" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Give arguments for" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Give counter-arguments for" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="Provide history for" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="List related topics to" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="List trends related to" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="How can this help me" text={window.getSelection().toString()}/>
            <ActionOnTextMenu prompt="How might this hinder me" text={window.getSelection().toString()}/>
        </Menu>
        <Menu
            id="menu-exploration"
            sx={{ width: isMobile ? "400px" : "100%" }}
            anchorEl={menuExplorationAnchorEl}
            open={Boolean(menuExplorationAnchorEl)}
            onClose={handleMenuExplorationClose}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        handleMenuExplorationClose(event);
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: isMobile ? 'left' : 'right', // make better use of small screen space on mobile
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Tooltip title={promptSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuExplorationClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Exploration
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuExplorationClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <ActionMenu prompt="What questions does this raise?"/>
            <ActionMenu prompt="What are the implications of this?"/>
            <ActionMenu prompt="What topics are related to this?"/>
            <ActionMenu prompt="What trends are related to this?"/>
            <ActionMenu prompt="What led to this situation?"/>
            <ActionMenu prompt="Explain the key factors contributing to this situation"/>
            <ActionMenu prompt="Explain the fundamental principles underlying this"/>
            <ActionMenu prompt="What are the potential short-term and long-term impacts of this situation?"/>
            <ActionMenu prompt="How does this situation compare with historical precedents or trends?"/>
            <ActionMenu prompt="What are the most common misconceptions or misunderstandings about this situation?"/>
            <ActionMenu prompt="Where can I find more information or resources to deepen my understanding of this situation?"/>
            <ActionMenu prompt="What alternative perspectives or viewpoints exist on this situation?"/>
            <ActionMenu prompt="What stakeholders could be affected by this situation and how?"/>
            <ActionMenu prompt="How can this situation serve as a learning opportunity?"/>
            <ActionMenu prompt="In what ways could technology be leveraged to improve this situation?"/>
            <ActionMenu prompt="In what ways could processes be adapted to improve this situation?"/>
            <ActionMenu prompt="In what ways could organisational change improve this situation?"/>
            <ActionMenu prompt="How could this situation be leveraged as the basis of a business model?"/>
            <ActionMenu prompt="What skills and experience could help improve this situation?"/>
            <ActionMenu prompt="How could this situation have been prevented?"/>
            <ActionMenu prompt="What are the barriers to resolving this situation, and how can they be overcome?"/>
            <ActionMenu prompt="What are the potential risks and uncertainties associated with this situation?"/>
            <ActionMenu prompt="What are the ethical considerations related to this situation?"/>
            <ActionMenu prompt="What are the legal implications of this situation?"/>
            <ActionMenu prompt="Identify the key problems and conflicts in this situation. How could each be addressed?"/>
            <ActionMenu prompt="What strategies can be employed to mitigate unavoidable negative outcomes?"/>
            <ActionMenu prompt="What strategies can be employed to cope with negative outcomes that can't be mittigated?"/>
            <ActionMenu prompt="What does history tell us about this kind of situation?"/>
        </Menu>
        <Menu
            id="menu-analysis"
            anchorEl={menuAnalysisAnchorEl}
            sx={{ width: isMobile ? "400px" : "100%" }}
            open={menuAnalysisAnchorEl !== null}
            onClose={handleMenuAnalysisClose}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        handleMenuAnalysisClose(event);
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: isMobile ? 'left' : 'right', // make better use of small screen space on mobile
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Tooltip title={promptSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuAnalysisClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Analysis
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuAnalysisClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <ActionMenu 
                name="Balanced Scorecard" 
                prompt="Perform a Balanced Scorecard analysis on the chat content, identifying key metrics across financial, customer, internal process, and learning & growth perspectives." 
                tooltip="The Balanced Scorecard (BSC) is a strategic planning and management framework that translates an organization's vision and strategy into a coherent set of performance measures across four perspectives: financial, customer, internal processes, and learning and growth."
              
            />
            <ActionMenu
                name="Benefits Analysis"
                prompt="Conduct a Benefits Analysis on the topics discussed, identifying potential benefits, costs, and risks."
                tooltip="Benefits Analysis is a technique used to evaluate the potential benefits, costs, and risks associated with a decision, project, or investment. It helps in making informed decisions and assessing the value of an initiative."
              />
            <ActionMenu name="Business Model Canvas" prompt="Create a Business Model Canvas based on the chat content, identifying key partners, activities, resources, value propositions, customer relationships, channels, customer segments, cost structure, and revenue streams." tooltip="The Business Model Canvas is a strategic management template for developing new or documenting existing business models. It allows users to describe, design, challenge, invent, and pivot their business model."/>
            <ActionMenu name="Competitive Analysis" prompt="Conduct a Competitive Analysis on the chat content, identifying key competitors, their strengths and weaknesses, and potential strategies for differentiation." tooltip="Competitive Analysis is the process of evaluating your competitors' strategies, strengths, weaknesses, and market positions to identify opportunities and threats. It helps in shaping strategic responses to enhance competitive advantage."/>
            <ActionMenu name="Design Thinking" prompt="Apply Design Thinking principles to the conversation, identifying user needs, brainstorming solutions, and proposing prototypes." tooltip="Design Thinking is a user-centric approach that involves empathizing with users, defining problems, ideating solutions, prototyping, and testing. It fosters innovation and solves complex problems in a user-focused way."/>
            <ActionMenu name="Failure Modes Effects Analysis (FMEA)" prompt="Carry out a Failure Modes Effects Analysis (FMEA) on the issues discussed, ranking them by severity, occurrence, and detection." tooltip="Failure Modes Effects Analysis (FMEA) is a systematic technique for identifying potential failure modes within a system, classifying them according to their severity, occurrence, and detectability, to prioritize fixes and prevent future failures."/>
            <ActionMenu name="Gap Analysis" prompt="Conduct a Gap Analysis on the current discussion, identifying the difference between the current and desired states." tooltip="Gap Analysis is a process of comparing the actual performance with the potential or desired performance. It helps in identifying the gaps in a system, process, or business offering to recommend steps to bridge these gaps and enhance performance."/>
            <ActionMenu name="Kano Model Analysis" prompt="Perform a Kano Model Analysis on the needs or features discussed, categorizing them as Must-be, Performance, or Delighters." tooltip="Kano Model Analysis categorizes customer preferences into must-haves, performance attributes, and delighters or wow factors, helping in prioritizing features based on their impact on customer satisfaction."/>
            <ActionMenu name="Market Entry Strategy" prompt="Develop a Market Entry Strategy based on the conversation so far, including recommended modes of entry and potential barriers." tooltip="Market Entry Strategy involves analyzing and selecting the most viable approach to enter a new market, considering factors like competition, barriers to entry, market demand, and strategic fit."/>
            <ActionMenu name="MoSCoW Prioritisation" prompt="Apply MoSCoW Prioritisation to the topics discussed, categorizing them as Must have, Should have, Could have, or Won't have." tooltip="MoSCoW Prioritisation is a decision-making technique that helps in categorizing tasks and requirements into Must haves, Should haves, Could haves, and Won't haves, facilitating effective prioritization and resource allocation."/>
            <ActionMenu name="PEST Analysis" prompt="Conduct a PEST Analysis on the dialogue, examining Political, Economic, Social, and Technological factors." tooltip="PEST Analysis is a framework for analyzing the macro-environmental factors (Political, Economic, Social, Technological) that can impact an organization's strategies and future performance. It helps in understanding the broader forces affecting the business landscape."/>
            <ActionMenu name="Porters Five Forces" prompt="Analyze the chat content using Porter's Five Forces framework, identifying competitive rivalry, supplier power, buyer power, threat of substitution, and threat of new entry." tooltip="Porter's Five Forces is a model for analyzing an industry's competitive environment. It examines five forces that determine the intensity of competition and market profitability: competitive rivalry, bargaining power of suppliers, bargaining power of buyers, threat of new entrants, and threat of substitute products or services."/>
            <ActionMenu name="Root Cause Analysis" prompt="Perform a Root Cause Analysis on the issues raised in the chat, identifying underlying causes and suggesting solutions." tooltip="Root Cause Analysis (RCA) is a methodical approach used to identify the fundamental causes of problems or incidents to address the root issues, preventing recurrence rather than treating symptoms."/>
            <ActionMenu name="SMART Goals" prompt="Formulate SMART Goals based on the objectives discussed in the chat, ensuring they are Specific, Measurable, Achievable, Relevant, and Time-bound." tooltip="SMART Goals framework helps in setting clear, achievable goals by ensuring they are Specific, Measurable, Achievable, Relevant, and Time-bound. It provides a structured approach to goal setting for better performance and outcomes."/>
            <ActionMenu name="Six Thinking Hats" prompt="Apply the Six Thinking Hats method to the conversation, analyzing it from different perspectives: facts, emotions, caution, benefits, creativity, and process." tooltip="Six Thinking Hats is a critical thinking process that helps individuals and teams discuss and solve problems more effectively by looking at the situation from six distinct perspectives (White: facts, Red: emotions, Black: caution, Yellow: optimism, Green: creativity, Blue: process), facilitating a more rounded and thorough analysis."/>
            <ActionMenu name="Stakeholder Analysis" prompt="Conduct a Stakeholder Analysis on the chat content, identifying key stakeholders, their interests, and potential strategies for engagement." tooltip="Stakeholder Analysis is a technique used to identify and assess the influence and interests of key people, groups of people, or organizations that may significantly impact the success of your activity or project. It helps in developing strategies for engaging stakeholders effectively."/>
            <ActionMenu name="SWOT Analysis" prompt="Carry out a SWOT Analysis on the chat so far, identifying Strengths, Weaknesses, Opportunities, and Threats." tooltip="SWOT Analysis is a strategic planning tool used to identify and understand the Strengths, Weaknesses, Opportunities, and Threats related to business competition or project planning. It helps in crafting strategies that align with the organization's capabilities and market opportunities."/>
            <ActionMenu name="Value Chain Analysis" prompt="Perform a Value Chain Analysis on the discussion, examining activities that create value and could lead to competitive advantage." tooltip="Value Chain Analysis is a process of examining the steps involved in bringing a product or service from conception to distribution and beyond. It helps in identifying where value is added and how it can be enhanced to achieve a competitive advantage."/>
            <ActionMenu name="VPEC-T Analysis" prompt="Apply VPEC-T Analysis to the chat content, examining Values, Policies, Events, Content, and Trust." tooltip="VPEC-T Analysis stands for Values, Policies, Events, Content, and Trust. It's a framework for analyzing complex situations by examining the critical elements that influence decisions and actions in any context, focusing on understanding stakeholders' perspectives and the foundational elements that guide interactions."/>
            <ActionMenu name="Wardley Mapping" prompt="Create a Wardley Map based on the chat content, visualizing the landscape of the discussion and identifying areas for strategic focus." tooltip="Wardley Mapping is a strategy tool that helps in visualizing the structure of a business or service, mapping the components needed to serve the customer or user. It assists in understanding the current landscape, predicting future trends, and identifying strategic opportunities."/>
            <ActionMenu name="What If Analysis" prompt="Conduct a What If Analysis on the chat, exploring alternative scenarios and their potential outcomes." tooltip="What If Analysis is a systematic process to explore and evaluate potential outcomes of different scenarios based on varying parameters. It helps in decision making by anticipating possible challenges and opportunities, allowing for better preparedness and strategic planning."/>
            <ActionMenu name="Why-Why Analysis" prompt="Perform a Why-Why Analysis on the chat content, asking 'why' repeatedly to drill down to the root cause of a problem." tooltip="Why-Why Analysis is a problem-solving technique that involves repeatedly asking the question 'Why?' to peel away the layers of symptoms and reach the core of a problem. It's a simple yet effective method for uncovering the root cause of a problem and ensuring that solutions address this foundational issue."/>
        </Menu>
        <Menu
            id="menu-insights"
            anchorEl={menuInsightsAnchorEl}
            sx={{ width: isMobile ? "400px" : "100%" }}
            open={menuInsightsAnchorEl !== null}
            onClose={handleMenuInsightsClose}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        handleMenuInsightsClose(event);
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: isMobile ? 'left' : 'right', // make better use of small screen space on mobile
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            >
            <Tooltip title={promptSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuInsightsClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Insights
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuInsightsClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <ListSubheader>
                <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                Assessment & Analysis
                </Typography>
            </ListSubheader>
            <ActionMenu prompt="What are the pros and cons of this?"/>
            <ActionMenu prompt="What could improve the situation?"/>
            <ActionMenu prompt="What could worsen the situation?"/>
            <ActionMenu prompt="How can this be simplified?"/>
            <ActionMenu prompt="What are the blockers to progress?"/>
            <ActionMenu prompt="What are the enablers for progress?"/>
            <ActionMenu prompt="What common mistakes are usually made in this situation?"/>
            <ActionMenu prompt="What resources are typically available to help in this situation?"/>
            <ActionMenu prompt="What alternative perspectives or approaches should be considered?"/>

            <ListSubheader>
                <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                    Understanding & Learning
                </Typography>
            </ListSubheader>
            <ActionMenu prompt="What is the most effective approach to tackling this situation, and why?"/>
            <ActionMenu prompt="What recent advancements or tools apply to this situation?"/>
            <ActionMenu prompt="What is a good example where a similar challenge was successfully overcome?"/>
            <ActionMenu prompt="What resources (books, courses, websites) could give me a deeper understanding of this?"/>
            <ActionMenu prompt="What are the key factors for success in resolving this?"/>

            <ListSubheader>
                <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                    Strategy & Action
                </Typography>
            </ListSubheader>
            <ActionMenu prompt="What steps could be taken to address the situation starting today?"/>
            <ActionMenu prompt="What are the most critical challenges or obstacles in addressing this situation?"/>
            <ActionMenu prompt="What potential solutions or strategies could be tried?"/>
            <ActionMenu prompt="What measurable goals can be set to track progress?"/>
            <ActionMenu prompt="How can feedback be effectively gathered and utilised to adjust strategies?"/>
            <ActionMenu prompt="What lessons can be learnt from this situation?"/>
        </Menu>
        <Menu
            id="menu-creativity"
            anchorEl={menuCreativityAnchorEl}
            open={menuCreativityAnchorEl !== null}
            onClose={handleMenuCreativityClose}
            onKeyDown={
                (event) => {
                    if (event.key === 'ArrowLeft') {
                        handleMenuCreativityClose(event);
                    }
                }
            }
            anchorOrigin={{
                vertical: 'top',
                horizontal: isMobile ? 'left' : 'right', // make better use of small screen space on mobile
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Tooltip title={promptSelectionInstructions} placement="right">
                <MenuItem onClick={handleMenuCreativityClose}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Creativity
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuCreativityClose}>
                    <CloseIcon />
                    </IconButton>
                </MenuItem>
            </Tooltip>
            <ActionMenu
                name="Ansoff Matrix" prompt="Conduct an Ansoff Matrix analysis on the discussion so far, providing insights and recommendations."
                tooltip="The Ansoff Matrix explores growth strategies through market penetration, market development, product development, and diversification. It assesses risks and helps in strategic decision-making to achieve business growth."
            />
            <ActionMenu
                name="SCAMPER" prompt="Utilize the SCAMPER method on the topic discussed, exploring Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, and Reverse to generate new ideas."
                tooltip="SCAMPER is a creative thinking technique that guides users through different ways of improving or innovating existing products, services, or problems by modifying various aspects."
            />
            <ActionMenu name="Mind Mapping" prompt="Create a mind map around the current discussion topic, identifying and expanding on key ideas and their connections." tooltip="Mind Mapping is a visual brainstorming tool that helps structure information, helping users to better analyze, comprehend, synthesize, recall, and generate new ideas."
            />
            <ActionMenu name="Brainwriting" prompt="Silently write down ideas on the current topic, then compile and discuss them to explore further." tooltip="Brainwriting is an idea generation method that involves participants writing down their ideas on a specific topic before sharing them with the group to foster a broader range of ideas."
            />
            <ActionMenu name="Six Thinking Hats" prompt="Apply the Six Thinking Hats technique to the discussion, examining the topic from multiple perspectives including emotional, informational, logical, creative, critical, and organizational viewpoints." tooltip="Six Thinking Hats is a thinking framework that provides a means for groups to think together more effectively by adopting different perspectives, represented by six colored hats, to explore various aspects of a problem or a topic."
            />
            <ActionMenu name="Five Whys" prompt="Ask 'Why' five times in succession to delve deeper into the root cause of the topic at hand, uncovering underlying problems." tooltip="The Five Whys technique is a simple but powerful tool for cutting through the complexity of a problem to reach its root cause by repeatedly asking the question 'Why?'."
            />
            <ActionMenu name="Storyboarding" prompt="Develop a storyboard for the topic, creating a visual narrative to explore and communicate the ideas discussed." tooltip="Storyboarding is a sequential visual storytelling technique often used in film and animation but can be applied to any type of project to visually predict and explore scenes or concepts."
            />
            <ActionMenu name="Analogical Thinking" prompt="Draw analogies from unrelated fields to the current discussion to inspire new ideas and connections." tooltip="Analogical Thinking involves drawing parallels between different domains or experiences to generate creative insights and solutions by transferring knowledge from a familiar context to a new one."
            />
            <ActionMenu name="Attribute Listing" prompt="Break down the topic into attributes and suggest alterations to each, fostering a detailed exploration of possibilities." tooltip="Attribute Listing is a technique for exploring the potential variations of a product, service, or idea by systematically modifying its attributes to generate new possibilities."
            />
            <ActionMenu name="TRIZ" prompt="Apply TRIZ principles to identify and solve contradictions within the problem, generating innovative solutions." tooltip="TRIZ is a problem-solving, analysis, and forecasting tool derived from the study of patterns of invention in the global patent literature, offering a systematic approach for innovation."
            />
            <ActionMenu name="Random Input" prompt="Introduce a random stimulus (word, image, etc.) to encourage lateral thinking and inspire creativity around the topic." tooltip="Random Input is a creativity technique that uses unexpected or seemingly unrelated stimuli to spark innovative thinking and break conventional thought patterns."
            />
            <ActionMenu name="Forced Association" prompt="Create connections between the topic and randomly generated words or concepts, fostering unusual combinations and ideas." tooltip="Forced Association is a creativity method where seemingly unrelated ideas or concepts are deliberately combined, often leading to innovative solutions or new perspectives."
            />
            <ActionMenu name="Lotus Blossom" prompt="Expand ideas outward in a structured manner, exploring related themes and deeper layers of the topic." tooltip="Lotus Blossom is a creativity technique that helps expand thinking from a central idea, systematically exploring related themes and ideas in layers, much like unfolding a lotus flower."
            />
            <ActionMenu name="Reverse Thinking" prompt="Consider the opposite of usual assumptions or approaches to uncover unconventional solutions for the topic discussed." tooltip="Reverse Thinking, or reverse engineering the problem-solving process, involves looking at the problem from the end point or from an opposite perspective to uncover innovative solutions."
            />
            <ActionMenu name="Future Scenarios" prompt="Imagine future scenarios related to the topic, encouraging forward-thinking and speculative ideas." tooltip="Future Scenarios is a method for envisioning and analyzing possible futures to better understand potential opportunities and challenges, aiding in strategic planning and innovation."
            />
            <ActionMenu name="Provocation" prompt="Make a deliberately irrational statement about the topic to provoke out-of-the-box thinking and generate creative solutions." tooltip="Provocation is a technique used to challenge conventional thinking and stimulate radical ideas by proposing outrageous or seemingly nonsensical statements or questions."
            />
            <ActionMenu name="Role Storming" prompt="Adopt different roles or personas and generate ideas from the perspective of someone else related to the topic." tooltip="Role Storming is a brainstorming technique where participants assume different roles or personas, encouraging them to generate ideas from new and diverse perspectives."
            />
            <ActionMenu name="Wishful Thinking" prompt="Imagine ideal solutions without constraints for the topic, helping to identify desires and innovative paths forward." tooltip="Wishful Thinking involves imagining the best possible outcome or solution without the limitations of current constraints, often leading to the identification of innovative and ambitious goals."
            />
            <ActionMenu name="Checklists" prompt="Use creative checklists tailored to the topic, prompting consideration of aspects or angles not previously explored." tooltip="Checklists in a creative context are used to systematically explore a range of considerations or possibilities related to a topic, ensuring thorough exploration and idea generation."
            />
            <ActionMenu name="Morphological Analysis" prompt="Break down the problem into its components and systematically explore variations of each, combining them in new ways." tooltip="Morphological Analysis is a method for exploring all possible solutions to a multi-dimensional, complex problem by breaking it down into its components and examining the possible combinations of those elements."
            />
            <ActionMenu name="Boundary Relaxation" prompt="Relax constraints or assumptions about the problem, allowing for the exploration of more radical solutions." tooltip="Boundary Relaxation is a creative problem-solving technique that involves temporarily removing the usual limits or constraints around a problem to explore more innovative and unconventional solutions."
            />
        </Menu>
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

    const render = <Card id="chat-panel" ref={panelWindowRef} key={chatPanelKey}
                    sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, 
                    width: isMobile ? `${window.innerWidth}px` : (windowMaximized ? "calc(100vw - 12px)" : null),
                    minWidth: isMobile ? `${window.innerWidth}px` : "500px",
                    maxWidth: isMobile ? `${window.innerWidth}px` : (windowMaximized ? null : maxWidth ? maxWidth : "600px")
                    }}
                    >
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
                        <Box
                            position="relative"
                            style={{width:'100%'}}
                            onContextMenu={(event) => { handleMenuMessageContextOpen(event, message, index); }}
                            onClick={(event) => { isMobile && handleMenuMessageContextOpen(event, message, index); }}
                        >
                            <Card sx={{ 
                                padding: 2, 
                                width: "100%", 
                                backgroundColor: message.role === "user" ? (darkMode ? blueGrey[800] : "lightblue") : (darkMode ? lightBlue[900] : "lightyellow"),
                            }}
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
                            <HighlightOffIcon
                                style={{ position: 'absolute', top: 0, right: 0,
                                    color: darkMode ? 'lightgrey' : 'darkgrey' }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    // delete this message
                                    const newMessages = [...messages];
                                    newMessages.splice(index, 1);
                                    setMessages(newMessages);
                                }}
                                />
                        </Box>
                    </ListItem>
                ))}
                {streamingChatResponse && streamingChatResponse !== "" && 
                <ListItem id="streamingChatResponse" sx={{ paddingLeft: 0 }} >
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
                <IconButton ref={promptEditorMenuRef} edge="start" color="inherit" aria-label="Slash commands"
                    onClick={handleMenuPromptEditorOpen}>
                  <MenuIcon/>
                </IconButton>
                <Typography sx={{mr:2}}>Prompt Editor</Typography>
                <Tooltip title={ "Save prompt as template" }>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label="save prompt as template"
                            disabled={promptPlaceholder === userPromptWaiting} onClick={handleSavePromptAsTemplate}>
                            <SaveIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={ aiLibraryOpen ? "Hide AI Library" : `Show AI Library. You can then select notes to add to the chat context.
                You can add individual notes to the AI library by opening them in the Note editor and clicking on the 'Add to AI Library' button. 
                (${Object.keys(selectedAiLibraryNotes).length} knowledge notes currently loaded)`}>
                    <IconButton edge="start" color="inherit" aria-label={ aiLibraryOpen ? "Hide AI Library" : "Show AI Library."}
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
                { !isMobile
                    ? <TextStatsDisplay name="Prompt" sizeInCharacters={promptLength} maxTokenSize={myModelSettings.contextTokenSize}/>
                    : null
                }
                    {streamingChatResponse !== "" && 
                    <Tooltip title={ "Stop" }>
                        <span>
                            <IconButton id="chat-stop" edge="end" color="inherit" aria-label="stop"
                                onClick={() => { handleStopStreaming(); }}
                            >
                                <StopCircleIcon/>
                            </IconButton>
                        </span>
                    </Tooltip>}
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
            <Box position="relative">
                <div
                    // Using a div with a reference to the DOM element instead of TextField for performance reasons
                    // For large text content, TextField lag in rendering individual key strokes is unacceptable
                    id="chat-prompt"
                    ref={chatPromptRef}
                    tabIndex="-1" // To allow the div to receive focus
                    contentEditable={promptPlaceholder === userPromptWaiting ? "false" : "true"}
                    onInput={handleChatPromptInput}
                    onKeyDown={
                        (event) => {
                            editorEventHandlers.onKeyDown(event);
                            handleChatPromptKeydown(event);
                        }
                    }
                    onKeyUp={handleChatPromptKeyup}
                    onPaste={ (event) => { editorEventHandlers.onPaste(event); setChatPromptIsEmpty(false); }}
                    data-placeholder={promptPlaceholder}
                    className={chatPromptIsEmpty ? 'empty' : ''}
                    style={{
                        ...editorEventHandlers.style,
                        overflow: "auto",
                        minHeight: "56px",
                        maxHeight: "300px",
                        flex: 1,
                        marginTop: "auto",
                        padding: "18.5px 14px",
                        backgroundColor: darkMode ? grey[900] : 'white',
                        color: darkMode ? "rgba(255, 255, 255, 0.87)" : "rgba(0, 0, 0, 0.87)",
                        border: darkMode ? "1px solid rgba(200, 200, 200, 0.23)" : "1px solid rgba(0, 0, 0, 0.23)",
                    }}
                >
                </div>
                <HighlightOffIcon
                    style={{ position: 'absolute', top: 0, right: 0,
                        color: darkMode ? 'lightgrey' : 'darkgrey' }}
                    onClick={(event) => {event.stopPropagation(); setChatPrompt("");}}
                    />
            </Box>
            { aiLibraryOpen ? 
                <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 1, backgroundColor: darkMode ? grey[900] : grey[100] }}>
                    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", width: "100%" }}>
                        <SecondaryToolbar sx={{gap:1}} className={ClassNames.toolbar}>
                            <Typography fontWeight="bold">AI Library</Typography>
                            <Typography sx={{mr:1}}>Loaded notes: {Object.keys(selectedAiLibraryNotes).length}</Typography>
                            <TextStatsDisplay name="AI Library" sizeInCharacters={selectedAiLibraryFullTextSize} 
                                maxTokenSize={myModelSettings.contextTokenSize}/>
                            <Tooltip title='Close AI library'>
                                <IconButton sx={{ml:'auto'}} onClick={()=>{setAiLibraryOpen(false)}}>
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        </SecondaryToolbar>
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
            { !isMobile
                ? <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 2, backgroundColor: darkMode ? grey[900] : grey[100] }}>
                        <Typography color="textSecondary">Prompts: {promptCount}</Typography>
                        <Typography color="textSecondary">Responses: {responseCount}</Typography>
                        <Typography color="textSecondary">K-Notes: { Object.keys(selectedAiLibraryNotes).length }</Typography>
                        <Typography color="textSecondary">Total size: 
                            <TextStatsDisplay sx={{ ml:1 }} name="prompt + context" sizeInCharacters={messagesSize + promptLength + selectedAiLibraryFullTextSize}
                            maxTokenSize={myModelSettings.contextTokenSize} />
                        </Typography>
                    </Paper>
                : null
            }
        </Box>
    </Box>
</Card>;
    return ( chatOpen ? render : null )
  }

export default Chat;