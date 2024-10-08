// File: App.js
// Author: Mark Burnett
// Date: 2022-09-23
// Description: An AI powered tool for creativity, thinking, exploring ideas, problem-solving, knowledge-building,
// and getting things done

import './App.css';
import axios from 'axios';
import { SystemProvider } from './SystemContext';
import { useContext, createContext, useRef } from 'react';
import { SystemContext } from './SystemContext';
import { BrowserRouter } from 'react-router-dom';
import { SidekickClipboardContext, sidekickClipboard } from './SidekickClipboardContext';

import useToken from './useToken';
import { useEffect, useState } from 'react';
import { CssBaseline, Box, AppBar, Toolbar, IconButton, Typography,
  Tooltip, Popover,
   Button, Grid } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { styled } from '@mui/system';

import { Menu, MenuItem } from '@mui/material';

// Import icons
import MenuIcon from '@mui/icons-material/Menu';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import AddCommentIcon from '@mui/icons-material/AddComment';

import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import BuildIcon from '@mui/icons-material/Build';
import NotesIcon from '@mui/icons-material/Notes';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import MinimizeIcon from '@mui/icons-material/Minimize';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HelpIcon from '@mui/icons-material/Help';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';
import SubscriptionsOutlinedIcon from '@mui/icons-material/SubscriptionsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';


import Chat from './Chat';
import Script from './Script';
import Personas from './Personas';
import ModelSettings from './ModelSettings';
import PromptEngineer from './PromptEngineer';
import Note from './Note';
import Explorer from './Explorer';
import SettingsManager from './SettingsManager';
import Login from './Login';
import FeedbackButton from './FeedbackButton';
import AppSettings from './AppSettings';
import Admin from './Admin';
import SidekickAI from './SidekickAI';
import StatusBar from './StatusBar';
import Carousel from './Carousel';
import SidekickModalDialog from './SidekickModalDialog';
import { use } from 'marked';
import { AdminPanelSettingsOutlined } from '@mui/icons-material';

const VERSION = "0.4.2";

const ScriptIcon = SmartDisplayOutlinedIcon;
const ScriptsExplorerIcon = SubscriptionsOutlinedIcon;

