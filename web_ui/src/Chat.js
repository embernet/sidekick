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
import { lightBlue, grey, blueGrey } from '@mui/material/colors';
import { MuiFileInput } from 'mui-file-input';
import { MODEL_DEFAULT_LANGUAGE } from './LanguageSelector';

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
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import HomeRepairServiceOutlinedIcon from '@mui/icons-material/HomeRepairServiceOutlined';
import ControlCameraIcon from '@mui/icons-material/ControlCamera';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { SystemContext } from './SystemContext';
import { SidekickClipboardContext } from './SidekickClipboardContext';

import ContentFormatter from './ContentFormatter';
import TextStatsDisplay from './TextStatsDisplay';
import AI from './AI';
import { StyledBox, StyledToolbar, SecondaryToolbar } from './theme';

import SidekickMarkdown from './SidekickMarkdown';
import NativeTextEditorEventHandlers from './NativeTextEditorEventHandlers';
import Toolbox from './Toolbox';
import ContentElement from './ContentElement';

const Chat = ({
    provider, modelSettings, persona,
    closeOtherPanels, restoreOtherPanels, windowMaximized, setWindowMaximized,
    newPromptPart, newPrompt, newPromptTemplate, loadChat, setAppendNoteContent,
    focusOnPrompt, setFocusOnPrompt, chatRequest, chatOpen, noteOpen, setChatOpen, darkMode,
    temperatureText, setTemperatureText, modelSettingsOpen, toggleModelSettingsOpen, togglePersonasOpen,
    onChange, personasOpen, promptEngineerOpen, togglePromptEngineerOpen, setOpenChatId, shouldAskAgainWithPersona, serverUrl, token, setToken,
    streamingChatResponse, setStreamingChatResponse, chatStreamingOn, maxWidth, isMobile, language }) => {
    
    const sidekickClipboard = useContext(SidekickClipboardContext);
    const panelWindowRef = useRef(null);
    const chatMessagesContainerRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const streamingChatResponseCardRef = useRef(null);
    const promptEditorMenuRef = useRef(null);
    const [chatPanelKey, setChatPanelKey] = useState(Date.now()); // used to force re-renders

    const newChatName = "New Chat"

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
    const [chatContext, setChatContext] = useState("");
    const [chatContextOpen, setChatContextOpen] = useState(true);
    const [chatGoal, setChatGoal] = useState("");
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
    const [menuToolboxesAnchorEl, setMenuToolboxesAnchorEl] = useState(null);
    const [menuToolboxesAnchors, setMenuToolboxesAnchors] = useState({});
    const [menuDiagramsAnchorEl, setMenuDiagramsAnchorEl] = useState(null);
    const [menuPanelAnchorEl, setMenuPanelAnchorEl] = useState(null);
    const [menuPromptEditorAnchorEl, setMenuPromptEditorAnchorEl] = useState(null);
    const [menuMessageContext, setMenuMessageContext] = useState(null);
    const [menuCommandsAnchorEl, setMenuCommandsAnchorEl] = useState(null);
    const [menuCommandsOnSelectionAnchorEl, setMenuCommandsOnSelectionAnchorEl] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [markdownRenderingOn, setMarkdownRenderingOn] = useState(true);
    const [settings, setSettings] = useState({});
    const [toolboxWidth, setToolboxWidth] = useState("250px");
    const [chatContextWidth, setChatContextWidth] = useState("300px");
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const chatLoading = useRef(false);
    const [folder, setFolder] = useState("chats");
    const [tags, setTags] = useState([]);
    const [bookmarked, setBookmarked] = useState(false);
    const [starred, setStarred] = useState(false);
    const [promptLength, setPromptLength] = useState(0);
    const [toolboxOpen, setToolboxOpen] = useState(false);
    const [toolboxes, setToolboxes] = useState({
        "metadata": {
            "name": "Toolboxes",
            "tags": [],
            "properties": {
                "defaultToolbox": "Chat",
                "description": "Prompt toolboxes for different AI chat use cases"
            }
        },
        "content": {
            "Commands": {
                "metadata": {
                    "name": "Chat",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Quickly send one of a number of simple common commands to the AI."
                    }
                },
                "content": {
                    "tools": {
                        "Continue": {
                            "properties": {
                                "favourite": true,
                                "description": "Continue the conversation"
                            },
                            "content": {
                                "prompt": "Continue"
                            }
                        },
                        "Summarise": {
                            "properties": {
                                "favourite": true,
                                "description": "Summarise the current discussion"
                            },
                            "content": {
                                "prompt": "Summarise the current discussion in one paragraph including the main topics discussed, any conclusions reached, and any outstanding questions or issues"
                            }
                        },
                        "Summarise as bullets": {
                            "properties": {
                                "favourite": true,
                                "description": "Summarise key points as a bullet list"
                            },
                            "content": {
                                "prompt": "Summarise key points as a bullet list; include any conclusions reached, and any outstanding questions or issues"
                            }
                        },
                        "Elaborate": {
                            "properties": {
                                "favourite": true,
                                "description": "Elaborate on that"
                            },
                            "content": {
                                "prompt": "Elaborate on that"
                            }
                        },
                        "Give examples": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide some examples"
                            },
                            "content": {
                                "prompt": "Provide some examples; include what are considered to be the most important examples, most common examples, more recent or innovative examples, and some less obvious examples"
                            }
                        },
                        "Provide more detail": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide more detail"
                            },
                            "content": {
                                "prompt": "Provide more detail; include any relevant background information, explanations, and examples"
                            }
                        },
                        "Explain in simple terms": {
                            "properties": {
                                "favourite": true,
                                "description": "Explain in simple terms"
                            },
                            "content": {
                                "prompt": "Explain in simple terms"
                            }
                        },
                        "Explain in detail": {
                            "properties": {
                                "favourite": true,
                                "description": "Explain in detail"
                            },
                            "content": {
                                "prompt": "Provide a detailed explanation; Include relevant concepts and definitions, key components, historical background, current relevance, along with some significant examples or applications. Additionally, discuss any controversies or debates surrounding this and potential future developments."
                            }
                        },
                        "Background and history": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide the background and history"
                            },
                            "content": {
                                "prompt": "Provide the background and history"
                            }
                        },
                        "Pros and cons": {
                            "properties": {
                                "favourite": true,
                                "description": "What are the pros and cons?"
                            },
                            "content": {
                                "prompt": "What are the pros and cons?"
                            }
                        },
                        "Simplify": {
                            "properties": {
                                "favourite": true,
                                "description": "How can we simplify this?"
                            },
                            "content": {
                                "prompt": "How can we simplify this? Start by describing the nature of the complexity, list ways in which it could be simplified in principle, and provide specific examples."
                            }
                        },
                        "Pivot topic": {
                            "properties": {
                                "favourite": true,
                                "description": "Pivot the conversation to a different but related topic."
                            },
                            "content": {
                                "prompt": "Let's pivot the conversation. Tell me about something different but related."
                            }
                        },
                        "Alternative perspective": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide an alternative perspective"
                            },
                            "content": {
                                "prompt": "Provide an alternative perspective"
                            }
                        },
                        "Contrary view": {
                            "properties": {
                                "favourite": true,
                                "description": "Propose a contrary view"
                            },
                            "content": {
                                "prompt": "Propose a contrary view, explain how it is contrary and why it might be relevant and worth considering"
                            }
                        },
                    }
                }
            },
            "Futurology": {
                "metadata": {
                    "name": "Futurology",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Prompts for exploring and envisioning potential future scenarios"
                    }
                },
                "content": {
                    "tools": {
                        "Predict Trends": {
                            "properties": {
                                "favourite": true,
                                "description": "Predict future trends"
                            },
                            "content": {
                                "prompt": "Predict the major trends in this domain for the next decade"
                            }
                        },
                        "Technological Advancements": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss future technological advancements"
                            },
                            "content": {
                                "prompt": "Discuss potential technological advancements in this field along with related trends and enablers and the ultimate implications of these advancements"
                            }
                        },
                        "Future Challenges": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify future challenges"
                            },
                            "content": {
                                "prompt": "Identify and explain the major challenges that might arise in the future related to this topic"
                            }
                        },
                        "Future Opportunities": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore future opportunities"
                            },
                            "content": {
                                "prompt": "Explore potential opportunities that could emerge in the future within this area"
                            }
                        },
                        "Scenario Planning": {
                            "properties": {
                                "favourite": true,
                                "description": "Create future scenarios"
                            },
                            "content": {
                                "prompt": "Create different future scenarios based on varying assumptions and conditions about what could change in this field"
                            }
                        },
                        "Impact on Society": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss the potential societal impact"
                            },
                            "content": {
                                "prompt": "Discuss how future developments in this field could impact society"
                            }
                        },
                        "Ethical Considerations": {
                            "properties": {
                                "favourite": true,
                                "description": "Examine ethical considerations"
                            },
                            "content": {
                                "prompt": "Examine the ethical considerations and dilemmas that might arise with future advancements in this area"
                            }
                        },
                        "Future Innovations": {
                            "properties": {
                                "favourite": true,
                                "description": "Speculate on future innovations"
                            },
                            "content": {
                                "prompt": "Speculate on possible future innovations and their potential impact, include some incremental innovations and some game-changers"
                            }
                        },
                        "Long-term Vision": {
                            "properties": {
                                "favourite": true,
                                "description": "Articulate a long-term vision of the future"
                            },
                            "content": {
                                "prompt": "Articulate a long-term vision for the future of this topic, considering possible developments over the next 50 years"
                            }
                        },
                        "Global Impact": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss the global impact"
                            },
                            "content": {
                                "prompt": "Discuss the potential global impact of future developments in this field"
                            }
                        },
                        "Environmental Impact": {
                            "properties": {
                                "favourite": true,
                                "description": "Analyse the environmental impact"
                            },
                            "content": {
                                "prompt": "Analyse the potential environmental impact of future advancements in this area"
                            }
                        },
                        "Economic Impact": {
                            "properties": {
                                "favourite": true,
                                "description": "Evaluate the economic impact"
                            },
                            "content": {
                                "prompt": "Evaluate the potential economic impact of future trends and developments in this field"
                            }
                        },
                        "Cultural Shifts": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore potential cultural shifts"
                            },
                            "content": {
                                "prompt": "Explore how future trends might lead to cultural shifts and changes in societal norms"
                            }
                        },
                        "Policy Implications": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss policy implications"
                            },
                            "content": {
                                "prompt": "Discuss the potential policy implications and regulatory considerations for future developments in this area"
                            }
                        },
                        "Evolve with worsening action": {
                            "properties": {
                                "favourite": true,
                                "description": "What might this situation evolve into if the tensions are not resolved and the actions that are taken progressively make things worse?"
                            },
                            "content": {
                                "prompt": "What might this situation evolve into if the tensions are not resolved and the actions that are taken progressively make things worse?"
                            }
                        },
                        "Evolve with improving action": {
                            "properties": {
                                "favourite": true,
                                "description": "What might this situation evolve into if the tensions are resolved and actions are taken to progressively improve the situation?"
                            },
                            "content": {
                                "prompt": "What might this situation evolve into if the tensions are resolved and actions are taken to progressively improve the situation?"
                            }
                        },
                        "Evolve with worst action": {
                            "properties": {
                                "favourite": true,
                                "description": "What might this situation evolve into if the tensions are not resolved and the worst possible actions are taken to make things worse?"
                            },
                            "content": {
                                "prompt": "What might this situation evolve into if the tensions are not resolved and the worst possible actions are taken to make things worse?"
                            }
                        },
                        "Evolve with best action": {
                            "properties": {
                                "favourite": true,
                                "description": "What might this situation evolve into if the tensions are resolved and the best possible actions are taken to improve the situation?"
                            },
                            "content": {
                                "prompt": "What might this situation evolve into if the tensions are resolved and the best possible actions are taken to improve the situation?"
                            }
                        },
                    }
                }
            },
            "Ask others": {
                "metadata": {
                    "name": "Ask others",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Get more rounded perspectives by simulating consulting others"
                    }
                },
                "content": {
                    "tools": 
                    {
                        "Be me": {
                            "properties": {
                                "favourite": true,
                                "description": "Predict my next observations and question based on the chat."
                            },
                            "content": {
                                "prompt": "Considering my previous messages, the direction of our discussion, and the topics I've shown interest in, predict some insightful observations I might make and the next thoughtful question I would ask. Then, provide a detailed answer to that question."
                            }
                        },
                        "Consult a friend": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine my smartest friends are helping."
                            },
                            "content": {
                                "prompt": "Imagine my five smartest friends with diverse skills and motivations are collaborating on this. Predict some insightful observations each might make and a deep, thought-provoking question each might ask. Then, provide comprehensive answers to those questions."
                            }
                        },
                        "Ask a mentor": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine an expert mentor is advising."
                            },
                            "content": {
                                "prompt": "Imagine I have a wise and experienced mentor in this field. Predict some keen observations they might make and a profound, expert-level question they might ask. Then, provide a thorough and well-informed answer to that question."
                            }
                        },
                        "Ask a novice": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a curious novice is asking about this."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is new to this topic. Predict some fresh and curious observations they might make and a basic yet insightful question they might ask. Then, provide a clear and informative answer to that question."
                            }
                        },
                        "Ask a skeptic": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a critical skeptic is wading in."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is skeptical about this topic. Predict some critical and challenging observations they might make and a probing question they might ask. Then, provide a well-reasoned and robust answer to that question."
                            }
                        },
                        "Ask a supporter": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine an enthusiastic supporter is helping."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is very supportive of this topic. Predict some positive and enthusiastic observations they might make and an encouraging question they might ask. Then, provide a detailed and optimistic answer to that question."
                            }
                        },
                        "Ask a critic": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a harsh critic is raising challenges."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is critical of this topic. Predict some harsh and negative observations and challenges they might make and a challenging question they might ask. Then, provide a balanced and thoughtful answer to that question."
                            }
                        },
                        "Ask a visionary": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a creative visionary is helping."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is a visionary in this field. Predict some imaginative and forward-thinking observations they might make and an innovative question they might ask. Then, provide a creative and detailed answer to that question."
                            }
                        },
                        "Ask a realist": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a practical realist is helping."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is a realist about this topic. Predict some practical and grounded observations they might make and a sensible question they might ask. Then, provide a pragmatic and detailed answer to that question."
                            }
                        },
                        "Ask a dreamer": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine an imaginative dreamer is helping."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is a dreamer in this area. Predict some imaginative and idealistic observations they might make and a visionary question they might ask. Then, provide a thoughtful and aspirational answer to that question."
                            }
                        },
                        "Ask a pragmatist": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a sensible pragmatist is helping."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is a pragmatist about this topic. Predict some sensible and practical observations they might make and a solution-focused question they might ask. Then, provide a practical and actionable answer to that question."
                            }
                        },
                        "Ask a pessimist": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a skeptical pessimist is helping."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is pessimistic about this topic. Predict some negative and skeptical observations they might make and a questioning, doubtful question they might ask. Then, provide a balanced and well-reasoned answer to that question."
                            }
                        },
                        "Ask an optimist": {
                            "properties": {
                                "favourite": true,
                                "description": "Imagine a hopeful optimist is helping."
                            },
                            "content": {
                                "prompt": "Imagine I have a friend who is optimistic about this topic. Predict some positive and hopeful observations they might make and an encouraging question they might ask. Then, provide a detailed and uplifting answer to that question."
                            }
                        }
                    }                    
                }
            },
            "Debate": {
                "metadata": {
                    "name": "Debate",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Prompts for engaging in a debate or argument"
                    }
                },
                "content": {
                    "tools": {
                        "Refute": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide a refutation"
                            },
                            "content": {
                                "prompt": "Refute the arguments made. Explain the weaknesses or flaws in the reasoning and present evidence to disprove them."
                            }
                        },
                        "Cross-Examination": {
                            "properties": {
                                "favourite": true,
                                "description": "Conduct a cross-examination"
                            },
                            "content": {
                                "prompt": "Formulate questions to ask that clarify the arguments, expose contradictions, or highlight weaknesses. These questions should be aimed at undermining the credibility or validity of the points made."
                            }
                        },
                        "Signposting": {
                            "properties": {
                                "favourite": true,
                                "description": "Use signposting to structure your argument"
                            },
                            "content": {
                                "prompt": "Outline the structure of the argument clearly. Indicate when transitioning from one point to another to help people follow the reasoning easily."
                            }
                        },
                        "Evidence and Examples": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide evidence and examples"
                            },
                            "content": {
                                "prompt": "Use credible sources, statistics, expert opinions, and real-world examples to back up these arguments. Explain how this evidence supports the claims and adds weight to the argument."
                            }
                        },
                        "Analogies and Comparisons": {
                            "properties": {
                                "favourite": true,
                                "description": "Use analogies and comparisons"
                            },
                            "content": {
                                "prompt": "Draw parallels between the arguments and other well-understood situations. Use these analogies and comparisons to make the points more relatable and understandable."
                            }
                        },
                        "Anticipate Counterarguments": {
                            "properties": {
                                "favourite": true,
                                "description": "Anticipate counterarguments and construct responses"
                            },
                            "content": {
                                "prompt": "Predict counter arguments that are likely to be made and prepare responses. Explain how to counter each arguments to weaken their case."
                            }
                        },
                        "Rhetorical Questions": {
                            "properties": {
                                "favourite": true,
                                "description": "Use rhetorical questions to engage the audience"
                            },
                            "content": {
                                "prompt": "Formulate rhetorical questions that don't require an answer but are designed to make the audience think and reinforce the points. Explain how these questions support the argument."
                            }
                        },
                        "Summarisation": {
                            "properties": {
                                "favourite": true,
                                "description": "Summarise the arguments"
                            },
                            "content": {
                                "prompt": "Conclude the argument by summarising the main points. Reinforce why the proposed position is stronger and leave a lasting impression on the audience."
                            }
                        },
                        "Challenge assumptions": {
                            "properties": {
                                "favourite": true,
                                "description": "Challenge the assumptions made"
                            },
                            "content": {
                                "prompt": "Challenge the assumptions made with rationale and alternative perspectives"
                            }
                        },
                        "Propose a different approach": {
                            "properties": {
                                "favourite": true,
                                "description": "Propose a different approach"
                            },
                            "content": {
                                "prompt": "Propose a different approach aiming to be constructive and insightful whilst also being direct and candid about shortcomings of the current approach"
                            }
                        },
                        "Predict consequences": {
                            "properties": {
                                "favourite": true,
                                "description": "Predict the consequences, issues and questions raised"
                            },
                            "content": {
                                "prompt": "Predict the consequences of the situation along with risks this poses and questions this raises"
                            }
                        },
                        "Pivot argument": {
                            "properties": {
                                "favourite": true,
                                "description": "Pivot the debate to come at it from a different angle."
                            },
                            "content": {
                                "prompt": "Pivot the debate to come at it from a different angle; provide a fresh perspective or introduce a new line of argument."
                            }
                        },
                    }
                }
            },
            "Exploration": {
                "metadata": {
                    "name": "Exploration",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Explore the situation or topic further"
                    }
                },
                "content": {
                    "tools": {
                        "Questions raised": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore what questions this raises"
                            },
                            "content": {
                                "prompt": "What questions does this raise?"
                            }
                        },
                        "Implications": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore the implications of this"
                            },
                            "content": {
                                "prompt": "What are the implications of this?"
                            }
                        },
                        "Related topics": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify related topics"
                            },
                            "content": {
                                "prompt": "What topics are related to this?"
                            }
                        },
                        "Related trends": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify related trends"
                            },
                            "content": {
                                "prompt": "What trends are related to this?"
                            }
                        },
                        "Underlying principles": {
                            "properties": {
                                "favourite": true,
                                "description": "Explain the fundamental principles underlying this"
                            },
                            "content": {
                                "prompt": "Explain the fundamental principles underlying this"
                            }
                        },
                        "Historical precedents": {
                            "properties": {
                                "favourite": true,
                                "description": "Compare this situation with historical precedents or trends"
                            },
                            "content": {
                                "prompt": "How does this situation compare with historical precedents or trends?"
                            }
                        },
                        "Common misconceptions": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify common misconceptions or misunderstandings"
                            },
                            "content": {
                                "prompt": "What are the most common misconceptions or misunderstandings about this situation?"
                            }
                        },
                        "Learning resources": {
                            "properties": {
                                "favourite": true,
                                "description": "Find more information or resources"
                            },
                            "content": {
                                "prompt": "Where can I find more information or resources to deepen my understanding of this situation?"
                            }
                        },
                        "Alternative perspectives": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore alternative perspectives or viewpoints"
                            },
                            "content": {
                                "prompt": "What alternative perspectives or viewpoints exist on this situation?"
                            }
                        },
                        "Learning opportunities": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify learning opportunities from this situation"
                            },
                            "content": {
                                "prompt": "How can this situation serve as a learning opportunity?"
                            }
                        },
                        "Tech enablers": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify ways technology could improve this situation"
                            },
                            "content": {
                                "prompt": "In what ways could technology be leveraged to improve this situation?"
                            }
                        },
                        "Business model ideas": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore potential business model ideas and opportunities related to this"
                            },
                            "content": {
                                "prompt": "How could this situation be leveraged as the basis of a business model?"
                            }
                        },
                        "Go up a level": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore the super-system, ecosystem, and related systems"
                            },
                            "content": {
                                "prompt": "Let's go up a level. Describe the super-system that this system operates within. What is its role, what other systems are related to it?, to what extent do they form an ecosystem?, how do they support or hinder each other?"
                            }
                        },
                        "Go down a level": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore the sub-systems and dependencies"
                            },
                            "content": {
                                "prompt": "Let's go down a level. Describe the sub-systems and dependencies of this system. What are they? How do they manifest in the system? What are their roles in the success of the overall system?"
                            }
                        },
                    }
                }
            },
            "Problem Solving": {
                "metadata": {
                    "name": "Problem Solving",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Help with problem solving"
                    }
                },
                "content": {
                    "tools": {
                        "Causes": {
                            "properties": {
                                "favourite": true,
                                "description": "Explore the factors leading to this situation and what caused it"
                            },
                            "content": {
                                "prompt": "What led to this situation?"
                            }
                        },
                        "Contributing factors": {
                            "properties": {
                                "favourite": true,
                                "description": "Explain the key factors contributing to this situation"
                            },
                            "content": {
                                "prompt": "Explain the key factors contributing to this situation"
                            }
                        },
                        "Impact": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss potential short-term and long-term impacts"
                            },
                            "content": {
                                "prompt": "What are the potential short-term and long-term impacts of this situation?"
                            }
                        },
                        "Prevention": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss prevention strategies"
                            },
                            "content": {
                                "prompt": "How could this situation have been prevented?"
                            }
                        },
                        "Overcoming barriers": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify barriers and solutions"
                            },
                            "content": {
                                "prompt": "What are the barriers to resolving this situation, and how can they be overcome?"
                            }
                        },
                        "Risks and uncertainties": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify potential risks and uncertainties"
                            },
                            "content": {
                                "prompt": "What are the potential risks and uncertainties associated with this situation?"
                            }
                        },
                        "Compare and contrast": {
                            "properties": {
                                "favourite": true,
                                "description": "Compare and contrast a variety of options"
                            },
                            "content": {
                                "prompt": "Given the situation and potential options, compare and contrast the options discussed with a variety of other possible options"
                            }
                        },
                        "Predict outcomes": {
                            "properties": {
                                "favourite": true,
                                "description": "Predict outcomes and questions they raise"
                            },
                            "content": {
                                "prompt": "Predict potential outcomes and questions they raise"
                            }
                        },
                        "Evaluate options": {
                            "properties": {
                                "favourite": true,
                                "description": "Evaluate the options"
                            },
                            "content": {
                                "prompt": "Evaluate the options discussed, giving a balanced view of the pros and cons of each along with potential risks and benefits"
                            }
                        },
                        "Ethical considerations": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss ethical considerations"
                            },
                            "content": {
                                "prompt": "What are the ethical considerations related to this situation?"
                            }
                        },
                        "Legal implications": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss legal implications"
                            },
                            "content": {
                                "prompt": "What are the legal implications of this situation?"
                            }
                        },
                        "Problems & conflicts": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify key problems and conflicts and potential solutions"
                            },
                            "content": {
                                "prompt": "Identify the key problems and conflicts in this situation. How could each be addressed?"
                            }
                        },
                        "Skills & experience": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify skills and experience that could help"
                            },
                            "content": {
                                "prompt": "What skills and experience could help improve this situation?"
                            }
                        },
                        "Lessons from history": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss historical precedents and lessons"
                            },
                            "content": {
                                "prompt": "What does history tell us about this kind of situation?"
                            }
                        }
                    }
                }
            },
            "Change Management": {
                "metadata": {
                    "name": "Change Management",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Prompts for managing change and transformation"
                    }
                },
                "content": {
                    "tools": {
                        "Change drivers": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify the drivers for change"
                            },
                            "content": {
                                "prompt": "What are the drivers for change in this situation?"
                            }
                        },
                        "Change impacts": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss the impacts of change"
                            },
                            "content": {
                                "prompt": "What are the impacts of change in this situation?"
                            }
                        },
                        "Change resistance": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify potential resistance to change"
                            },
                            "content": {
                                "prompt": "What are the potential sources of resistance to change in this situation?"
                            }
                        },
                        "Change strategies": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss strategies for managing change"
                            },
                            "content": {
                                "prompt": "What strategies could be employed to manage change in this situation?"
                            }
                        },
                        "Stakeholder impact": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify affected stakeholders and their impact"
                            },
                            "content": {
                                "prompt": "What stakeholders could be affected by this situation and how?"
                            }
                        },
                        "Communication plan": {
                            "properties": {
                                "favourite": true,
                                "description": "Develop a communication plan for change"
                            },
                            "content": {
                                "prompt": "Develop a communication plan for managing change in this situation"
                            }
                        },
                        "Training needs": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify training needs for change"
                            },
                            "content": {
                                "prompt": "What training needs could arise from this situation?"
                            }
                        },
                        "Resource allocation": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss resource allocation for change"
                            },
                            "content": {
                                "prompt": "How should resources be allocated to manage change in this situation?"
                            }
                        },
                        "Change readiness": {
                            "properties": {
                                "favourite": true,
                                "description": "Assess the readiness for change"
                            },
                            "content": {
                                "prompt": "How can we assess the readiness of the organisation for this change?"
                            }
                        },
                        "Mitigating negative outcomes": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify mitigation strategies for negative outcomes"
                            },
                            "content": {
                                "prompt": "What strategies can be employed to mitigate unavoidable negative outcomes?"
                            }
                        },
                        "Coping strategies": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify coping strategies for unavoidable negative outcomes"
                            },
                            "content": {
                                "prompt": "What strategies can be employed to cope with negative outcomes that can't be mitigated?"
                            }
                        },
                        "Process improvements": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify ways processes could be adapted to improve this situation"
                            },
                            "content": {
                                "prompt": "In what ways could processes be adapted to improve this situation?"
                            }
                        },
                        "Org improvements": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify ways organisational change could improve this situation"
                            },
                            "content": {
                                "prompt": "In what ways could organisational change improve this situation?"
                            }
                        },
                        "Tech improvements": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify ways technology could be leveraged to improve this situation"
                            },
                            "content": {
                                "prompt": "In what ways could technology be leveraged to achieve the desired change?"
                            }
                        },
                        "Measuring success": {
                            "properties": {
                                "favourite": true,
                                "description": "Discuss how success will be measured and assured"
                            },
                            "content": {
                                "prompt": "Discuss what could be used as measures for success and how this could be tracked and fed back into the change process to help adjust course as needed"
                            }
                        },
                        "Feedback mechanisms": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify feedback mechanisms for continuous improvement"
                            },
                            "content": {
                                "prompt": "What feedback mechanisms could be put in place to ensure continuous improvement and success?"
                            }
                        },
                    }
                }
            },
            "Analysis": {
                "metadata": {
                    "name": "Analysis",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Apply well-known analytical and strategic tools and methodologies designed to inform decision-making, improve the rigor and completeness of problem-solving, and navigate complex challenges effectively."
                    }
                },
                "content": {
                    "tools": {
                        "Balanced Scorecard": {
                            "properties": {
                                "favourite": true,
                                "description": "Perform a Balanced Scorecard analysis on the chat content"
                            },
                            "content": {
                                "prompt": "Perform a Balanced Scorecard analysis on the chat content, identifying key metrics across financial, customer, internal process, and learning & growth perspectives."
                            }
                        },
                        "Benefits Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Conduct a Benefits Analysis on the topics discussed"
                            },
                            "content": {
                                "prompt": "Conduct a Benefits Analysis on the topics discussed, identifying potential benefits, costs, and risks."
                            }
                        },
                        "Business Model Canvas": {
                            "properties": {
                                "favourite": true,
                                "description": "Create a Business Model Canvas based on the chat content"
                            },
                            "content": {
                                "prompt": "Create a Business Model Canvas based on the chat content, identifying key partners, activities, resources, value propositions, customer relationships, channels, customer segments, cost structure, and revenue streams."
                            }
                        },
                        "Competitive Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Conduct a Competitive Analysis on the chat content"
                            },
                            "content": {
                                "prompt": "Conduct a Competitive Analysis on the chat content, identifying key competitors, their strengths and weaknesses, and potential strategies for differentiation."
                            }
                        },
                        "Design Thinking": {
                            "properties": {
                                "favourite": true,
                                "description": "Apply Design Thinking principles to the conversation"
                            },
                            "content": {
                                "prompt": "Apply Design Thinking principles to the conversation, identifying user needs, brainstorming solutions, and proposing prototypes."
                            }
                        },
                        "Failure Modes Effects Analysis (FMEA)": {
                            "properties": {
                                "favourite": true,
                                "description": "Carry out a Failure Modes Effects Analysis (FMEA) on the issues discussed"
                            },
                            "content": {
                                "prompt": "Carry out a Failure Modes Effects Analysis (FMEA) on the issues discussed, ranking them by severity, occurrence, and detection."
                            }
                        },
                        "Gap Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Conduct a Gap Analysis on the current discussion"
                            },
                            "content": {
                                "prompt": "Conduct a Gap Analysis on the current discussion, identifying the difference between the current and desired states."
                            }
                        },
                        "Kano Model Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Perform a Kano Model Analysis on the needs or features discussed"
                            },
                            "content": {
                                "prompt": "Perform a Kano Model Analysis on the needs or features discussed, categorizing them as Must-be, Performance, or Delighters."
                            }
                        },
                        "Market Entry Strategy": {
                            "properties": {
                                "favourite": true,
                                "description": "Develop a Market Entry Strategy based on the conversation"
                            },
                            "content": {
                                "prompt": "Develop a Market Entry Strategy based on the conversation so far, including recommended modes of entry and potential barriers."
                            }
                        },
                        "MoSCoW Prioritisation": {
                            "properties": {
                                "favourite": true,
                                "description": "Apply MoSCoW Prioritisation to the topics discussed"
                            },
                            "content": {
                                "prompt": "Apply MoSCoW Prioritisation to the topics discussed, categorizing them as Must have, Should have, Could have, or Won't have."
                            }
                        },
                        "PEST Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Conduct a PEST Analysis on the dialogue"
                            },
                            "content": {
                                "prompt": "Conduct a PEST Analysis on the dialogue, examining Political, Economic, Social, and Technological factors."
                            }
                        },
                        "Porters Five Forces": {
                            "properties": {
                                "favourite": true,
                                "description": "Analyze the chat content using Porter's Five Forces framework"
                            },
                            "content": {
                                "prompt": "Analyze the chat content using Porter's Five Forces framework, identifying competitive rivalry, supplier power, buyer power, threat of substitution, and threat of new entry."
                            }
                        },
                        "Root Cause Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Perform a Root Cause Analysis on the issues raised in the chat"
                            },
                            "content": {
                                "prompt": "Perform a Root Cause Analysis on the issues raised in the chat, identifying underlying causes and suggesting solutions."
                            }
                        },
                        "SMART Goals": {
                            "properties": {
                                "favourite": true,
                                "description": "Formulate SMART Goals based on the objectives discussed in the chat"
                            },
                            "content": {
                                "prompt": "Formulate SMART Goals based on the objectives discussed in the chat, ensuring they are Specific, Measurable, Achievable, Relevant, and Time-bound."
                            }
                        },
                        "Six Thinking Hats": {
                            "properties": {
                                "favourite": true,
                                "description": "Apply the Six Thinking Hats method to the conversation"
                            },
                            "content": {
                                "prompt": "Apply the Six Thinking Hats method to the conversation, analyzing it from different perspectives: facts, emotions, caution, benefits, creativity, and process."
                            }
                        },
                        "Stakeholder Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Conduct a Stakeholder Analysis on the chat content"
                            },
                            "content": {
                                "prompt": "Conduct a Stakeholder Analysis on the chat content, identifying key stakeholders, their interests, and potential strategies for engagement."
                            }
                        },
                        "SWOT Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Carry out a SWOT Analysis on the chat so far"
                            },
                            "content": {
                                "prompt": "Carry out a SWOT Analysis on the chat so far, identifying Strengths, Weaknesses, Opportunities, and Threats."
                            }
                        },
                        "Value Chain Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Perform a Value Chain Analysis on the discussion"
                            },
                            "content": {
                                "prompt": "Perform a Value Chain Analysis on the discussion, examining activities that create value and could lead to competitive advantage."
                            }
                        },
                        "VPEC-T Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Apply VPEC-T Analysis to the chat content"
                            },
                            "content": {
                                "prompt": "Apply VPEC-T Analysis to the chat content, examining Values, Policies, Events, Content, and Trust."
                            }
                        },
                        "Wardley Mapping": {
                            "properties": {
                                "favourite": true,
                                "description": "Create a Wardley Map based on the chat content"
                            },
                            "content": {
                                "prompt": "Create a Wardley Map based on the chat content, visualizing the landscape of the discussion and identifying areas for strategic focus."
                            }
                        },
                        "What If Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Conduct a What If Analysis on the chat"
                            },
                            "content": {
                                "prompt": "Conduct a What If Analysis on the chat, exploring alternative scenarios and their potential outcomes."
                            }
                        },
                        "Why-Why Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Perform a Why-Why Analysis on the chat content"
                            },
                            "content": {
                                "prompt": "Perform a Why-Why Analysis on the chat content, asking 'why' repeatedly to drill down to the root cause of a problem."
                            }
                        }
                    }
                }
            },
            "Insights": {
                "metadata": {
                    "name": "Insights",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Gain insights to help with understanding and learning more about the situation"
                    }
                },
                "content": {
                    "tools": {
                        "Identify key insights": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify key insights from the discussion"
                            },
                            "content": {
                                "prompt": "Identify key insights from the discussion"
                            }
                        },
                        "Highlight important patterns": {
                            "properties": {
                                "favourite": true,
                                "description": "Highlight important patterns and trends"
                            },
                            "content": {
                                "prompt": "Highlight important patterns and trends"
                            }
                        },
                        "Summarize main points": {
                            "properties": {
                                "favourite": true,
                                "description": "Summarize the main points of the discussion"
                            },
                            "content": {
                                "prompt": "Summarize the main points of the discussion"
                            }
                        },
                        "Provide context": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide context for the current situation"
                            },
                            "content": {
                                "prompt": "Provide context for the current situation"
                            }
                        },
                        "Draw conclusions": {
                            "properties": {
                                "favourite": true,
                                "description": "Draw conclusions based on the information discussed"
                            },
                            "content": {
                                "prompt": "Draw conclusions based on the information discussed"
                            }
                        },
                        "Predict outcomes": {
                            "properties": {
                                "favourite": true,
                                "description": "Predict potential outcomes based on the current discussion"
                            },
                            "content": {
                                "prompt": "Predict potential outcomes based on the current discussion"
                            }
                        },
                        "Identify gaps in knowledge": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify gaps in knowledge or information"
                            },
                            "content": {
                                "prompt": "Identify gaps in knowledge or information"
                            }
                        },
                        "Suggest further reading": {
                            "properties": {
                                "favourite": true,
                                "description": "Suggest further reading or resources"
                            },
                            "content": {
                                "prompt": "Suggest further reading or resources"
                            }
                        },
                        "Provide expert opinion": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide expert opinion on the topic"
                            },
                            "content": {
                                "prompt": "Provide expert opinion on the topic"
                            }
                        },
                        "Identify potential biases": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify potential biases in the discussion"
                            },
                            "content": {
                                "prompt": "Identify potential biases in the discussion"
                            }
                        },
                        "Compare with industry standards": {
                            "properties": {
                                "favourite": true,
                                "description": "Compare the situation with industry standards or benchmarks"
                            },
                            "content": {
                                "prompt": "Compare the situation with industry standards or benchmarks"
                            }
                        },
                        "Highlight best practices": {
                            "properties": {
                                "favourite": true,
                                "description": "Highlight best practices related to the topic"
                            },
                            "content": {
                                "prompt": "Highlight best practices related to the topic"
                            }
                        },
                        "Identify key stakeholders": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify key stakeholders and their interests"
                            },
                            "content": {
                                "prompt": "Identify key stakeholders and their interests"
                            }
                        },
                        "Analyze risks and opportunities": {
                            "properties": {
                                "favourite": true,
                                "description": "Analyze risks and opportunities in the current situation"
                            },
                            "content": {
                                "prompt": "Analyze risks and opportunities in the current situation"
                            }
                        },
                        "Provide historical context": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide historical context for the current situation"
                            },
                            "content": {
                                "prompt": "Provide historical context for the current situation"
                            }
                        },
                        "Suggest improvements": {
                            "properties": {
                                "favourite": true,
                                "description": "Suggest improvements or next steps"
                            },
                            "content": {
                                "prompt": "Suggest improvements or next steps"
                            }
                        },
                        "Evaluate impact": {
                            "properties": {
                                "favourite": true,
                                "description": "Evaluate the impact of different factors on the situation"
                            },
                            "content": {
                                "prompt": "Evaluate the impact of different factors on the situation"
                            }
                        },
                        "Identify trends": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify trends that could affect the situation"
                            },
                            "content": {
                                "prompt": "Identify trends that could affect the situation"
                            }
                        },
                        "Provide a SWOT analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide a SWOT analysis for the current situation"
                            },
                            "content": {
                                "prompt": "Provide a SWOT analysis for the current situation"
                            }
                        }
                    }
                }
            },
            "Decision Making": {
                "metadata": {
                    "name": "Decision Making",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Tools and prompts for making decisions"
                    }
                },
                "content": {
                    "tools": {
                        "Identify the decision": {
                            "properties": {
                                "favourite": true,
                                "description": "Clearly define the decision to be made"
                            },
                            "content": {
                                "prompt": "Clearly define the decision to be made, including the problem to be solved or the opportunity to be seized."
                            }
                        },
                        "Set objectives": {
                            "properties": {
                                "favourite": true,
                                "description": "Set clear objectives for the decision"
                            },
                            "content": {
                                "prompt": "Set clear objectives for the decision, outlining what is to be achieved and why."
                            }
                        },
                        "Generate options": {
                            "properties": {
                                "favourite": true,
                                "description": "Generate a range of options"
                            },
                            "content": {
                                "prompt": "Generate a range of options for the decision, considering different approaches and potential outcomes."
                            }
                        },
                        "Evaluate options": {
                            "properties": {
                                "favourite": true,
                                "description": "Evaluate the options against the objectives"
                            },
                            "content": {
                                "prompt": "Evaluate the options against the objectives, considering factors such as feasibility, cost, effort, complexity, impact, and risks."
                            }
                        },
                        "Pros and Cons": {
                            "properties": {
                                "favourite": true,
                                "description": "List the advantages and disadvantages of each option"
                            },
                            "content": {
                                "prompt": "List the advantages and disadvantages of each option, providing a balanced view of the benefits and drawbacks."
                            }
                        },
                        "Decision Matrix": {
                            "properties": {
                                "favourite": true,
                                "description": "Create a decision matrix to compare options"
                            },
                            "content": {
                                "prompt": "Create a decision matrix to compare options; as well as assessing criteria such as cost, time, resources, and impact, add additional criteria that make sense to consider for this decision."
                            }
                        },
                        "Weighted Decision Matrix": {
                            "properties": {
                                "favourite": true,
                                "description": "Develop a weighted decision matrix to evaluate options"
                            },
                            "content": {
                                "prompt": "Develop a weighted decision matrix to evaluate options based on the importance of different criteria."
                            }
                        },
                        "Risk Analysis": {
                            "properties": {
                                "favourite": true,
                                "description": "Perform a risk analysis for each option"
                            },
                            "content": {
                                "prompt": "Perform a risk analysis for each option, identifying potential risks and their likelihood and impact."
                            }
                        },
                        "Make a decision": {
                            "properties": {
                                "favourite": true,
                                "description": "Make a decision based on the evaluation"
                            },
                            "content": {
                                "prompt": "Make a decision based on the evaluation of the options, choosing the one that best meets the objectives."
                            }
                        },
                    }
                }
            },
            "Learning": {
                "metadata": {
                    "name": "Learning",
                    "tags": [],
                    "properties": {
                        "favourite": true,
                        "description": "Useful prompts for learning about a topic"
                    }
                },
                "content": {
                    "tools": {
                        "Elaborate": {
                            "properties": {
                                "favourite": true,
                                "description": "Elaborate on this further"
                            },
                            "content": {
                                "prompt": "Elaborate on this further"
                            }
                        },
                        "Provide examples": {
                            "properties": {
                                "favourite": true,
                                "description": "Give examples with explanations to bring the topic to life"
                            },
                            "content": {
                                "prompt": "Provide three relevant and diverse examples with explanations to bring different aspects of the topic, its application, history, or what it might be like in the future to life"
                            }
                        },
                        "Explain": {
                            "properties": {
                                "favourite": true,
                                "description": "Explain how something works or is the way it is"
                            },
                            "content": {
                                "prompt": "Provide an explanation of how this works and how it came to be this way taking into account the level of knowledge indicated by the questions so far"
                            }
                        },
                        "Real world applications": {
                            "properties": {
                                "favourite": true,
                                "description": "Describe real-world applications of this"
                            },
                            "content": {
                                "prompt": "Describe real-world applications of this"
                            }
                        },
                        "History": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide the history for this"
                            },
                            "content": {
                                "prompt": "Provide the history for this including dates, key people involved, and related events that led to this and came about due to this"
                            }
                        },
                        "Future": {
                            "properties": {
                                "favourite": true,
                                "description": "Hypothesise about the future of this"
                            },
                            "content": {
                                "prompt": "Hypothesise about the future of this including what it might look like in 1, 5, and 10 years time and what might be different about it then"
                            }
                        },
                        "Zoom in": {
                            "properties": {
                                "favourite": true,
                                "description": "Pick an area to do a deep dive into"
                            },
                            "content": {
                                "prompt": "Pick one area and give me a deep dive on that"
                            }
                        },
                        "Zoom out": {
                            "properties": {
                                "favourite": true,
                                "description": "Find out about the bigger picture"
                            },
                            "content": {
                                "prompt": "Tell me about the bigger picture and context for this"
                            }
                        },
                        "Related topics": {
                            "properties": {
                                "favourite": true,
                                "description": "Find out about related topics"
                            },
                            "content": {
                                "prompt": "Tell me about different but related topics to this"
                            }
                        },
                        "Compare and Contrast": {
                            "properties": {
                                "favourite": true,
                                "description": "Compare and contrast with other similar topics"
                            },
                            "content": {
                                "prompt": "Compare and contrast this topic with other similar topics, highlighting key similarities and differences"
                            }
                        },
                        "Common Misconceptions": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify and clarify common misconceptions"
                            },
                            "content": {
                                "prompt": "Identify and clarify common misconceptions about this topic, explaining why they are incorrect and what the correct understanding should be"
                            }
                        },
                        "Step-by-Step Guide": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide a step-by-step guide"
                            },
                            "content": {
                                "prompt": "Provide a step-by-step guide on how to do or understand this"
                            }
                        },
                        "Pros and Cons": {
                            "properties": {
                                "favourite": true,
                                "description": "List the advantages and disadvantages"
                            },
                            "content": {
                                "prompt": "List the advantages and disadvantages of this, providing a balanced view of its benefits and drawbacks"
                            }
                        },
                        "Key Terminology": {
                            "properties": {
                                "favourite": true,
                                "description": "Define key terms related to this topic"
                            },
                            "content": {
                                "prompt": "Define key terms and jargon related to this topic, explaining their meanings and relevance"
                            }
                        },
                        "Visualisation": {
                            "properties": {
                                "favourite": true,
                                "description": "Create a visual representation"
                            },
                            "content": {
                                "prompt": "Provide mermaid markdown for a mindmap of this topic to aid understanding"
                            }
                        }
                    }
                }
            },
            "Programming": {
                "metadata": {
                    "name": "Programming",
                    "tags": ["coding", "programming", "software"],
                    "properties": {
                        "favourite": true,
                        "description": "Prompts and tools for code development"
                    }
                },
                "content": {
                    "tools": {
                        "Provide code": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide code"
                            },
                            "content": {
                                "prompt": "Provide code for this"
                            }
                        },
                        "Explain Code": {
                            "properties": {
                                "favourite": true,
                                "description": "Explain this code in more detail"
                            },
                            "content": {
                                "prompt": "Explain this code in more detail."
                            }
                        },
                        "Identify Errors": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify and explain any errors in this code"
                            },
                            "content": {
                                "prompt": "Identify and explain any errors in this code, suggesting a fix."
                            }
                        },
                        "Suggest Improvements": {
                            "properties": {
                                "favourite": true,
                                "description": "How could this code be improved or optimised?"
                            },
                            "content": {
                                "prompt": "How could this code be improved or optimised?"
                            }
                        },
                        "Refactor Code": {
                            "properties": {
                                "favourite": true,
                                "description": "Refactor this code for better readability and maintainability"
                            },
                            "content": {
                                "prompt": "Refactor this code for better readability and maintainability."
                            }
                        },
                        "Write Test Cases": {
                            "properties": {
                                "favourite": true,
                                "description": "Write unit tests to verify the correctness of this code"
                            },
                            "content": {
                                "prompt": "Write unit tests to verify the correctness of this code."
                            }
                        },
                        "Generate Documentation": {
                            "properties": {
                                "favourite": true,
                                "description": "Generate documentation for this code."
                            },
                            "content": {
                                "prompt": "Generate documentation for this code."
                            }
                        },
                        "Explain Design Patterns": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify any design patterns used in this code and explain their purpose."
                            },
                            "content": {
                                "prompt": "Identify any design patterns used in this code and explain their purpose."
                            }
                        },
                        "Suggest Libraries": {
                            "properties": {
                                "favourite": true,
                                "description": "Suggest relevant libraries or frameworks that could be used with this code."
                            },
                            "content": {
                                "prompt": "Suggest relevant libraries or frameworks that could be used with this code."
                            }
                        },
                        "Performance Optimisation": {
                            "properties": {
                                "favourite": true,
                                "description": "How can the performance of this code be optimised?"
                            },
                            "content": {
                                "prompt": "How can the performance of this code be optimised?"
                            }
                        },
                        "Security Best Practices": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify potential security vulnerabilities and suggest best practices for this code."
                            },
                            "content": {
                                "prompt": "Identify potential security vulnerabilities and suggest best practices for this code."
                            }
                        }
                    }
                }
            },
            "Open Source": {
                "metadata": {
                    "name": "Open Source",
                    "tags": [],
                    "properties": {
                        "favourite": false,
                        "description": "Useful prompts for open source projects"
                    }
                },
                "content": {
                    "tools": {
                        "Open source libraries for this": {
                            "properties": {
                                "favourite": true,
                                "description": "What open source libraries can do this?"
                            },
                            "content": {
                                "prompt": "What open source libraries can do this? (ask what functionality is required if this is not already provided)"
                            }
                        },
                        "Further Research": {
                            "properties": {
                                "favourite": true,
                                "description": "Where to do more research"
                            },
                            "content": {
                                "prompt": "Where can I go to do more research on this topic?"
                            }
                        },
                        "Project Health": {
                            "properties": {
                                "favourite": true,
                                "description": "Ask for project details if not provided"
                            },
                            "content": {
                                "prompt": "How can I judge if this open source project is healthy? (ask for details of the open source project if it is not already provided)"
                            }
                        },
                        "Community Metrics": {
                            "properties": {
                                "favourite": true,
                                "description": "Provide or get community metrics"
                            },
                            "content": {
                                "prompt": "Provide some community metrics on this project or say how I can get them"
                            }
                        },
                        "Open Source Action": {
                            "properties": {
                                "favourite": true,
                                "description": "Talk to your company's open source office"
                            },
                            "content": {
                                "prompt": "What action could I take to open source this project? (also say that you should talk to your company's open source programme office)"
                            }
                        },
                        "Code Quality": {
                            "properties": {
                                "favourite": true,
                                "description": "Ensure code quality"
                            },
                            "content": {
                                "prompt": "How can I ensure the code quality of my open source project?"
                            }
                        },
                        "Documentation Best Practices": {
                            "properties": {
                                "favourite": true,
                                "description": "Documenting best practices"
                            },
                            "content": {
                                "prompt": "What are the best practices for documenting an open source project?"
                            }
                        },
                        "Attract Contributors": {
                            "properties": {
                                "favourite": true,
                                "description": "Manage contributors"
                            },
                            "content": {
                                "prompt": "How can I attract and manage contributors to an open source project?"
                            }
                        },
                        "Automate Testing": {
                            "properties": {
                                "favourite": true,
                                "description": "Tools to automate testing and deployment"
                            },
                            "content": {
                                "prompt": "What tools can help automate testing and deployment for my open source project?"
                            }
                        },
                        "Licensing Issues": {
                            "properties": {
                                "favourite": true,
                                "description": "Handle licensing issues"
                            },
                            "content": {
                                "prompt": "How do I handle licensing issues for my open source project?"
                            }
                        },
                        "Project Promotion": {
                            "properties": {
                                "favourite": true,
                                "description": "Promote within community"
                            },
                            "content": {
                                "prompt": "What strategies can I use to promote my open source project within the community?"
                            }
                        },
                        "CI/CD Integration": {
                            "properties": {
                                "favourite": true,
                                "description": "Ask for tech stack if not described"
                            },
                            "content": {
                                "prompt": "How can I integrate open source tooling for continuous integration and continuous deployment (CI/CD) into my open source project? (ask what tech stack is being used if this is not already described)"
                            }
                        },
                        "Security Best Practices": {
                            "properties": {
                                "favourite": true,
                                "description": "Security best practices"
                            },
                            "content": {
                                "prompt": "What are the security best practices for maintaining an open source project?"
                            }
                        },
                        "Effective Communication": {
                            "properties": {
                                "favourite": true,
                                "description": "Communicate with community"
                            },
                            "content": {
                                "prompt": "How can I effectively communicate with the user and contributor community of my open source project?"
                            }
                        },
                        "Common Pitfalls": {
                            "properties": {
                                "favourite": true,
                                "description": "Common pitfalls to avoid"
                            },
                            "content": {
                                "prompt": "What are the common pitfalls to avoid when starting an open source project?"
                            }
                        },
                        "Product Management": {
                            "properties": {
                                "favourite": true,
                                "description": "Product management concerns"
                            },
                            "content": {
                                "prompt": "What are the product management concerns around developing an open source project for this?"
                            }
                        },
                        "User Questions": {
                            "properties": {
                                "favourite": true,
                                "description": "Questions for end users"
                            },
                            "content": {
                                "prompt": "What questions can I ask the end users to see if this is a good fit?"
                            }
                        },
                        "Cost Savings": {
                            "properties": {
                                "favourite": true,
                                "description": "Determine cost savings"
                            },
                            "content": {
                                "prompt": "How can I better determine whether I will save money with this?"
                            }
                        },
                        "Leading Projects": {
                            "properties": {
                                "favourite": true,
                                "description": "Leading projects in space"
                            },
                            "content": {
                                "prompt": "What are the leading projects in this space including open-source and proprietary?"
                            }
                        }
                    }
                }
            },
            "Operational Excellence": {
                "metadata": {
                    "name": "Operational Excellence",
                    "tags": ["operations", "efficiency", "improvement"],
                    "properties": {
                        "favourite": true,
                        "description": "Prompts for achieving operational excellence"
                    }
                },
                "content": {
                    "tools": {
                        "Process Optimisation": {
                            "properties": {
                                "favourite": true,
                                "description": "How can we optimise this process?"
                            },
                            "content": {
                                "prompt": "How can we optimise this process?"
                            }
                        },
                        "Waste Reduction": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify areas where we can reduce waste in our operations."
                            },
                            "content": {
                                "prompt": "Identify areas where we can reduce waste in our operations."
                            }
                        },
                        "Quality Improvement": {
                            "properties": {
                                "favourite": true,
                                "description": "How can we improve the quality of our products or services?"
                            },
                            "content": {
                                "prompt": "How can we improve the quality of our products or services?"
                            }
                        },
                        "Cost Reduction": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify opportunities for cost reduction in our operations."
                            },
                            "content": {
                                "prompt": "Identify opportunities for cost reduction in our operations."
                            }
                        },
                        "Customer Satisfaction": {
                            "properties": {
                                "favourite": true,
                                "description": "How can we improve customer satisfaction?"
                            },
                            "content": {
                                "prompt": "How can we improve customer satisfaction?"
                            }
                        },
                        "Employee Engagement": {
                            "properties": {
                                "favourite": true,
                                "description": "How can we improve employee engagement and motivation?"
                            },
                            "content": {
                                "prompt": "How can we improve employee engagement and motivation?"
                            }
                        },
                        "Performance Measurement": {
                            "properties": {
                                "favourite": true,
                                "description": "What are the key metrics we should track to measure our performance?"
                            },
                            "content": {
                                "prompt": "What are the key metrics we should track to measure our performance?"
                            }
                        },
                        "Continuous Improvement": {
                            "properties": {
                                "favourite": true,
                                "description": "How can we establish a culture of continuous improvement?"
                            },
                            "content": {
                                "prompt": "How can we establish a culture of continuous improvement?"
                            }
                        },
                        "Risk Management": {
                            "properties": {
                                "favourite": true,
                                "description": "Identify potential risks in our operations and suggest mitigation strategies."
                            },
                            "content": {
                                "prompt": "Identify potential risks in our operations and suggest mitigation strategies."
                            }
                        },
                        "Benchmarking": {
                            "properties": {
                                "favourite": true,
                                "description": "How do we compare to industry benchmarks in terms of operational efficiency?"
                            },
                            "content": {
                                "prompt": "How do we compare to industry benchmarks in terms of operational efficiency?"
                            }
                        }
                    }
                }
            },
            "Dinner Party Menu": {
                "metadata": {
                    "name": "Dinner Party Menu",
                    "tags": ["food", "cooking", "menu", "party"],
                    "properties": {
                        "favourite": true,
                        "description": "Prompts for creating a delicious dinner party menu"
                    }
                },
                "content": {
                    "tools": {
                        "Suggest Starters": {
                            "properties": {
                                "favourite": true,
                                "description": "Suggest some appetising starters for a dinner party."
                            },
                            "content": {
                                "prompt": "Suggest some appetising starters for a dinner party."
                            }
                        },
                        "Main Course Ideas": {
                            "properties": {
                                "favourite": true,
                                "description": "What are some impressive main course options for a dinner party?"
                            },
                            "content": {
                                "prompt": "What are some impressive main course options for a dinner party?"
                            }
                        },
                        "Vegetarian Mains": {
                            "properties": {
                                "favourite": true,
                                "description": "Suggest some delicious vegetarian main courses for a dinner party."
                            },
                            "content": {
                                "prompt": "Suggest some delicious vegetarian main courses for a dinner party."
                            }
                        },
                        "Side Dish Pairings": {
                            "properties": {
                                "favourite": true,
                                "description": "What side dishes would go well with this main course?"
                            },
                            "content": {
                                "prompt": "What side dishes would go well with this main course?"
                            }
                        },
                        "Dessert Suggestions": {
                            "properties": {
                                "favourite": true,
                                "description": "Suggest some decadent desserts to finish off the meal."
                            },
                            "content": {
                                "prompt": "Suggest some decadent desserts to finish off the meal."
                            }
                        },
                        "Wine Pairings": {
                            "properties": {
                                "favourite": true,
                                "description": "Recommend some wines to pair with the menu."
                            },
                            "content": {
                                "prompt": "Recommend some wines to pair with the menu."
                            }
                        },
                        "Dietary Restrictions": {
                            "properties": {
                                "favourite": true,
                                "description": "Help me create a menu that accommodates dietary restrictions."
                            },
                            "content": {
                                "prompt": "Help me create a menu that accommodates dietary restrictions."
                            }
                        },
                        "Seasonal Ingredients": {
                            "properties": {
                                "favourite": true,
                                "description": "What are some seasonal ingredients I could incorporate into the menu?"
                            },
                            "content": {
                                "prompt": "What are some seasonal ingredients I could incorporate into the menu?"
                            }
                        },
                        "Theme Ideas": {
                            "properties": {
                                "favourite": true,
                                "description": "Suggest some fun themes for a dinner party."
                            },
                            "content": {
                                "prompt": "Suggest some fun themes for a dinner party."
                            }
                        },
                        "Presentation Tips": {
                            "properties": {
                                "favourite": true,
                                "description": "Give me some tips on how to present the dishes beautifully."
                            },
                            "content": {
                                "prompt": "Give me some tips on how to present the dishes beautifully."
                            }
                        }
                    }
                }
            },
            "Technology Innovation": {
                "metadata": {
                    "name": "Technology Innovation",
                    "tags": ["tech", "innovation", "future"],
                    "properties": {
                        "favourite": true,
                        "description": "Prompts to explore emerging technologies and trends"
                    }
                },
                "content": {
                    "tools": {
                        "Emerging Trends": {
                            "properties": {
                                "favourite": true,
                                "description": "What are the most promising emerging technologies?"
                            },
                            "content": {
                                "prompt": "What are the most promising emerging technologies?"
                            }
                        },
                        "Industry Disruption": {
                            "properties": {
                                "favourite": true,
                                "description": "How are new technologies disrupting traditional industries?"
                            },
                            "content": {
                                "prompt": "How are new technologies disrupting traditional industries?"
                            }
                        },
                        "Future Predictions": {
                            "properties": {
                                "favourite": true,
                                "description": "What are some predictions for the future of technology?"
                            },
                            "content": {
                                "prompt": "What are some predictions for the future of technology?"
                            }
                        },
                        "Ethical Considerations": {
                            "properties": {
                                "favourite": true,
                                "description": "What are the ethical implications of emerging technologies?"
                            },
                            "content": {
                                "prompt": "What are the ethical implications of emerging technologies?"
                            }
                        },
                        "Tech Investment": {
                            "properties": {
                                "favourite": true,
                                "description": "What are some promising areas for technology investment?"
                            },
                            "content": {
                                "prompt": "What are some promising areas for technology investment?"
                            }
                        },
                        "Impact on Society": {
                            "properties": {
                                "favourite": true,
                                "description": "How are new technologies impacting society?"
                            },
                            "content": {
                                "prompt": "How are new technologies impacting society?"
                            }
                        },
                        "Tech Adoption Challenges": {
                            "properties": {
                                "favourite": true,
                                "description": "What are the challenges of adopting new technologies?"
                            },
                            "content": {
                                "prompt": "What are the challenges of adopting new technologies?"
                            }
                        },
                        "Tech Career Paths": {
                            "properties": {
                                "favourite": true,
                                "description": "What are some promising career paths in the technology field?"
                            },
                            "content": {
                                "prompt": "What are some promising career paths in the technology field?"
                            }
                        },
                        "Innovation Strategies": {
                            "properties": {
                                "favourite": true,
                                "description": "What strategies can companies use to foster innovation?"
                            },
                            "content": {
                                "prompt": "What strategies can companies use to foster innovation?"
                            }
                        },
                        "Tech Regulation": {
                            "properties": {
                                "favourite": true,
                                "description": "What are the current debates around technology regulation?"
                            },
                            "content": {
                                "prompt": "What are the current debates around technology regulation?"
                            }
                        }
                    }
                }
            },
            "Communication": {
                "metadata": {
                    "name": "Communication",
                    "tags": [],
                    "properties": {
                        "favourite": false,
                        "description": "Prompts to help refine and create effective communication"
                    }
                },
                "content": {
                    "tools": {
                        "Draft an Email": {
                            "properties": {
                                "favourite": true,
                                "description": "Draft a professional email based on the discussion"
                            },
                            "content": {
                                "prompt": "Based on our discussion, draft a professional email"
                            }
                        },
                        "Create a Presentation Outline": {
                            "properties": {
                                "favourite": true,
                                "description": "Create an outline for a presentation"
                            },
                            "content": {
                                "prompt": "Create an outline for a presentation based on our discussion"
                            }
                        },
                        "Summarise Key Points": {
                            "properties": {
                                "favourite": true,
                                "description": "Summarise the key points from the discussion"
                            },
                            "content": {
                                "prompt": "Summarise the key points from our discussion"
                            }
                        },
                        "Generate a Report": {
                            "properties": {
                                "favourite": true,
                                "description": "Generate a report based on the discussion"
                            },
                            "content": {
                                "prompt": "Generate a report based on our discussion"
                            }
                        },
                        "Write a Social Media Post": {
                            "properties": {
                                "favourite": true,
                                "description": "Draft a social media post based on our discussion"
                            },
                            "content": {
                                "prompt": "Draft a social media post based on our discussion"
                            }
                        },
                        "Create Talking Points": {
                            "properties": {
                                "favourite": true,
                                "description": "Create talking points for a meeting or presentation"
                            },
                            "content": {
                                "prompt": "Create talking points for a meeting/presentation based on our discussion"
                            }
                        },
                        "Write an Article": {
                            "properties": {
                                "favourite": true,
                                "description": "Draft an article based on the discussion"
                            },
                            "content": {
                                "prompt": "Draft an article based on the discussion"
                            }
                        },
                        "Formulate a Response": {
                            "properties": {
                                "favourite": true,
                                "description": "Formulate a response to a query or statement"
                            },
                            "content": {
                                "prompt": "Based on our discussion, can you formulate a response to [query/statement]?"
                            }
                        },
                        "Prepare a Speech": {
                            "properties": {
                                "favourite": true,
                                "description": "Prepare a speech based on the discussion"
                            },
                            "content": {
                                "prompt": "Prepare a speech based on the discussion"
                            }
                        },
                        "Create a Proposal": {
                            "properties": {
                                "favourite": true,
                                "description": "Draft a proposal based on the discussion"
                            },
                            "content": {
                                "prompt": "Draft a proposal based on the discussion"
                            }
                        },
                        "Draft a Press Release": {
                            "properties": {
                                "favourite": true,
                                "description": "Draft a press release based on the discussion"
                            },
                            "content": {
                                "prompt": "Draft a press release based on this discussion"
                            }
                        },
                        "Create a FAQ": {
                            "properties": {
                                "favourite": true,
                                "description": "Create a list of frequently asked questions and answers"
                            },
                            "content": {
                                "prompt": "Create a list of frequently asked questions and answers based on this discussion"
                            }
                        },
                        "Write a Blog Post": {
                            "properties": {
                                "favourite": true,
                                "description": "Draft a blog post based on the discussion"
                            },
                            "content": {
                                "prompt": "Draft a blog post based on this discussion"
                            }
                        },
                        "Create a tweet": {
                            "properties": {
                                "favourite": true,
                                "description": "Create a tweet"
                            },
                            "content": {
                                "prompt": "Create a tweet based on the discussion"
                            }
                        },
                        "Prepare an Elevator Pitch": {
                            "properties": {
                                "favourite": true,
                                "description": "Prepare an elevator pitch based on the discussion"
                            },
                            "content": {
                                "prompt": "Prepare an elevator pitch based on the discussion"
                            }
                        }
                    }
                }
            },
        }
    });

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
        if (!chatLoading.current && (messages.length > 0 || chatContext.length > 0 || chatGoal.length > 0 || starred || bookmarked || tags.length > 0)) {
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
        messagesSize += chatContext?.length || 0;
        messagesSize += chatGoal?.length || 0;
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
        if (settings.hasOwnProperty("toolboxWidth")) {
            setToolboxWidth(settings.toolboxWidth);
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
            if (!chatOpen) {
                system.warning("Please open a chat to add to its prompt.");
                return;
             }
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
        if (!chatOpen) {
            system.warning("Please open a chat to set its prompt.");
            return;
        }
        if (newPrompt?.text) {
            setChatPrompt(newPrompt.text);
            setPromptFocus();
        }
    }, [newPrompt]);

    useEffect(()=>{
        if(promptToSend) {
            showWaiting();
            setLastPrompt(promptToSend.prompt);
            let prompt = promptToSend.prompt;
            setPromptToSend("");
            sendPrompt(prompt);
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
                    setChatContext(response.data.content?.context || "");
                    setChatGoal(response.data.content?.goal || "");
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

                    // if the chat has a goal or context, open the chat context panel
                    if (response.data.content?.goal || response.data.content?.context) {
                        setChatContextOpen(true);
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

    const isScrolledOffBottom = () => {
        const chatMessagesBottom = chatMessagesContainerRef.current.scrollTop + chatMessagesContainerRef.current.clientHeight;
        const streamingChatResponseCardBottom = chatMessagesRef.current.offsetTop + chatMessagesRef.current.clientHeight;        
        const isScrolledOffBottom = streamingChatResponseCardBottom - chatMessagesBottom > 300;
        return isScrolledOffBottom;
    }

    useEffect(()=>{
        // Auto-scroll during chat streaming unless the user scrolls
        if (!isScrolledOffBottom()) {
            streamingChatResponseCardRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
    }, [streamingChatResponse]);
    
    const appendMessage = (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
        if (!chatOpen) { setChatOpen(Date.now()) };
        if (!isScrolledOffBottom()) {
            setTimeout(() => {
                chatMessagesRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
            }, 0);
        }
    }

    const showReady = () => {
        setPromptPlaceholder(userPromptReady.current);
    }

    const showWaiting = () => {
        setPromptPlaceholder(userPromptWaiting);
        setChatPrompt("");
    }

    const create = () => {
        let newChatObject = chatAsObject();
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
            metadata: {
                name: name + " clone",
                tags: tags,
                properties: {
                    starred: false, // don't clone the starred status
                    bookmarked: false, // don't clone the bookmarked status
                }
            },
            content: {
                context: chatContext,
                goal: chatGoal,
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
                context: chatContext || "",
                goal: chatGoal || "",
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

    const handleChatContextBlur = () => {
        if (chatContext.length > 0 || chatGoal.length > 0) {
            // TODO: only save if the context or goal has changed
            save();
        }
    }

    const save = () => {
        if (id === "" || id === null) {
            create();
        } else {
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
        let context = chatContext ? "\n\nContext:\n\n" + chatContext : "";
        let goal = chatGoal ? "\n\nGoal:\n\n" + chatGoal : "";
        let promptForLanguage = language && language !== MODEL_DEFAULT_LANGUAGE ? "\n\nProvide the response in the following language: " + language + "\n\n" : "";
        let requestData = {
            model_settings: myModelSettings,
            system_prompt: systemPrompt + context + goal + promptForLanguage,
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
                "metadata": {
                    "name": promptTemplateName,
                    "tags": [],
                    "properties": {
                        "starred": false,
                        "bookmarked": false,
                    }
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
        if (event.target.value) {
            setName(event.target.value);
        } else {
            setName(newChatName);
        }
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

    const expandMessage = (index) => {
        if (messages[index]?.metadata?.expandLess) {
            const newMessages = [...messages];
            delete newMessages[index].metadata.expandLess;
            setMessages(newMessages);
        }
    }

    const handleExpandMessage = (event, index) => {
        event.stopPropagation();
        expandMessage(index);
        closeMenus();
    }

    const expandAllMessages = () => {
        const newMessages = [...messages];
        newMessages.forEach((message, index) => {
            expandMessage(index);
        });
        setMessages(newMessages);
    }

    const handleExpandAllMessages = (event) => {
        event.stopPropagation();
        expandAllMessages();
        closeMenus();
    }

    const contractMessage = (index) => {
        if (!messages[index]?.metadata?.expandLess) {
            const newMessages = [...messages];
            if (!newMessages[index].metadata) {
                newMessages[index].metadata = {};
            }
            newMessages[index].metadata['expandLess'] = true;
            setMessages(newMessages);
        }
    }

    const handleContractMessage = (event, index) => {
        event.stopPropagation();
        contractMessage(index);
        closeMenus();
    }

    const contractAllMessages = () => {
        const newMessages = [...messages];
        newMessages.forEach((message, index) => {
            contractMessage(index);
        });
        setMessages(newMessages);
    }

    const handleContractAllMessages = (event) => {
        event.stopPropagation();
        contractAllMessages();
        closeMenus();
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
        handleMenuMessageContextClose();
        handleMenuPromptEditorClose();
        handleMenuDiagramsClose();
    }

    const runMenuAction = (functionToRun, thenFocusOnPrompt=true) => {
        closeMenus();
        if (thenFocusOnPrompt) {
            setFocusOnPrompt(Date.now());
        }
        functionToRun && functionToRun();
    };

    const handleMenuToolboxesOpen = (event) => {
        setMenuToolboxesAnchorEl(event.currentTarget);
    };

    const handleMenuDiagramsOpen = (event) => {
        setMenuDiagramsAnchorEl(event.currentTarget);
    };

    const handleMenuDiagramsClose = () => {
        setMenuDiagramsAnchorEl(null);
    };

    const handleMenuCommandsClose = () => {
        setMenuCommandsAnchorEl(null);
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
        sidekickClipboard.writeText(text);
        setMenuMessageContext(null);
    };
    
    const handleCopyMessageAsText = () => {
        const selectedText = menuMessageContext.message.content;
        sidekickClipboard.writeText(selectedText);
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
        sidekickClipboard.writeText(messagesAs("text"));
        setMenuMessageContext(null);
    };

    const handleCopyAll = () => {
        let markdown = messagesAs("markdown");
        sidekickClipboard.write({
            html: new ContentFormatter(markdown).asHtml(),
            sidekickObject: { markdown: markdown },
        });
        setMenuMessageContext(null);
    };

    const handleCopyMessage = () => {
        sidekickClipboard.write({
            html: new ContentFormatter(menuMessageContext.message.content).asHtml(),
            sidekickObject: { markdown: menuMessageContext.message.content },
        });
        setMenuMessageContext(null);
    };

    const handleCopyMessageAsHTML = () => {
        sidekickClipboard.writeText(
            new ContentFormatter(menuMessageContext.message.content).asHtml()
        );
        setMenuMessageContext(null);
    };

    const handleCopyAllAsHTML = () => {
        let markdown = messagesAs("markdown");
        let html = new ContentFormatter(markdown).asHtml();
        sidekickClipboard.writeText(html);
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
        setChatContext("");
        setChatGoal("");
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
        { sidekickClipboard: sidekickClipboard, hotKeyHandlers: { "save": save }, darkMode: darkMode }
    );

    const ActionMenu = React.forwardRef(({name, prompt, tooltip, onClick}, ref) => {
        const menuItem = 
            <MenuItem
                key={`action-menu-item-${name}`}
                sx={{ width: "100%", whiteSpace: 'normal' }}
                ref={ref}
                onClick={
                    (event) => 
                        {
                            onClick && onClick(event);
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
            <MenuItem
                key={`action-on-text-item-${prompt}`}
                onClick={ (event) => {
                    onClick && onClick();
                    if (event.altKey) {
                        runMenuAction(()=>{setChatPrompt(prompt + ": " + text)});
                    } else {
                        runMenuAction(()=>{sendPrompt(prompt + ": " + text)});
                    }
                }
                }>
                {prompt}
            </MenuItem>
        )
    }

    /**
     * DynamicMenu component that renders a root menu and submenus based on the provided toolboxes.
     * 
     * @param {Object} props - The component props.
     * @param {HTMLElement} props.menuAnchor - The anchor element for the root menu. If set, the menu is displayed at that location, otherwise the menu is hidden.
     * @param {Function} props.setMenuAnchor - Function to set the anchor for the root menu.
     * @param {Object} props.toolboxes - Object containing toolbox data used to generate menus.
     * @param {boolean} props.isMobile - Flag indicating if the menu should adapt to mobile view.
     */
    const DynamicMenu = ({ rootMenuAnchor, setRootMenuAnchor, menuAnchors, setMenuAnchors, toolboxes, isMobile }) => {

        const handleMenuOpen = (event, menuName) => {
          setMenuAnchors({ ...menuAnchors, [menuName]: event.currentTarget });
        };

        const handleRootMenuClose = () => {
            setRootMenuAnchor(null);
        };
      
        const handleMenuClose = (menuName) => {
          setMenuAnchors({ ...menuAnchors, [menuName]: null });
        };

        const menu = <Box key={`dynamic-menu-root-${toolboxes.metadata.name}`}>
        <Menu
            anchorEl={rootMenuAnchor}
            open={Boolean(rootMenuAnchor)}
            onClose={handleRootMenuClose}
        >
            {Object.keys(toolboxes.content).map((menuName) => (
                <MenuItem
                    key={`dynamic-menu-root-item-${menuName}`}
                    onClick={(event) => handleMenuOpen(event, menuName)}>
                    <Typography variant="subtitle1" component="div" style={{ flexGrow: 1 }}>
                        {menuName}
                    </Typography>
                    <IconButton  edge="end" style={{ padding: 0 }}>
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </MenuItem>
            ))}
        </Menu>
        {Object.keys(toolboxes.content).map((menuName) => (
            <Menu
                key={`dynamic-menu-menu-${menuName}`}
                sx={{ width: isMobile ? "400px" : "100%" }}
                anchorEl={menuAnchors[menuName]}
                open={Boolean(menuAnchors[menuName])}
                onClose={() => handleMenuClose(menuName)}
                onKeyDown={
                    (event) => {
                        if (event.key === 'ArrowLeft') {
                            handleMenuClose(menuName);
                        }
                    }
                }
                anchorOrigin={{
                vertical: 'top',
                horizontal: isMobile ? 'left' : 'right',
                }}
                transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
                }}
            >
                <Tooltip title={promptSelectionInstructions} placement="right">
                    <MenuItem onClick={(event) => { handleMenuOpen(event, menuName) }}>
                        <Typography variant="subtitle1" component="div" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                        {menuName}
                        </Typography>
                        <IconButton edge="end" color="inherit" onClick={() => { handleMenuClose(menuName) }}>
                        <CloseIcon />
                        </IconButton>
                    </MenuItem>
                </Tooltip>
                {
                Object.keys(toolboxes.content[menuName].content.tools)
                    .map(key => (
                    <ActionMenu
                        key={`dynamic-menu-action-menu-${menuName}-${key}`}
                        name={key}
                        prompt={toolboxes.content[menuName].content.tools[key].content.prompt}
                        tooltip={toolboxes.content[menuName].content.tools[key].properties.description}
                        onClick={(event) => handleMenuOpen(event, key)}
                        onClose={() => handleMenuClose(menuName)}
                    />
                    ))
                }
            </Menu>
            ))
        }
        </Box>;
      
        return menu;
    };

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
        <Tooltip title={ toolboxOpen ? "Close prompt toolbox" : "Open prompt toolbox"}>
            <span>
                <IconButton edge="start" color="inherit" aria-label={toolboxOpen ? "Close prompt toolbox" : "Open prompt toolbox"}
                    onClick={ () => {setToolboxOpen(x=>!x)} }
                >
                    { isMobile ? null : (toolboxOpen ? <HomeRepairServiceIcon/> : <HomeRepairServiceOutlinedIcon/>) }
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title = {chatContextOpen ? "Hide chat context and goal" : "Edit chat context and goal"}>
            <span>
                <IconButton edge="start" color="inherit" aria-label={toolboxOpen ? "Close prompt toolbox" : "Open prompt toolbox"}
                    onClick={ () => {setChatContextOpen(x=>!x)} }
                >
                    <ControlCameraIcon/>
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
            <MenuItem onClick={handleMenuToolboxesOpen}
                onKeyDown={
                    (event) => {
                        if (event.key === 'ArrowRight') {
                            handleMenuToolboxesOpen(event);
                        }
                    }
                }    
            >
                <ListItemIcon><LibraryBooksIcon/></ListItemIcon>
                Toolboxes
                <IconButton  edge="end" style={{ padding: 0 }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </MenuItem>
            {
                toolboxes && 
                    <DynamicMenu 
                        rootMenuAnchor={menuToolboxesAnchorEl} 
                        setRootMenuAnchor={setMenuToolboxesAnchorEl} 
                        menuAnchors={menuToolboxesAnchors}
                        setMenuAnchors={setMenuToolboxesAnchors}
                        toolboxes={toolboxes} 
                        isMobile={isMobile}/>
            }
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
            { 
                typeof menuMessageContext?.index !== 'undefined'
                ?
                    <MenuItem
                        style={{ minHeight: '30px' }}
                        onClick={
                            (event) => {
                                messages[menuMessageContext.index]?.metadata?.expandLess
                                ? handleExpandMessage(event, menuMessageContext.index)
                                : handleContractMessage(event, menuMessageContext.index)
                            }}>
                        <ListItemText>{messages[menuMessageContext.index]?.metadata?.expandLess ? "Expand this message" : "Contract this message"}</ListItemText>
                    </MenuItem>
                : null
            }
            <MenuItem
                style={{ height: '30px' }} 
                onClick={handleContractAllMessages}>
                Contract all messages
            </MenuItem>
            <MenuItem
                style={{ height: '30px' }} 
                onClick={handleExpandAllMessages}>
                Expand all messages
            </MenuItem>
            { 
                typeof menuMessageContext?.index !== 'undefined'
                ?
                    <MenuItem divider style={{ minHeight: '10px' }} />
                : null
            }
            <MenuItem
                style={{ minHeight: '30px' }}
                disabled={!window.getSelection().toString() || promptPlaceholder === userPromptWaiting}
                onClick={handleMenuCommandsOnSelectionOpen}>
                <ListItemText>Commands on selection</ListItemText>
                <IconButton  edge="end" style={{ padding: 0 }}>
                    <KeyboardArrowRightIcon />
                </IconButton>
            </MenuItem>
            <MenuItem divider style={{ minHeight: '10px' }} />
            <MenuItem
                style={{ height: '30px' }} 
                disabled={!window.getSelection().toString()}
                onClick={handleCopyHighlightedText}>
                Copy highlighted text
            </MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyMessage}>Copy message</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyAll}>Copy all messages</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyMessageAsText}>Copy message as text</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyAllAsText}>Copy all messages as text</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyMessageAsHTML}>Copy message as html</MenuItem>
            <MenuItem style={{ minHeight: '30px' }} onClick={handleCopyAllAsHTML}>Copy all messages as html</MenuItem>
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
            <Tooltip key="close" title={diagramSelectionInstructions} placement="right">
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
            <Tooltip key="close" title={promptSelectionInstructions} placement="right">
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
            <ActionMenu name="Article" prompt="Considering this entire chat from start to end as brainstorming preparation for writing an article, Identify major themes, find connections between them, and provide an informative insightful article in markdown that incorporates all of this, starting with the same topics the chat starts with and ending up on the topics it ends with followed by reflections on how things have evolved up until now and asking questions about what might happen next with the intent of educating and stimulating further thought and interest in the topic."/>
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
            <Tooltip key="close" title={promptSelectionInstructions} placement="right">
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
                    minWidth: 
                        isMobile 
                        ? `${window.innerWidth}px`
                        :
                        (
                            toolboxOpen && !chatContextOpen ? `${500 + parseInt(toolboxWidth)}px` 
                            :
                            (
                                !toolboxOpen && chatContextOpen ? `${500 + parseInt(chatContextWidth)}px`
                                :
                                (
                                    (toolboxOpen && chatContextOpen ? `${500 + parseInt(toolboxWidth) + parseInt(chatContextWidth)}px`
                                    : "500px")
                                )
                            )
                        ),
                    maxWidth:
                        isMobile
                        ? `${window.innerWidth}px` 
                        : (windowMaximized
                            ? null
                            : (
                                toolboxOpen && !chatContextOpen ? `${parseInt(maxWidth) + parseInt(toolboxWidth)}px` 
                                :
                                (
                                    !toolboxOpen && chatContextOpen ? `${parseInt(maxWidth) + parseInt(chatContextWidth)}px`
                                    :
                                    (
                                        (toolboxOpen && chatContextOpen ? `${parseInt(maxWidth) + parseInt(toolboxWidth) + parseInt(chatContextWidth)}px`
                                        : maxWidth)
                                    )
                                )
                            )
                        ),
                    }}
                    >
    {toolbar}
    {fileUploadBar}
    <Box sx={{ display: "flex", flexDirection: "column", height:"calc(100% - 64px)"}}>
        <Box sx={{ display:"flex", flexDirection: "row", height:"100%" }}>
            {
                toolboxOpen && !isMobile ?
                    <Box sx={{ display: "flex", width: toolboxWidth, minWidth: toolboxWidth, height:"100%" }}>
                        <Toolbox
                            toolboxes={toolboxes} setToolboxes={setToolboxes}
                            setToolboxOpen={setToolboxOpen} toolboxOpen={toolboxOpen}
                            setNewPromptPart={setChatPrompt} setNewPrompt={setPromptToSend}
                            darkMode={darkMode}/>
                    </Box>
                : null
            }
            <Box sx={{ display:"flex", flexDirection: "column", width: "100%"}}>
                <Box sx={{ display:"flex", flexDirection: "row" }}>
                    <TextField
                        sx={{ mt: 2,  ml: 1,flexGrow: 1, paddingBottom: "6px" }}
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
                {
                    chatContextOpen && isMobile // show chat context above messages on mobile rather than to the side due to narrow screen
                    ?   <Box sx={{ display:"flex", flexDirection: "row", width: "100%" }}>
                            <ContentElement
                                name="Chat Context"
                                placeholder="Give the AI context for the chat so it has more to go on"
                                setName={undefined}
                                content={chatContext}
                                setContent={setChatContext}
                                rows={3}
                                onBlur={handleChatContextBlur}
                            />
                            <ContentElement
                                name="Chat Goal"
                                placeholder="Keep the chat focussed on a specific goal"
                                setName={undefined}
                                content={chatGoal}
                                setContent={setChatGoal}
                                rows={3}
                                onBlur={handleChatContextBlur}
                            />
                        </Box>
                    : null
                }
                <StyledBox 
                    sx={{ overflowY: 'auto', flex: 1, minHeight: "300px", mt: 1 }}
                    ref={chatMessagesContainerRef}>
                    <List id="message-list" ref={chatMessagesRef}>
                        {messages && messages.map((message, index) => (
                            <ListItem sx={{ ml: 1, paddingLeft: 0, width: "calc(100% - 8px)" }} key={index}>
                                <Box
                                    position="relative"
                                    style={{width:'100%'}}
                                    onContextMenu={(event) => { handleMenuMessageContextOpen(event, message, index); }}
                                    onClick={(event) => { isMobile && handleMenuMessageContextOpen(event, message, index); }}
                                >
                                    <Card sx={{ 
                                        padding: 2,
                                        width: "100%", height: messages[index]?.metadata?.expandLess ? "100px" : "auto",
                                        backgroundColor: message.role === "user" ? (darkMode ? blueGrey[800] : "lightblue") : (darkMode ? lightBlue[900] : "lightyellow"),
                                    }}
                                    >
                                        {
                                            markdownRenderingOn
                                            ?
                                                <SidekickMarkdown markdown={message.content}/>
                                            :
                                                <Typography sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                                                    {message.content}
                                                </Typography>
                                        }
                                    </Card>
                                    {
                                        messages[index]?.metadata?.expandLess
                                        ?
                                            <Tooltip title="Expand this message so you can see the whole thing">
                                                <IconButton
                                                    sx={{ position: 'absolute', top: 0, left: 0,
                                                         }}
                                                    onClick={(event) => { handleExpandMessage(event, index); }}>
                                                    <ExpandMoreIcon sx={{color: 'firebrick'}}/>
                                                </IconButton>
                                            </Tooltip>
                                        :
                                            <Tooltip title="Contract this message. You can expand it again when needed. The full message will still be included in the chat history sent to the AI.">
                                                <IconButton
                                                    sx={{ position: 'absolute', top: 0, left: 0 }}
                                                    onClick={(event) => { handleContractMessage(event, index); }}>
                                                    <ExpandLessIcon sx={{ color: darkMode ? 'lightgrey' : 'grey' }}/>
                                                </IconButton>
                                            </Tooltip>
                                    }
                                    <Tooltip title="Delete this message">
                                        <IconButton
                                            style={{ position: 'absolute', top: 0, right: 0,
                                                color: darkMode ? 'lightgrey' : 'darkgrey' }}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                // delete this message
                                                const newMessages = [...messages];
                                                newMessages.splice(index, 1);
                                                setMessages(newMessages);
                                            }}>
                                            <HighlightOffIcon/>
                                        </IconButton>
                                    </Tooltip>
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
            {
                chatContextOpen  && !isMobile // show chat context to the side of messages on desktop
                ?
                    <Card id={`chat-context`}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%", maxWidth: parseInt(chatContextWidth)+'px', minWidth: parseInt(chatContextWidth)+'px',
                            padding: "2px", margin: "6px", }}>
                        <SecondaryToolbar sx={{gap:1}} className={ClassNames.toolbar}>
                            <Typography>Chat Context</Typography>
                            <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
                                <Tooltip edge="end" title='The chat context and goal will be added to the system prompt each time you prompt the AI. Enter these before you start your chat to give the AI more to go on. They will be saved with the chat and applied if you continue the chat later.'>
                                    <IconButton>
                                        <HelpOutlineIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip edge="end" title='Close Chat context'>
                                    <IconButton onClick={()=>{setChatContextOpen(0)}}>
                                        <CloseIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </SecondaryToolbar>
                        <Box sx={{
                                display:"flex",
                                padding: "6px",
                                flexDirection: "column",
                                width: "100%",
                                height: "calc(100% - 50px)",
                            }}>
                                <Typography variant="subtitle1" component="div" style={{ fontWeight: 'bold' }}>
                                    Chat Context
                                </Typography>
                                <Box sx={{ flex: 1, padding: "6px", overflowY: "auto" }}>
                                    <TextField
                                        placeholder="Give the AI context for the chat so it has more to go on"
                                        variant="standard"
                                        multiline
                                        sx={{ height: "100%", width: "100%" }}
                                        value={chatContext}
                                        onChange={(e) => { setChatContext(e.target.value); }}
                                        onBlur={handleChatContextBlur}
                                    />
                                </Box>
                                <Typography variant="subtitle1" component="div" style={{ fontWeight: 'bold' }}>
                                    Chat Goal
                                </Typography>
                                <Box sx={{ flex: 1, padding: "6px", overflowY: "auto" }}>
                                    <TextField
                                        placeholder="Keep the chat focussed on a specific goal"
                                        variant="standard"
                                        multiline
                                        sx={{ height: "100%", width: "100%" }}
                                        value={chatGoal}
                                        onChange={(e) => { setChatGoal(e.target.value); }}
                                        onBlur={handleChatContextBlur}
                                    />
                                </Box>
                        </Box>
                    </Card>
                : null
            }
        </Box>
    </Box>
</Card>;
    return ( chatOpen ? render : null )
  }

export default Chat;