const App = () => {
  const system = useContext(SystemContext);
  const { token, removeToken, setToken } = useToken();
  const [aboutWindowOpen, setAboutWindowOpen] = useState(false);
  const [sidekickAIOpen, setSidekickAIOpen] = useState(false);
  const [sidekickAIPinned, setSidekickAIPinned] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [scriptsOpen, setScriptsOpen] = useState(true);
  const [chatsPinned, setChatsPinned] = useState(false);
  const [scriptsPinned, setScriptsPinned] = useState(false);
  const [personasOpen, setPersonasOpen] = useState(false);
  const [personasPinned, setPersonasPinned] = useState(false);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [modelSettingsPinned, setModelSettingsPinned] = useState(false);
  const [promptEngineerOpen, setPromptEngineerOpen] = useState(false);
  const [promptEngineerPinned, setPromptEngineerPinned] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [scriptOpen, setScriptOpen] = useState(true);
  const [promptTemplateOpen, setPromptTemplateOpen] = useState(false);
  const [createNote, setCreateNote] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesPinned, setNotesPinned] = useState(false);
  const [provider, setProvider] = useState(null);
  const [modelSettings, setModelSettings] = useState({});
  const [persona, setPersona] = useState({});
  const [newPromptPart, setNewPromptPart] = useState({});
  const [loadChat, setLoadChat] = useState("");
  const [loadScript, setLoadScript] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newPromptTemplate, setNewPromptTemplate] = useState("");
  const [refreshChatsExplorer, setRefreshChatsExplorer] = useState(false);
  const [refreshScriptsExplorer, setRefreshScriptsExplorer] = useState(false);
  const [refreshPromptTemplateExplorer, setRefreshPromptTemplateExplorer] = useState(false);
  const [appendNoteContent, setAppendNoteContent] = useState({content: "", timestamp: Date.now()});
  const [chatNameChanged, setChatNameChanged] = useState("");
  const [scriptNameChanged, setScriptNameChanged] = useState("");
  const [noteNameChanged, setNoteNameChanged] = useState("");
  const [loadNote, setLoadNote] = useState("");
  const [focusOnPrompt, setFocusOnPrompt] = useState(false);
  const [chatRequest, setChatRequest] = useState("");
  const [refreshNotesExplorer, setRefreshNotesExplorer] = useState(false);
  const [temperatureText, setTemperatureText] = useState('');
  const [user, setUser] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);
  const [openScriptId, setOpenScriptId] = useState(null);
  const [openPromptTemplateId, setOpenPromptTemplateId] = useState(null);
  const [openNoteId, setOpenNoteId] = useState(null);
  const [serverUrl, setServerUrl] = useState(process.env.REACT_APP_SERVER_URL || 'http://127.0.0.1:8000');
  const [shouldAskAgainWithPersona, setShouldAskAgainWithPersona] = useState(null);
  const [streamingChatResponse, setStreamingChatResponse] = useState("");
  const [chatStreamingOn, setChatStreamingOn] = useState(true);
  const [appLoaded, setAppLoaded] = useState(false);
  const [appInstanceName, setAppInstanceName] = useState("");
  const [instanceUsage, setInstanceUsage] = useState("");
  const [appSettings, setAppSettings] = useState({});
  const [appMenuAnchorEl, setAppMenuAnchorEl] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [languageSettings, setLanguageSettings] = useState({});
  const [language, setLanguage] = useState(undefined);
  const [languagePrompt, setLanguagePrompt] = useState("");
  const [systemPrompts, setSystemPrompts] = useState({});
  const [generalContextPrompt, setGeneralContextPrompt] = useState(undefined);
  const [responseGuidancePrompt, setResponseGuidancePrompt] = useState(undefined);
  const [responseFormatPrompt, setResponseFormatPrompt] = useState(undefined);
  const [customSystemPrompt, setCustomSystemPrompt] = useState(undefined);
  const [noteWindowMaximized, setNoteWindowMaximized] = useState(false);
  const [chatWindowMaximized, setChatWindowMaximized] = useState(false);
  const [scriptWindowMaximized, setScriptWindowMaximized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [modalDialogInfo, setModalDialogInfo] = useState(undefined);
  const [debugMode, setDebugMode] = useState(false);

  const checkDebugMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
  
    if (debugParam === 'true') {
        setDebugMode(true);
    } else {
        setDebugMode(false);
    }
  }

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#1A94E3' : '#2AA4F3',
      },
      secondary: {
        main: darkMode ? '#76CAE7' : '#86DAF7',
      },
      error: {
        main: '#f44336',
      },
      warning: {
        main: darkMode ? '#ff9800' : '#ffa726',
      },
      info: {
        main: darkMode ? '#2196f3' : '#64b5f6',
      },
      success: {
        main: darkMode ? '#4caf50' : '#81c784',
      },
      background: {
        default: darkMode ? '#333333' : '#ffffff',
        paper: darkMode ? '#111111' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#000000',
        secondary: darkMode ? '#cccccc' : '#000000',
      },
      link: {
        main: darkMode ? '#8886fc' : '#6200ee',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
  });

  const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: theme.palette.secondary.main,
    gap: 2,
  }));
  
  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const mySettingsManager = useRef(null);
  const myLanguageSettingsManager = useRef(null);
  const mySystemPromptsSettingsManager = useRef(null);

  const applyCustomSettings = () => {
    axios.get(`${serverUrl}/system_settings/app`).then(response => {
      debugMode && console.log("App custom settings:", response);
      if ("instanceName" in response.data) {
        setAppInstanceName(response.data.instanceName);
      }
      if ("instanceUsage" in response.data) {
        setInstanceUsage(response.data.instanceUsage);
      }
    }).catch(error => {
      console.error("Error getting App custom settings:", error);
    });
  }

  useEffect(() => {
    checkDebugMode();
  }, []);

  useEffect(() => {
    if (debugMode) {
      console.log("Debug mode is ON");
    } else {
      console.log("Debug mode is OFF");
    }
  }, [debugMode]);

  useEffect(() => {
    // Workaround for the bug in the ResizeObserver that results in loop limit exceeded error
    const originalConsoleError = console.error;
    const originalConsoleWarning = console.warning;
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
            return;
        }
        originalConsoleError(...args);
    };
    console.warning = (...args) => {
      if (args[0].includes('ResizeObserver loop')) {
          return;
      }
      originalConsoleWarning(...args);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
      if (!appLoaded) {
          setAppLoaded(true);
          applyCustomSettings();
      }
  }, [appLoaded]);

  useEffect(() => {
    if (user) {
      mySettingsManager.current = new SettingsManager(serverUrl, token, setToken);
      mySettingsManager.current.loadSettings("app",
        (data) => {
          setAppSettings(data);
          debugMode && console.log("get app settings:", data);
          setSidekickAIOpen(data?.sidekickAIOpenDefault || false);
          setSidekickAIPinned(data?.sidekickAIPinnedOpenDefault || false);
          setChatsOpen(data?.chatsOpenDefault || false);
          setChatsPinned(data?.chatsPinned || false);
          setScriptsOpen(data?.scriptsOpenDefault || false);
          setScriptsPinned(data?.scriptsPinned || false);
          setModelSettingsOpen(data?.modelSettingsOpenDefault || false);
          setModelSettingsPinned(data?.modelSettingsPinned || false);
          setPersonasOpen(data?.personasOpenDefault || false);
          setPersonasPinned(data?.personasPinned || false);
          setPromptEngineerOpen(data?.promptEngineerOpenDefault || false);
          setPromptEngineerPinned(data?.promptEngineerPinned || false);
          setChatOpen(data?.chatOpenDefault || false);
          setScriptOpen(data?.scriptOpenDefault || false);
          setNoteOpen(data?.noteOpenDefault || false);
          setNotesOpen(data?.notesOpenDefault || false);
          setNotesPinned(data?.notesPinned || false);
          setDarkMode(data?.darkMode || false);
          setAppSettingsOpen(false);
          setAdminOpen(user?.properties?.roles?.admin ? true : false);
        },
        (error) => {
            console.log("get app settings:", error);
            setStatusUpdates( prev => [ ...prev, { message: "Error loading app settings. Using defaults."}]);
        }
      );

      myLanguageSettingsManager.current = new SettingsManager(serverUrl, token, setToken);
      myLanguageSettingsManager.current.loadSettings(`languages`,
        (languageData) => {
          setLanguageSettings(languageData);
          return true;
        },
        (error) => {
            console.error(`load languages:`, error);
            return false;
        }
      )
      mySystemPromptsSettingsManager.current = new SettingsManager(serverUrl, token, setToken);
      mySystemPromptsSettingsManager.current.loadSettings(`my_system_prompts`,
        (systemPrompts) => {
          setSystemPrompts(systemPrompts);
          return true;
        },
        (error) => {
            console.error(`load system_prompts:`, error);
            return false;
        }
      );
    }
  }, [user]);

  useEffect(() => {
    if (myLanguageSettingsManager.current) {
      myLanguageSettingsManager.current.setAll(languageSettings,
        (data) => {
          debugMode && console.log("Saved language settings:", data);
        },
        (error) => {
            system.error("System Error saving language settings.", error);
        }
        );
      }
  }, [languageSettings])

  useEffect(() => {
    if (mySystemPromptsSettingsManager.current) {
      mySystemPromptsSettingsManager.current.setAll(systemPrompts,
        (data) => {
          debugMode && console.log("Saved system prompts:", data);
        },
        (error) => {
            system.error("System Error saving system prompts.", error);
        }
        );
      }
  }, [systemPrompts])

  useEffect(() => {
    if (language !== undefined && myLanguageSettingsManager.current && language !== languageSettings.default) {
      let newLanguageSettings = {...languageSettings};
      newLanguageSettings.default = language;
      setLanguageSettings(newLanguageSettings);
    }
  }, [language]);

  useEffect(() => {
    setGeneralContextPrompt(systemPrompts?.generalContextPrompt);
    setResponseGuidancePrompt(systemPrompts?.responseGuidancePrompt);
    setResponseFormatPrompt(systemPrompts?.responseFormatPrompt);
    setCustomSystemPrompt(systemPrompts?.customSystemPrompt);
  }, [systemPrompts]);

  useEffect(() => {
    const updatedPrompts = { ...systemPrompts };

    if (generalContextPrompt) {
        updatedPrompts.generalContextPrompt = generalContextPrompt;
    }
    if (responseGuidancePrompt) {
        updatedPrompts.responseGuidancePrompt = responseGuidancePrompt;
    }
    if (responseFormatPrompt) {
        updatedPrompts.responseFormatPrompt = responseFormatPrompt;
    }
    if (customSystemPrompt) {
        updatedPrompts.customSystemPrompt = customSystemPrompt;
    }

    setSystemPrompts(updatedPrompts);
  }, [generalContextPrompt, responseGuidancePrompt, responseFormatPrompt, customSystemPrompt]);

  useEffect(() => {
    if (appLoaded && mySettingsManager.current) {
      let newAppSettings = {...appSettings,
        sidekickAIOpenDefault: sidekickAIOpen,
        sidekickAIPinnedOpenDefault: sidekickAIPinned,
        chatsOpenDefault: chatsOpen,
        scriptsOpenDefault: scriptsOpen,
        chatsPinned: chatsPinned,
        scriptsPinned: scriptsPinned,
        modelSettingsOpenDefault: modelSettingsOpen,
        modelSettingsPinned: modelSettingsPinned,
        personasOpenDefault: personasOpen,
        personasPinned: personasPinned,
        promptEngineerOpenDefault: promptEngineerOpen,
        promptEngineerPinned: promptEngineerPinned,
        chatOpenDefault: chatOpen,
        scriptOpenDefault: scriptOpen,
        noteOpenDefault: noteOpen,
        notesOpenDefault: notesOpen,
        notesPinned: notesPinned,
        darkMode: darkMode
      };
      setAppSettings(newAppSettings);
      mySettingsManager.current.setAll(newAppSettings,
      (data) => {
        debugMode && console.log("Save app settings saved:", data);
      },
      (error) => {
          system.error("System Error saving app settings.", error);
      }
      );
      // Also save darkMode in the browser local storage so the login page can use it
      localStorage.setItem('darkMode', darkMode);
    }
  }, [sidekickAIOpen, sidekickAIPinned, chatsOpen, chatsPinned, scriptsOpen, scriptsPinned,
      modelSettingsOpen, modelSettingsPinned, personasOpen, personasPinned,
      promptEngineerOpen, promptEngineerPinned, chatOpen, scriptOpen,
      noteOpen, notesOpen, notesPinned,
      darkMode]);

  useEffect(()=>{
  }, [loadChat]);

  useEffect(()=>{
    if (!noteOpen) {
      if (appendNoteContent && appendNoteContent.content !== "") {
        setCreateNote({content: appendNoteContent.content, timestamp: Date.now()});
      }
    }
  }, [appendNoteContent]);

  const unmaximiseWindows = () => {
    setNoteWindowMaximized(false);
    setChatWindowMaximized(false);
    setScriptWindowMaximized(false);
  }

  const handleToggleAppSettingsOpen = (event) => {
    unmaximiseWindows();
    if (!appSettingsOpen) {
        closeUnpinnedLeftSideWindows(event);
        setAppSettingsOpen(Date.now());
      } else {
        setAppSettingsOpen(false);
      }
  }

  const handleToggleAdminOpen = (event) => {
    unmaximiseWindows();
    if (!adminOpen) {
      closeUnpinnedLeftSideWindows(event);
    }
    setAdminOpen(x=>!x);
  }

  const handleLogout = () => {
    setUser(null);
    setStatusUpdates([]);
    // Logout from the Sidekick server
    axios({
      method: "POST",
      url:`${serverUrl}/logout`,
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    .then((response) => {
        removeToken();
        window.location.reload();
    }).catch((error) => {
      if (error.response) {
        console.log(error.response)
        console.log(error.response.status)
        console.log(error.response.headers)
        }
    })
    // Logout from the OIDC server
    // Get the redirect URL (this page) for the OIDC provider to call with the access_token once the user is authenticated
    let redirectUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
    let logoutUrl = `${serverUrl}/oidc_logout?redirect_uri=${redirectUrl}` 
    console.log("Redirecting to OIDC logout page: ", logoutUrl);
    axios({
      method: "GET",
      url: logoutUrl
    }).then((response) => {
      console.log("Logout from OIDC server:", response);
    }).catch((error) => {
      console.error("Error logging out from OIDC server:", error);
    });
    // reset the browser URL to the root
     window.history.replaceState({}, document.title, "/");      
  }

  const closeUnpinnedLeftSideWindows = (event) => {
    if (event && (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)) {
      return;
    }
    if (!sidekickAIPinned) {
      setSidekickAIOpen(false);
    }
    if (!chatsPinned) {
      setChatsOpen(false);
    }
    if (!scriptsPinned) {
      setScriptsOpen(false);
    }
    if (!personasPinned) {
      setPersonasOpen(false);
    }
    if (!modelSettingsPinned) {
      setModelSettingsOpen(false);
    }
    if (!promptEngineerPinned) {
      setPromptEngineerOpen(false);
    }
  }

  const closeUnpinnedRightSideWindows = (event) => {
    if (!notesPinned) {
      setNotesOpen(false);
    }
  }

  const handleToggleChatsOpen = (event) => {
    unmaximiseWindows();
    if (isMobile) {
      if (chatsOpen) {
        setRefreshChatsExplorer({ reason: "showExplorer", timestamp: Date.now() }); // Force a re-render so it scrolls into view
      } else {
        setChatsOpen(Date.now());
      }
    } else {
      if (chatsOpen) {
        setChatsPinned(false);
        setChatsOpen(false);
      } else {
        closeUnpinnedLeftSideWindows(event);
        setChatsOpen(Date.now());
      }
    }
  }

  const handleToggleScriptsOpen = (event) => {
    unmaximiseWindows();
    if (isMobile) {
      if (scriptsOpen) {
        setRefreshScriptsExplorer({ reason: "showExplorer", timestamp: Date.now() }); // Force a re-render so it scrolls into view
      } else {
        setScriptsOpen(Date.now());
      }
    } else {
      if (scriptsOpen) {
        setScriptsPinned(false);
        setScriptsOpen(false);
      } else {
        closeUnpinnedLeftSideWindows(event);
        setScriptsOpen(Date.now());
      }
    }
  }

  const handleToggleSidekickAIOpen = (event) => {  
    unmaximiseWindows();
    if (isMobile) {
      setSidekickAIOpen(Date.now()); // Force a re-render so it scrolls into view
    } else {
      if (sidekickAIOpen) {
        setSidekickAIPinned(false);
        setSidekickAIOpen(false);
      } else {
        closeUnpinnedLeftSideWindows(event);
        setSidekickAIOpen(Date.now());
      }
    }
  }

  const handleTogglePromptEngineerOpen = (event) => {
    unmaximiseWindows();
    if (isMobile) {
      setPromptEngineerOpen(Date.now()); // Force a re-render so it scrolls into view
    } else {
      if (promptEngineerOpen) {
        setPromptEngineerPinned(false);
        setPromptEngineerOpen(false);
      } else {
        closeUnpinnedLeftSideWindows(event);
        setPromptEngineerOpen(Date.now());
      }
    }
  }

  const handleTogglePersonasOpen = (event) => {
    unmaximiseWindows();
    if (isMobile) {
      setPersonasOpen(Date.now()); // Force a re-render so it scrolls into view
    } else {
      if (personasOpen) {
        setPersonasPinned(false);
        setPersonasOpen(false);
      } else {
        closeUnpinnedLeftSideWindows(event);
        setPersonasOpen(Date.now());
      }
    }
  }

  const handleToggleModelSettingsOpen = (event) => {
    unmaximiseWindows();
    if (isMobile) {
      setModelSettingsOpen(Date.now()); // Force a re-render so it scrolls into view
    } else {
      if (modelSettingsOpen) {
        setModelSettingsPinned(false);
        setModelSettingsOpen(false);
      } else {
        closeUnpinnedLeftSideWindows(event);
        setModelSettingsOpen(Date.now());
      }
    }
  }

  const handleToggleChatOpen = () => {
    unmaximiseWindows();
    if (isMobile) {
      setChatOpen(Date.now()); // Force a re-render so it scrolls into view
    } else {
      setChatOpen(state => !state);
    }
  }

  const handleToggleScriptOpen = () => {
    unmaximiseWindows();
    if (isMobile) {
      setScriptOpen(Date.now()); // Force a re-render so it scrolls into view
    } else {
      setScriptOpen(state => !state);
    }
  }

  const handleToggleNoteOpen = () => {
    unmaximiseWindows();
    if (isMobile) {
      setNoteOpen(Date.now()); // Force a re-render so it scrolls into view
    } else {
      setNoteOpen(state => !state);
    }
  }

  const handleToggleNotesOpen = (event) => {
    unmaximiseWindows();
    if (isMobile) {
      if (notesOpen) {
        setRefreshNotesExplorer({ reason: "showExplorer", timestamp: Date.now() }); // Force a re-render so it scrolls into view
      } else {
        setNotesOpen(Date.now());
      }
    } else {
      if (notesOpen) {
        setNotesPinned(false);
        setNotesOpen(false);
      } else {
        closeUnpinnedRightSideWindows(event);
        setNotesOpen(Date.now());
      }
    }
  }

  const handleNoteChange = (change) => {
    debugMode && console.log("handleNoteChange", change);
    if (change.reason === "renamed") {
      setNoteNameChanged(change);
    } else if (change.reason === "created" || change.reason === "deleted" || change.reason === "changed") {
      setRefreshNotesExplorer(change);
    }
  }

  const handleChatChange = (change) => {
    debugMode && console.log("handleChatChange", change);
    if (change.reason === "renamed") {
      setChatNameChanged(change);
    } else if (change.detail === "promptTemplate") {
      handlePromptTemplateChange(change);
    } else {
      setRefreshChatsExplorer(change);
    }
  }

  const handleScriptChange = (change) => {
    debugMode && console.log("handleScriptChange", change);
    if (change.reason === "renamed") {
      setScriptNameChanged(change);
    } else if (change.detail === "promptTemplate") {
      handlePromptTemplateChange(change);
    } else {
      setRefreshScriptsExplorer(change);
    }
  }

  const handlePromptTemplateChange = (change) => {
    debugMode && console.log("handlePromptTemplateChange", change);
    setRefreshPromptTemplateExplorer(change);
  }

  const minimiseWindows = () => {
    setChatOpen(false);
    setScriptOpen(false);
    setAppSettingsOpen(false);
    setAdminOpen(false);
    setChatsOpen(false);
    setChatsPinned(false);
    setScriptsOpen(false);
    setScriptsPinned(false);
    setPromptEngineerOpen(false);
    setPromptEngineerPinned(false);
    setModelSettingsOpen(false);
    setModelSettingsPinned(false);
    setPersonasOpen(false);
    setPersonasPinned(false);
    setCreateNote(false);
    setNotesOpen(false);
    setNotesPinned(false);
    setNoteOpen(false);
    setSidekickAIOpen(false);
    setSidekickAIPinned(false);
  }

  // Provide a generic onChange despatcher for the chat, script, and note components
  const onChange = (xOnChange) => { 
    return (id, name, reason, detail) => {
      xOnChange({"id": id, "name": name, "reason": reason, "detail": detail, timestamp: Date.now()});
    }
  }
  const handleAppMenuOpen = (event) => {
    setAppMenuAnchorEl(event.currentTarget);
  };

  const handleAppMenuClose = () => {
    setAppMenuAnchorEl(null);
  };

  const [savedWindowStates, setSavedWindowStates] = useState({});

  const saveWindowStates = () => {
    setSavedWindowStates({
      sidekickAIOpen: sidekickAIOpen,
      sidekickAIPinned: sidekickAIPinned,
      chatsOpen: chatsOpen,
      chatsPinned: chatsPinned,
      scriptsOpen: scriptsOpen,
      scriptsPinned: scriptsPinned,
      modelSettingsOpen: modelSettingsOpen,
      modelSettingsPinned: modelSettingsPinned,
      personasOpen: personasOpen,
      personasPinned: personasPinned,
      promptEngineerOpen: promptEngineerOpen,
      promptEngineerPinned: promptEngineerPinned,
      chatOpen: chatOpen,
      scriptOpen: scriptOpen,
      noteOpen: noteOpen,
      notesOpen: notesOpen,
      notesPinned: notesPinned,
      appSettingsOpen: appSettingsOpen,
      adminOpen: adminOpen
    });  
  }

  const restoreWindowStates = () => {
    setSidekickAIOpen(savedWindowStates.sidekickAIOpen);
    setSidekickAIPinned(savedWindowStates.sidekickAIPinned);
    setChatsOpen(savedWindowStates.chatsOpen);
    setChatsPinned(savedWindowStates.chatsPinned);
    setScriptsOpen(savedWindowStates.scriptsOpen);
    setScriptsPinned(savedWindowStates.scriptsPinned);
    setModelSettingsOpen(savedWindowStates.modelSettingsOpen);
    setModelSettingsPinned(savedWindowStates.modelSettingsPinned);
    setPersonasOpen(savedWindowStates.personasOpen);
    setPersonasPinned(savedWindowStates.personasPinned);
    setPromptEngineerOpen(savedWindowStates.promptEngineerOpen);
    setPromptEngineerPinned(savedWindowStates.promptEngineerPinned);
    setChatOpen(savedWindowStates.chatOpen);
    setScriptOpen(savedWindowStates.scriptOpen);
    setNoteOpen(savedWindowStates.noteOpen);
    setNotesOpen(savedWindowStates.notesOpen);
    setNotesPinned(savedWindowStates.notesPinned);
    setAppSettingsOpen(savedWindowStates.appSettingsOpen);
    setAdminOpen(savedWindowStates.adminOpen);
  }

  const closePanelsOtherThanNote = () => {
    saveWindowStates();
    setSidekickAIOpen(false);
    setChatsOpen(false);
    setScriptsOpen(false);
    setModelSettingsOpen(false);
    setPersonasOpen(false);
    setPromptEngineerOpen(false);
    setChatOpen(false);
    setScriptOpen(false);
    setNotesOpen(false);
    setAppSettingsOpen(false);
    setAdminOpen(false);
  }

  const closePanelsOtherThanChat = () => {
    saveWindowStates();
    setSidekickAIOpen(false);
    setChatsOpen(false);
    setScriptsOpen(false);
    setModelSettingsOpen(false);
    setPersonasOpen(false);
    setPromptEngineerOpen(false);
    setNoteOpen(false);
    setScriptOpen(false);
    setNotesOpen(false);
    setAppSettingsOpen(false);
    setAdminOpen(false);
  }

  const closePanelsOtherThanScript = () => {
    saveWindowStates();
    setSidekickAIOpen(false);
    setChatsOpen(false);
    setScriptsOpen(false);
    setModelSettingsOpen(false);
    setPersonasOpen(false);
    setPromptEngineerOpen(false);
    setNoteOpen(false);
    setChatOpen(false);
    setNotesOpen(false);
    setAppSettingsOpen(false);
    setAdminOpen(false);
  }

  const versionInfo =
    <Typography sx={{ mr: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", variant: "subtitle2"}}>
      v{VERSION} {appInstanceName} {instanceUsage}
    </Typography>

  const appInfo =
    <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <Typography sx={{ mr: 1}} variant="h6">Sidekick</Typography>
      {isMobile ? null : <Typography variant="subtitle2">{versionInfo}</Typography>}
    </Box>

  const extendedLeftToolbar =
    <>
      <Tooltip title="Minimise windows">
        <IconButton edge="start" color="inherit" aria-label="Minimise windows" onClick={minimiseWindows}>
          <MinimizeIcon/>
        </IconButton>
      </Tooltip>
      <Tooltip title="Sidekick AI help">
        <IconButton edge="start" color="inherit" aria-label="Sidekick AI help" onClick={handleToggleSidekickAIOpen}>
          { sidekickAIOpen ? <HelpIcon/> : <HelpOutlineOutlinedIcon/> }
        </IconButton>                  
      </Tooltip>
      <Tooltip title={ scriptsOpen ? "Close Scripts Explorer" : "Open Scripts Explorer" }>
        <IconButton edge="start" color="inherit" aria-label="Open/Close Scripts Explorer" onClick={handleToggleScriptsOpen}>
          <ScriptsExplorerIcon/>
        </IconButton>
      </Tooltip>
      <Tooltip title={scriptOpen ? "Close Script" : "New Script"}>
        <IconButton edge="start" color="inherit" aria-label={ scriptOpen ? "Close Script" : "Open Script" } onClick={handleToggleScriptOpen}>
          <ScriptIcon/>
        </IconButton>
      </Tooltip>
      <Tooltip title={ modelSettingsOpen ? "Close Model Settings" : "Open Model Settings" }>
        <IconButton edge="start" color="inherit" aria-label="Model settings" onClick={handleToggleModelSettingsOpen}>
          <TuneIcon/>
        </IconButton>
      </Tooltip>
      <Tooltip title={ personasOpen ? "Close AI personas" : "Open AI persons" }>
        <IconButton edge="start" color="inherit" aria-label="Personas" onClick={handleTogglePersonasOpen}>
          { personasOpen ? <PersonIcon/> : <PersonOutlineOutlinedIcon/> }
        </IconButton>
      </Tooltip>
      <Tooltip title={ promptEngineerOpen ? "Close prompt engineer" : "Open prompt engineer" }>
        <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleTogglePromptEngineerOpen}>
          { promptEngineerOpen ? <BuildIcon/> : <BuildOutlinedIcon/> }
        </IconButton>
      </Tooltip>
    </>

  const extendedRightToolbar =
    <>
      <Tooltip title={ darkMode ? "Switch to Light Mode" : "Switch to Dark Mode" }>
        <IconButton edge="end" color="inherit" aria-label={ darkMode ? "Light mode" : "Dark mode" } onClick={handleToggleDarkMode}>
          { darkMode ? <LightModeIcon/> : <DarkModeIcon/> }
        </IconButton>
      </Tooltip>
      <FeedbackButton icon={<RateReviewOutlinedIcon/>} serverUrl={serverUrl} token={token} setToken={setToken}>
          <RateReviewOutlinedIcon/>
      </FeedbackButton>
      <Tooltip title={ appSettingsOpen ? "Close App Settings" : "Open App Setings" }>
        <IconButton edge="end" color="inherit" aria-label="Settings" onClick={handleToggleAppSettingsOpen}>
          { appSettingsOpen ? <SettingsIcon/> : <SettingsOutlinedIcon/> }
        </IconButton>
      </Tooltip>
    </>

  const appRender =
  <BrowserRouter>
    <SystemProvider serverUrl={serverUrl}  setStatusUpdates={setStatusUpdates} setModalDialogInfo={setModalDialogInfo} user={user}
    >
      <SidekickClipboardContext.Provider value={sidekickClipboard}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{display:"flex", height:"100vh", flexDirection:"column", overflow:"hidden"}}>
            <AppBar position="sticky">
              <Toolbar>
                <Box display="flex" gap={2}>
                  <IconButton edge="start" color="inherit" aria-label="Sidekick App Menu" onClick={handleAppMenuOpen}>
                    <MenuIcon/>
                  </IconButton>
                  <Menu
                    id="app-menu"
                    anchorEl={appMenuAnchorEl}
                    open={Boolean(appMenuAnchorEl)}
                    onClose={handleAppMenuClose}
                  >
                    <MenuItem key="menuOpenCloseChats" onClick={() => { handleAppMenuClose(); handleToggleChatsOpen(); }}>
                      { chatsOpen ? <QuestionAnswerIcon/> : <QuestionAnswerOutlinedIcon/> }<Typography  sx={{ ml: 1 }}>{ "Chat Explorer" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenCloseChat" onClick={() => { handleAppMenuClose(); handleToggleChatOpen(); }}>
                      { chatOpen ? <AddCommentIcon/> : <AddCommentOutlinedIcon/> }<Typography  sx={{ ml: 1 }}>{ "Chat" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenCloseNotes" onClick={() => { handleAppMenuClose(); handleToggleNotesOpen(); }}>
                      { notesOpen ? <FolderIcon/> : <FolderOutlinedIcon/> }<Typography  sx={{ ml: 1 }}>{ "Note Explorer" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenCloseNote" onClick={() => { handleAppMenuClose(); handleToggleNoteOpen(); }}>
                      <NotesIcon/><Typography  sx={{ ml: 1 }}>{ "Note" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenCloseScripts" onClick={() => { handleAppMenuClose(); handleToggleScriptsOpen(); }}>
                      <ScriptsExplorerIcon/><Typography  sx={{ ml: 1 }}>{ isMobile ? "Scripts Explorer" : scriptsOpen ? "Scripts Explorer" : "Scripts Explorer" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenCloseScript" onClick={() => { handleAppMenuClose(); handleToggleScriptOpen(); }}>
                      <ScriptIcon/><Typography  sx={{ ml: 1 }}>{ isMobile ? "Script" : scriptOpen ? "Script - Close" : "Script - Open" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenCloseModelSettings" onClick={() => { handleAppMenuClose(); handleToggleModelSettingsOpen(); }}>
                      <TuneIcon/><Typography  sx={{ ml: 1 }}>{ isMobile ? "Model Settings" : modelSettingsOpen ? "Model Settings - Close" : "Model Settings - Open" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenCloseAIPersonas" onClick={() => { handleAppMenuClose(); handleTogglePersonasOpen(); }}>
                      { personasOpen ? <PersonIcon/> : <PersonOutlineOutlinedIcon/> }<Typography  sx={{ ml: 1 }}>{ isMobile ? "Personas" : personasOpen ? "Personas - Close AI Personas" : "Personas - Open AI Personas" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuOpenClosePromptEngineer" onClick={() => { handleAppMenuClose(); handleTogglePromptEngineerOpen(); }}>
                      { promptEngineerOpen ? <BuildIcon/> : <BuildOutlinedIcon/> }<Typography  sx={{ ml: 1 }}>{ isMobile ? "Prompt Engineer" : promptEngineerOpen ? "Prompt Engineer - Close" : "Prompt Engineer - Open" }</Typography>
                    </MenuItem>
                    <MenuItem key="menuMinimiseWindows" onClick={() => { handleAppMenuClose(); minimiseWindows(); }}>
                      <MinimizeIcon/><Typography  sx={{ ml: 1 }}>Minimise Windows</Typography>
                    </MenuItem>
                    <MenuItem key="menuDarkMode" onClick={() => { handleAppMenuClose(); handleToggleDarkMode(); }}>
                      { darkMode ? <LightModeIcon/> : <DarkModeIcon/> }<Typography  sx={{ ml: 1 }}>{ darkMode ? "Switch to Light Mode" : "Switch to Dark Mode" }</Typography>
                    </MenuItem>
                    { user?.is_oidc ? null :
                        <MenuItem key="menuAppSettings" onClick={() => { handleAppMenuClose(); handleToggleAppSettingsOpen(); }}>
                          { appSettingsOpen ? <SettingsIcon/> : <SettingsOutlinedIcon/> }<Typography  sx={{ ml: 1 }}>{ isMobile ? "Settings" : appSettingsOpen ? "Settings - Close App Settings" : "Settings - Open App Setings" }</Typography>
                        </MenuItem>
                    }
                    { user?.properties?.roles?.admin && 
                      <MenuItem key="menuAdmin" onClick={() => { handleAppMenuClose(); handleToggleAdminOpen(); }}>
                        { adminOpen ? <AdminPanelSettingsIcon/> : <AdminPanelSettingsOutlinedIcon/> }<Typography sx={{ ml: 1 }}>{ adminOpen ? "Admin panel - Close" : "Admin panel - Open" }</Typography>
                      </MenuItem>
                    }
                    <MenuItem key="menuOpenCloseSidekickAI" onClick={() => { handleAppMenuClose(); handleToggleSidekickAIOpen(); }}>
                      { sidekickAIOpen ? <HelpIcon/> : <HelpOutlineOutlinedIcon/>}<Typography sx={{ ml: 1 }}>{ sidekickAIOpen ? "Help - Close Sidekick AI Help" : "Help - Open Sidekick AI Help" }</Typography>
                    </MenuItem>
                    <MenuItem onClick={ () => { handleAppMenuClose(); setAboutWindowOpen(Date.now());}}>
                      <InfoOutlinedIcon/><Typography sx={{ ml: 1 }}>About Sidekick</Typography>
                    </MenuItem>
                    <MenuItem key="menuLogout" onClick={() => { handleAppMenuClose(); handleLogout(); }}>
                      <LogoutIcon/><Typography sx={{ ml: 1 }}>Logout</Typography>
                    </MenuItem>
                  </Menu>          
                  {appInfo}
                  {isMobile ? null : <Typography sx={{ mr: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    ({ user?.is_oidc && user?.name ? user.name : user?.id })
                  </Typography>}
                  {isMobile ? null : extendedLeftToolbar}
                  <Tooltip title={ chatsOpen ? "Close Chat Explorer" : "Open Chat Explorer" }>
                    <IconButton edge="start" color="inherit" aria-label="Chat Explorer" onClick={handleToggleChatsOpen}>
                      { chatsOpen ? <QuestionAnswerIcon/> : <QuestionAnswerOutlinedIcon/> }
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={chatOpen ? "Close Chat" : "New Chat"}>
                    <IconButton edge="start" color="inherit" aria-label={ chatOpen ? "Close Chat" : "Open chat" }
                      onClick={(event) => { event.target.blur(); handleToggleChatOpen(event);}}>
                      { chatOpen ? <AddCommentIcon/> : <AddCommentOutlinedIcon/> }
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box display="flex" ml="auto" gap={2}>
                <Tooltip title="Note">
                  <IconButton edge="end" color="inherit" aria-label="Note" onClick={handleToggleNoteOpen}>
                    { noteOpen ? <NotesIcon/> : <PlaylistAddIcon/> }
                  </IconButton>
                </Tooltip>
                <Tooltip title={ notesOpen ? "Close Notes" : "Open Notes" }>
                  <IconButton edge="end" color="inherit" aria-label="Hide/Show notes" onClick={handleToggleNotesOpen}>
                    { notesOpen ? <FolderIcon/> : <FolderOutlinedIcon/> }
                  </IconButton>
                </Tooltip>
                  {isMobile ? null : extendedRightToolbar}
                  { debugMode ? 
                      <Tooltip title="Developer mode">
                        <IconButton edge="end" color="inherit" aria-label="Developer mode">
                          <DeveloperModeIcon/>
                        </IconButton>
                      </Tooltip>
                    : null }
                  <Tooltip title="Logout">
                    <IconButton edge="end" color="inherit" aria-label="Logout" onClick={handleLogout}>
                      <LogoutIcon/>
                    </IconButton>
                  </Tooltip>
                </Box>
              </Toolbar>
            </AppBar>
            <SidekickModalDialog modalDialogInfo={modalDialogInfo} setModalDialogInfo={setModalDialogInfo} />
            <Popover
              open={aboutWindowOpen}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
              }}
              PaperProps={{
                style: {
                  maxWidth: '400px',
                  padding: '4px',
                },
              }}
              onClose={() => {setAboutWindowOpen(false);}}
              >
              <StyledToolbar sx={{ gap: 1 }}>
                <InfoOutlinedIcon/><Typography variant="h6" align="center">About Sidekick</Typography>
              </StyledToolbar>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <Carousel imageFolderName="./images/logo/" filenamePrefix="sidekick_" 
                    filenameExtension=".png" altText="Sidekick logo"
                    transitions="8" cycleTime="250" imageWidth="200px" imageHeight='200px'/>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" sx={{mt:2}}>
                    <Typography style={{ fontWeight: 'bold' }}>Version:</Typography>
                    <Typography style={{ marginLeft: '5px' }}>{VERSION}</Typography>
                  </Box>
                  { appInstanceName !== "" ? 
                      <Box display="flex" alignItems="center">
                        <Typography style={{ fontWeight: 'bold' }}>Instance:</Typography>
                        <Typography style={{ marginLeft: '5px' }}>{appInstanceName}</Typography>
                      </Box>
                    : null
                  }
                  { instanceUsage !== "" ? 
                      <Box display="flex" alignItems="center">
                        <Typography style={{ fontWeight: 'bold' }}>Usage:</Typography>
                        <Typography style={{ marginLeft: '5px' }}>{instanceUsage}</Typography>
                      </Box>
                    : null
                  }
                  <Box display="flex" alignItems="center">
                    <Typography style={{ fontWeight: 'bold' }}>Logged in as:</Typography>
                    <Typography multiline style={{ marginLeft: '5px', fontSize: '0.8rem', wordWrap: 'break-word', overflowWrap: 'break-word',
                      maxWidth: '100px' }}>
                      { user?.is_oidc && user?.name ? user.name : user?.id }
                    </Typography>
                  </Box>
                  <Typography sx={{mt:1}} style={{ fontSize: '0.8rem' }}>Sidekick is an open-source AI powered tool for creativity, thinking, learning, exploring ideas, problem-solving, and getting things done.</Typography>
                  <Typography sx={{mt:1}} style={{ fontSize: '0.8rem' }}>You can find the project here: <a href="https://github.com/embernet/sidekick" target="_blank" rel="noreferrer">github.com/embernet/sidekick</a></Typography>
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end">
                <Button onClick={()=>{setAboutWindowOpen(false);}}>Close</Button>
              </Box>
            </Popover>
            <Box id="app-workspace" display="flex" height="100%" flexDirection="row" flex="1" 
              overflow-y="hidden" overflow="auto" width="100%">
              <SidekickAI
                sidekickAIOpen={sidekickAIOpen}
                setSidekickAIOpen={setSidekickAIOpen}
                windowPinnedOpen = {sidekickAIPinned}
                setWindowPinnedOpen = {setSidekickAIPinned}
                chatStreamingOn={chatStreamingOn} 
                serverUrl={serverUrl} token={token} setToken={setToken}
                darkMode={darkMode}
                isMobile={isMobile}
                language={language}
                languagePrompt={languagePrompt}
                debugMode={debugMode}
              />
              { user?.properties?.roles?.admin && adminOpen ? <Admin 
                adminOpen={adminOpen}
                setAdminOpen={setAdminOpen}
                user={user}
                setUser={setUser}
                serverUrl={serverUrl} token={token} setToken={setToken}
                darkMode={darkMode}
              /> : null }
              <AppSettings 
                appSettingsOpen={appSettingsOpen}
                setAppSettingsOpen={setAppSettingsOpen}
                user={user}
                setUser={setUser}
                serverUrl={serverUrl} token={token} setToken={setToken}
                darkMode={darkMode}
                isMobile={isMobile}
                languageSettings={languageSettings} setLanguageSettings={setLanguageSettings}
                language={language} setLanguage={setLanguage}
                languagePrompt={languagePrompt} setLanguagePrompt={setLanguagePrompt}
                systemPrompts={systemPrompts} setSystemPrompts={setSystemPrompts}
              />
              { chatsOpen ? <Explorer
                onClose={()=>{setChatsOpen(false)}}
                name="Chats"
                icon={<QuestionAnswerIcon />}
                folder="chats"
                openItemId={openChatId}
                setLoadDoc={setLoadChat}
                docNameChanged={chatNameChanged}
                refresh={refreshChatsExplorer}
                setRefresh={setRefreshChatsExplorer}
                itemOpen={chatOpen}
                setItemOpen={setChatOpen}
                windowPinnedOpen = {chatsPinned}
                setWindowPinnedOpen = {setChatsPinned}
                deleteEnabled={true}
                darkMode={darkMode}
                serverUrl={serverUrl} token={token} setToken={setToken}
                isMobile={isMobile}
              /> : null }
              <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", flex: 1 }}>
                <Chat 
                  provider = {provider}
                  modelSettings={modelSettings} 
                  persona={persona} 
                  closeOtherPanels={closePanelsOtherThanChat}
                  restoreOtherPanels={restoreWindowStates}
                  newPromptPart={newPromptPart}
                  newPrompt={newPrompt} 
                  newPromptTemplate={newPromptTemplate}
                  loadChat={loadChat} 
                  setAppendNoteContent={setAppendNoteContent}
                  focusOnPrompt={focusOnPrompt}
                  setFocusOnPrompt={setFocusOnPrompt}
                  chatRequest={chatRequest}
                  chatOpen={chatOpen}
                  noteOpen={noteOpen}
                  windowMaximized={chatWindowMaximized}
                  setWindowMaximized={setChatWindowMaximized}
                  setChatOpen={setChatOpen}
                  darkMode={darkMode}
                  temperatureText={temperatureText}
                  setTemperatureText={setTemperatureText}
                  modelSettingsOpen={modelSettingsOpen}
                  toggleModelSettingsOpen={handleToggleModelSettingsOpen}
                  personasOpen={personasOpen}
                  togglePersonasOpen={handleTogglePersonasOpen}
                  promptEngineerOpen={promptEngineerOpen}
                  togglePromptEngineerOpen={handleTogglePromptEngineerOpen}
                  onChange={onChange(handleChatChange)}
                  setOpenChatId={setOpenChatId}
                  shouldAskAgainWithPersona={shouldAskAgainWithPersona}
                  serverUrl={serverUrl} token={token} setToken={setToken}
                  streamingChatResponse={streamingChatResponse}
                  setStreamingChatResponse={setStreamingChatResponse}
                  chatStreamingOn={chatStreamingOn}
                  maxWidth={appSettings.maxPanelWidth}
                  isMobile={isMobile}
                  language={language}
                  languagePrompt={languagePrompt}
                  systemPrompts={systemPrompts}
                  debugMode={debugMode}
                  refreshNotesExplorer={refreshNotesExplorer}
                />
                <ModelSettings 
                  setModelSettings={setModelSettings}
                  setFocusOnPrompt={setFocusOnPrompt}
                  modelSettingsOpen={modelSettingsOpen}
                  setModelSettingsOpen={setModelSettingsOpen}
                  windowPinnedOpen = {modelSettingsPinned}
                  setWindowPinnedOpen = {setModelSettingsPinned}
                  temperatureText={temperatureText}
                  setTemperatureText={setTemperatureText}
                  settingsManager={new SettingsManager(serverUrl, token, setToken)}
                  serverUrl={serverUrl} token={token} setToken={setToken}
                  chatStreamingOn={chatStreamingOn}
                  setChatStreamingOn={setChatStreamingOn}
                  darkMode={darkMode}
                  isMobile={isMobile}
                />
                <Personas 
                  onClose={() => {setPersonasOpen(false)}} 
                  persona={persona} 
                  setPersona={setPersona}
                  setFocusOnPrompt={setFocusOnPrompt}
                  personasOpen={personasOpen}
                  windowPinnedOpen = {personasPinned}
                  setWindowPinnedOpen = {setPersonasPinned}
                  settingsManager={new SettingsManager(serverUrl, token, setToken)}
                  setShouldAskAgainWithPersona={setShouldAskAgainWithPersona}
                  serverUrl={serverUrl} token={token} setToken={setToken}
                  streamingChatResponse={streamingChatResponse}
                  darkMode={darkMode}
                  isMobile={isMobile}
                />
                { promptEngineerOpen ? 
                  <PromptEngineer
                    promptEngineerOpen={promptEngineerOpen}
                    onClose={() => {setPromptEngineerOpen(false)}}
                    windowPinnedOpen={promptEngineerPinned}
                    setWindowPinnedOpen={setPromptEngineerPinned}
                    setNewPromptPart={setNewPromptPart}
                    setNewPrompt={setNewPrompt}
                    setNewPromptTemplate={setNewPromptTemplate}
                    setFocusOnPrompt={setFocusOnPrompt}
                    openPromptTemplateId={openPromptTemplateId}
                    refreshPromptTemplateExplorer={refreshPromptTemplateExplorer}
                    setRefreshPromptTemplateExplorer={setRefreshPromptTemplateExplorer}
                    setPromptTemplateOpen={setPromptTemplateOpen}
                    promptTemplateOpen={promptTemplateOpen}
                    settingsManager={new SettingsManager(serverUrl, token, setToken)}
                    serverUrl={serverUrl} token={token} setToken={setToken}
                    darkMode={darkMode}
                    isMobile={isMobile}
                    debugMode={debugMode}
                  />
                  : null }
                { scriptsOpen ? <Explorer
                  onClose={()=>{setScriptsOpen(false)}}
                  name="Scripts"
                  icon={<ScriptsExplorerIcon />}
                  folder="scripts"
                  openItemId={openScriptId}
                  setLoadDoc={setLoadScript}
                  docNameChanged={scriptNameChanged}
                  refresh={refreshScriptsExplorer}
                  setRefresh={setRefreshScriptsExplorer}
                  itemOpen={scriptOpen}
                  setItemOpen={setScriptOpen}
                  windowPinnedOpen = {scriptsPinned}
                  setWindowPinnedOpen = {setScriptsPinned}
                  deleteEnabled={true}
                  darkMode={darkMode}
                  serverUrl={serverUrl} token={token} setToken={setToken}
                  isMobile={isMobile}
                /> : null }
                <Script
                  scriptOpen={scriptOpen}
                  setScriptOpen={setScriptOpen} 
                  ScriptIcon={ScriptIcon}
                  darkMode={darkMode}
                  maxWidth={appSettings.maxPanelWidth}
                  windowMaximized={scriptWindowMaximized}
                  setWindowMaximized={setScriptWindowMaximized}
                  provider = {provider}
                  modelSettings={modelSettings} 
                  persona={persona} 
                  loadScript={loadScript} 
                  closeOtherPanels={closePanelsOtherThanScript}
                  restoreOtherPanels={restoreWindowStates}
                  setNewPromptPart={setNewPromptPart}
                  setNewPrompt={setNewPrompt}
                  setChatRequest={setChatRequest}
                  onChange={onChange(handleScriptChange)}
                  setOpenScriptId={setOpenScriptId}
                  serverUrl={serverUrl} token={token} setToken={setToken}
                  isMobile={isMobile}
                  language={language}
                  languagePrompt={languagePrompt}
                />
                <Note 
                  noteOpen={noteOpen}
                  windowMaximized={noteWindowMaximized}
                  setWindowMaximized={setNoteWindowMaximized}
                  setNoteOpen={setNoteOpen} 
                  appendNoteContent={appendNoteContent} 
                  loadNote={loadNote} 
                  createNote={createNote}
                  darkMode={darkMode}
                  closeOtherPanels={closePanelsOtherThanNote}
                  restoreOtherPanels={restoreWindowStates}
                  setNewPromptPart={setNewPromptPart}
                  setNewPrompt={setNewPrompt}
                  setChatRequest={setChatRequest}
                  onChange={onChange(handleNoteChange)}
                  setOpenNoteId={setOpenNoteId}
                  modelSettings={modelSettings}
                  persona={persona}
                  serverUrl={serverUrl} token={token} setToken={setToken}
                  maxWidth={appSettings.maxPanelWidth}
                  isMobile={isMobile}
                  language={language}
                  languagePrompt={languagePrompt}
                  debugMode={debugMode}
                />
              </Box>
              { notesOpen ? <Explorer
                onClose={()=>{setNotesOpen(false)}}
                windowPinnedOpen = {notesPinned}
                setWindowPinnedOpen = {setNotesPinned}
                name="Notes"
                icon={<FolderIcon />}
                folder="notes"
                openItemId={openNoteId}
                setLoadDoc={setLoadNote}
                docNameChanged={noteNameChanged}
                refresh={refreshNotesExplorer}
                setRefresh={setRefreshNotesExplorer}
                itemOpen={openNoteId} // tell the explorer which note is open
                setItemOpen={setNoteOpen}
                deleteEnabled={true}
                darkMode={darkMode}
                serverUrl={serverUrl} token={token} setToken={setToken}
                isMobile={isMobile}
              /> : null}
            </Box>
          <StatusBar
            statusUpdates={statusUpdates}
            darkMode={darkMode}
            modelSettings={modelSettings}
            persona={persona}
            modelSettingsOpen={modelSettingsOpen}
            toggleModelSettingsOpen={handleToggleModelSettingsOpen}
            personasOpen={personasOpen}
            togglePersonasOpen={handleTogglePersonasOpen}
            isMobile={isMobile}
            languageSettings={languageSettings}
            setLanguageSettings={setLanguageSettings}
            language={language} setLanguage={setLanguage}
            languagePrompt={languagePrompt} setLanguagePrompt={setLanguagePrompt}
          />
        </Box>
      </ThemeProvider>
    </SidekickClipboardContext.Provider>
  </SystemProvider>
</BrowserRouter>

const loginRender = 
  <SystemProvider serverUrl={serverUrl} setStatusUpdates={setStatusUpdates} setModalDialogInfo={setModalDialogInfo} user={user}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{display:"flex", height:"100vh", flexDirection:"column", overflow:"hidden"}}>
          <AppBar position="sticky">
            <Toolbar>
              {appInfo}
            </Toolbar>
          </AppBar>
          <Box sx={{display:"flex", flexDirection:"row", flex:"1",
          overflowY:"hidden", overflow:"auto", width:"100%",
          justifyContent:"center", alignItems:"center"}}>
            <Login setUser={setUser} serverUrl={serverUrl} setToken={setToken} darkMode={darkMode} setDarkMode={setDarkMode}/>
          </Box>
          <StatusBar statusUpdates={statusUpdates}/>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  </SystemProvider>

  return user ? appRender : loginRender;
}

export default App;
