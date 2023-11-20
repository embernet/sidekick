// File: App.js
// Author: Mark Burnett
// Date: 2022-09-23
// Description: An AI powered tool for creativity, thinking, exploring ideas, problem-solving, knowledge-building,
// and getting things done

import './App.css';
import axios from 'axios';
import { SystemProvider } from './SystemContext';
import { useContext, useRef } from 'react';
import { SystemContext } from './SystemContext';
import { BrowserRouter } from 'react-router-dom';
import useToken from './useToken';
import { useEffect, useState } from 'react';
import { CssBaseline, Box, AppBar, Toolbar, IconButton, Typography, Tooltip } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Menu, MenuItem } from '@mui/material';

// Import icons
import MenuIcon from '@mui/icons-material/Menu';
import ModeCommentIcon from '@mui/icons-material/ModeComment';
import AddCommentIcon from '@mui/icons-material/AddComment';

import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import NotesIcon from '@mui/icons-material/Notes';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import MinimizeIcon from '@mui/icons-material/Minimize';
import FolderIcon from '@mui/icons-material/Folder';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HelpIcon from '@mui/icons-material/Help';


import Chat from './Chat';
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

import { theme } from './theme';

import StatusBar from './StatusBar';

const VERSION = "0.1";

function App() {
  const system = useContext(SystemContext);
  const { token, removeToken, setToken } = useToken();
  const [sidekickAIOpen, setSidekickAIOpen] = useState(false);
  const [sidekickAIPinned, setSidekickAIPinned] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [chatsPinned, setChatsPinned] = useState(false);
  const [promptTemplatesPinned, setPromptTemplatesPinned] = useState(false);
  const [personasOpen, setPersonasOpen] = useState(false);
  const [personasPinned, setPersonasPinned] = useState(false);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [modelSettingsPinned, setModelSettingsPinned] = useState(false);
  const [promptEngineerOpen, setPromptEngineerOpen] = useState(false);
  const [promptEngineerPinned, setPromptEngineerPinned] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
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
  const [newPrompt, setNewPrompt] = useState("");
  const [newPromptTemplate, setNewPromptTemplate] = useState("");
  const [refreshChatsExplorer, setRefreshChatsExplorer] = useState(false);
  const [refreshPromptTemplateExplorer, setRefreshPromptTemplateExplorer] = useState(false);
  const [appendNoteContent, setAppendNoteContent] = useState({content: "", timestamp: Date.now()});
  const [chatNameChanged, setChatNameChanged] = useState("");
  const [promptTemplateNameChanged, setPromptTemplateNameChanged] = useState("");
  const [noteNameChanged, setNoteNameChanged] = useState("");
  const [loadNote, setLoadNote] = useState("");
  const [focusOnPrompt, setFocusOnPrompt] = useState(false);
  const [chatRequest, setChatRequest] = useState("");
  const [refreshNotesExplorer, setRefreshNotesExplorer] = useState(false);
  const [temperatureText, setTemperatureText] = useState('');
  const [user, setUser] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);
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
  const mySettingsManager = useRef(null);

  const applyCustomSettings = () => {
    axios.get(`${serverUrl}/system_settings/app`).then(response => {
      console.log("App custom settings:", response);
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
        console.log("get app settings:", data);
        setSidekickAIOpen(data.sidekickAIOpenDefault);
        setSidekickAIPinned(data.sidekickAIPinnedOpenDefault);
        setChatsOpen(data.chatsOpenDefault);
        setChatsPinned(data.chatsPinned);
        setModelSettingsOpen(data.modelSettingsOpenDefault);
        setModelSettingsPinned(data.modelSettingsPinned);
        setPersonasOpen(data.personasOpenDefault);
        setPersonasPinned(data.personasPinned);
        setPromptEngineerOpen(data.promptEngineerOpenDefault);
        setPromptEngineerPinned(data.promptEngineerPinned);
        setChatOpen(data.chatOpenDefault);
        setNoteOpen(data.noteOpenDefault);
        setNotesOpen(data.notesOpenDefault);
        setNotesPinned(data.notesPinned);
        setAppSettingsOpen(false);
        setAdminOpen(false);
      },
      (error) => {
          console.log("get app settings:", error);
          setStatusUpdates( prev => [ ...prev, { message: "Error loading app settings. Using defaults."}]);
      }
      );
    }
  }, [user]);

  useEffect(() => {
    if (appLoaded && mySettingsManager.current) {
      console.log("Save app settings started");
      let newAppSettings = {...appSettings,
        sidekickAIOpenDefault: sidekickAIOpen,
        sidekickAIPinnedOpenDefault: sidekickAIPinned,
        chatsOpenDefault: chatsOpen,
        chatsPinned: chatsPinned,
        modelSettingsOpenDefault: modelSettingsOpen,
        modelSettingsPinned: modelSettingsPinned,
        personasOpenDefault: personasOpen,
        personasPinned: personasPinned,
        promptEngineerOpenDefault: promptEngineerOpen,
        promptEngineerPinned: promptEngineerPinned,
        chatOpenDefault: chatOpen,
        noteOpenDefault: noteOpen,
        notesOpenDefault: notesOpen,
        notesPinned: notesPinned
      };
      setAppSettings(newAppSettings);
      mySettingsManager.current.setAll(newAppSettings,
      (data) => {
        console.log("Save app settings saved:", data);
      },
      (error) => {
          system.error("System Error saving app settings.", error);
      }
      );
    }
  }, [sidekickAIOpen, sidekickAIPinned, chatsOpen, chatsPinned, modelSettingsOpen,
      modelSettingsPinned, personasOpen, personasPinned,
      promptEngineerOpen, promptEngineerPinned, chatOpen, noteOpen, notesOpen, notesPinned]);

  useEffect(()=>{
  }, [loadChat]);

  useEffect(()=>{
    if (!noteOpen) {
      if (appendNoteContent && appendNoteContent.content !== "") {
        setCreateNote({content: appendNoteContent.content, timestamp: Date.now()});
      }
    }
  }, [appendNoteContent]);

  const handleToggleAppSettingsOpen = (event) => {
    if (!appSettingsOpen) {
      closeUnpinnedLeftSideWindows(event);
    }
    setAppSettingsOpen(state => !state);
  }

  const handleToggleAdminOpen = (event) => {
    if (!adminOpen) {
      closeUnpinnedLeftSideWindows(event);
    }
    setAdminOpen(state => !state);
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
    if (chatsOpen) {
      setChatsPinned(false);
      setChatsOpen(false);
    } else {
      closeUnpinnedLeftSideWindows(event);
      setChatsOpen(true);
    }
  }

  const handleToggleSidekickAIOpen = (event) => {  
    if (sidekickAIOpen) {
      setSidekickAIPinned(false);
      setSidekickAIOpen(false);
    } else {
      closeUnpinnedLeftSideWindows(event);
      setSidekickAIOpen(true);
    }
  }

  const handleTogglePromptEngineerOpen = (event) => {
    if (promptEngineerOpen) {
      setPromptEngineerPinned(false);
      setPromptEngineerOpen(false);
    } else {
      closeUnpinnedLeftSideWindows(event);
      setPromptEngineerOpen(true);
    }
  }

  const handleTogglePersonasOpen = (event) => {
    if (personasOpen) {
      setPersonasPinned(false);
      setPersonasOpen(false);
    } else {
      closeUnpinnedLeftSideWindows(event);
      setPersonasOpen(true);
    }
  }

  const handleToggleModelSettingsOpen = (event) => {
    if (modelSettingsOpen) {
      setModelSettingsPinned(false);
      setModelSettingsOpen(false);
    } else {
      closeUnpinnedLeftSideWindows(event);
      setModelSettingsOpen(true);
    }
  }

  const handleToggleChatOpen = () => {
    setChatOpen(state => !state);
  }

  const handleToggleNoteOpen = () => {
    setNoteOpen(state => !state);
  }

  const handleToggleNotesOpen = (event) => {
    if (notesOpen) {
      setNotesPinned(false);
      setNotesOpen(false);
    } else {
      closeUnpinnedRightSideWindows(event);
      setNotesOpen(true);
    }
  }

  const handleNoteChange = (change) => {
    console.log("handleNoteChange", change);
    if (change.reason === "renamed") {
      setNoteNameChanged(change);
    } else {
      setRefreshNotesExplorer(change);
    }
  }

  const handleChatChange = (change) => {
    console.log("handleChatChange", change);
    if (change.reason === "renamed") {
      setChatNameChanged(change);
    } else if (change.detail === "promptTemplate") {
      handlePromptTemplateChange(change);
    } else {
      setRefreshChatsExplorer(change);
    }
  }

  const handlePromptTemplateChange = (change) => {
    console.log("handlePromptTemplateChange", change);
    setRefreshPromptTemplateExplorer(change);
  }

  const minimiseWindows = () => {
    setChatOpen(false);
    setAppSettingsOpen(false);
    setAdminOpen(false);
    setChatsOpen(false);
    setChatsPinned(false);
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

  // Provide a generic onChange despatcher for the chat and note components
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

  const appInfo =
    <Box display="flex">
      <Typography sx={{ mr: 2, display: "inline-flex", alignItems: "center", justifyContent: "center" }} variant="h6">Sidekick</Typography>
      <Typography sx={{ mr: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }} variant='subtitle2'>
        v{VERSION} {appInstanceName} {instanceUsage}
      </Typography>
    </Box>


  const appRender =
  <BrowserRouter>
    <SystemProvider serverUrl={serverUrl}  setStatusUpdates={setStatusUpdates}>
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
                  <MenuItem key="menuOpenCloseSidekickAI" onClick={() => { handleAppMenuClose(); handleToggleSidekickAIOpen(); }}>
                    <HelpIcon/><Typography  sx={{ ml: 1 }}>{ sidekickAIOpen ? "Help - Close Sidekick AI Help" : "Help - Open Sidekick AI Help" }</Typography>
                  </MenuItem>
                  <MenuItem key="menuOpenCloseChats" onClick={() => { handleAppMenuClose(); handleToggleChatsOpen(); }}>
                    <QuestionAnswerIcon/><Typography  sx={{ ml: 1 }}>{ chatsOpen ? "History - Close Chat History" : "History - Open Chat History" }</Typography>
                  </MenuItem>
                  <MenuItem key="menuOpenCloseModelSettings" onClick={() => { handleAppMenuClose(); handleToggleModelSettingsOpen(); }}>
                    <TuneIcon/><Typography  sx={{ ml: 1 }}>{ modelSettingsOpen ? "Model - Close Model Settings" : "Model - Open Model Settings" }</Typography>
                  </MenuItem>
                  <MenuItem key="menuOpenCloseAIPersonas" onClick={() => { handleAppMenuClose(); handleTogglePersonasOpen(); }}>
                    <PersonIcon/><Typography  sx={{ ml: 1 }}>{ sidekickAIOpen ? "Personas - Close AI Personas" : "Personas - Open AI Personas" }</Typography>
                  </MenuItem>
                  <MenuItem key="menuOpenClosePromptEngineer" onClick={() => { handleAppMenuClose(); handleTogglePromptEngineerOpen(); }}>
                    <BuildIcon/><Typography  sx={{ ml: 1 }}>{ sidekickAIOpen ? "Prompt Engineer - Close" : "Prompt Engineer - Open" }</Typography>
                  </MenuItem>
                  <MenuItem key="menuOpenCloseChat" onClick={() => { handleAppMenuClose(); handleToggleChatOpen(); }}>
                    { chatOpen ? <ModeCommentIcon/> : <AddCommentIcon/> }<Typography  sx={{ ml: 1 }}>{ chatOpen ? "Chat - Close" : "Chat - Open" }</Typography>
                  </MenuItem>
                  <MenuItem key="menuMinimiseWindows" onClick={() => { handleAppMenuClose(); minimiseWindows(); }}>
                    <MinimizeIcon/><Typography  sx={{ ml: 1 }}>Minimise Windows</Typography>
                  </MenuItem>
                  <MenuItem key="menuOpenCloseNote" onClick={() => { handleAppMenuClose(); handleToggleNoteOpen(); }}>
                    { noteOpen ? <NotesIcon/> : <PlaylistAddIcon/> }<Typography  sx={{ ml: 1 }}>{noteOpen ? "Note - Close Note" : "Note - New Note"}</Typography>
                  </MenuItem>
                  <MenuItem key="menuOpenCloseNotes" onClick={() => { handleAppMenuClose(); handleToggleNotesOpen(); }}>
                    <FolderIcon/><Typography  sx={{ ml: 1 }}>{notesOpen ? "Notes - Close Notes" : "Notes - Open Notes"}</Typography>
                  </MenuItem>
                  { user?.is_oidc ? null : <MenuItem key="menuAppSettings" onClick={() => { handleAppMenuClose(); handleToggleAppSettingsOpen(); }}>
                    <SettingsIcon/><Typography  sx={{ ml: 1 }}>{ appSettingsOpen ? "Settings - Close App Settings" : "Settings - Open App Setings" }</Typography>
                  </MenuItem> }
                  { user?.properties?.roles?.admin && <MenuItem key="menuAdmin" onClick={() => { handleAppMenuClose(); handleToggleAdminOpen(); }}>
                    <AdminPanelSettingsIcon/><Typography sx={{ ml: 1 }}>Admin</Typography>
                  </MenuItem> }
                  <MenuItem key="menuLogout" onClick={() => { handleAppMenuClose(); handleLogout(); }}>
                    <LogoutIcon/><Typography sx={{ ml: 1 }}>Logout</Typography>
                  </MenuItem>
                </Menu>          
                {appInfo}
                <Typography sx={{ mr: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  ({ user?.name ? user.name : user?.id })
                </Typography>
                <Tooltip title="Sidekick AI help">
                  <IconButton edge="start" color="inherit" aria-label="Sidekick AI help" onClick={handleToggleSidekickAIOpen}>
                    <HelpIcon/>
                  </IconButton>                  
                </Tooltip>
                <Tooltip title={ chatsOpen ? "Close Chat History" : "Open Chat History" }>
                  <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleToggleChatsOpen}>
                    <QuestionAnswerIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={ modelSettingsOpen ? "Close Model Settings" : "Open Model Settings" }>
                  <IconButton edge="start" color="inherit" aria-label="Model settings" onClick={handleToggleModelSettingsOpen}>
                    <TuneIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={ personasOpen ? "Close AI personas" : "Open AI persons" }>
                  <IconButton edge="start" color="inherit" aria-label="Personas" onClick={handleTogglePersonasOpen}>
                    <PersonIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={ promptEngineerOpen ? "Close prompt engineer" : "Open prompt engineer" }>
                  <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleTogglePromptEngineerOpen}>
                    <BuildIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={chatOpen ? "Close Chat" : "New Chat"}>
                  <IconButton edge="start" color="inherit" aria-label={ chatOpen ? "Close Chat" : "Open chat" } onClick={handleToggleChatOpen}>
                    { chatOpen ? <ModeCommentIcon/> : <AddCommentIcon/> }
                  </IconButton>
                </Tooltip>
                <Tooltip title="Minimise windows">
                  <IconButton edge="start" color="inherit" aria-label="Minimise windows" onClick={minimiseWindows}>
                    <MinimizeIcon/>
                  </IconButton>
                </Tooltip>
              </Box>
              <Box display="flex" ml="auto" gap={2}>
                <Tooltip title={noteOpen ? "Close Note" : "New Note"}>
                  <IconButton edge="end" color="inherit" aria-label="New note" onClick={handleToggleNoteOpen}>
                    { noteOpen ? <NotesIcon/> : <PlaylistAddIcon/> }
                  </IconButton>
                </Tooltip>
                <Tooltip title={ notesOpen ? "Close Notes" : "Open Notes" }>
                  <IconButton edge="end" color="inherit" aria-label="Hide/Show notes" onClick={handleToggleNotesOpen}>
                    <FolderIcon/>
                  </IconButton>
                </Tooltip>
                <FeedbackButton icon={<RateReviewIcon/>} serverUrl={serverUrl} token={token} setToken={setToken}>
                    <RateReviewIcon/>
                </FeedbackButton>
                { user?.is_oidc ? null : <Tooltip title={ appSettingsOpen ? "Close App Settings" : "Open App Setings" }>
                  <IconButton edge="end" color="inherit" aria-label="Settings" onClick={handleToggleAppSettingsOpen}>
                    <SettingsIcon/>
                  </IconButton>
                </Tooltip> }
                <Tooltip title="Logout">
                  <IconButton edge="end" color="inherit" aria-label="Logout" onClick={handleLogout}>
                    <LogoutIcon/>
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>
          <Box id="app-workspace" display="flex" height="100%" flexDirection="row" flex="1" 
            overflow-y="hidden" overflow="auto" width="100%">
            <SidekickAI
              sidekickAIOpen={sidekickAIOpen}
              setSidekickAIOpen={setSidekickAIOpen}
              windowPinnedOpen = {sidekickAIPinned}
              setWindowPinnedOpen = {setSidekickAIPinned}
              chatStreamingOn={chatStreamingOn} 
              serverUrl={serverUrl} token={token} setToken={setToken}
            />
            { user?.properties?.roles?.admin && adminOpen ? <Admin 
              adminOpen={adminOpen}
              setAdminOpen={setAdminOpen}
              user={user}
              setUser={setUser}
              serverUrl={serverUrl} token={token} setToken={setToken}
            /> : null }
            <AppSettings 
              appSettingsOpen={appSettingsOpen}
              setAppSettingsOpen={setAppSettingsOpen}
              user={user}
              setUser={setUser}
              serverUrl={serverUrl} token={token} setToken={setToken}
            />
            { chatsOpen ? <Explorer
            handleToggleExplorer={handleToggleChatsOpen}
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
            serverUrl={serverUrl} token={token} setToken={setToken}
            /> : null }
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
            />
            <Personas 
            handleTogglePersonas={handleTogglePersonasOpen} 
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
            />
            { promptEngineerOpen ? 
              <PromptEngineer
                handleTogglePromptEngineer={handleTogglePromptEngineerOpen} 
                windowPinnedOpen={promptEngineerPinned}
                setWindowPinnedOpen={setPromptEngineerPinned}
                setNewPromptPart={setNewPromptPart}
                setNewPrompt={setNewPrompt}
                setNewPromptTemplate={setNewPromptTemplate}
                openPromptTemplateId={openPromptTemplateId}
                promptTemplateNameChanged={promptTemplateNameChanged}
                refreshPromptTemplateExplorer={refreshPromptTemplateExplorer}
                setRefreshPromptTemplateExplorer={setRefreshPromptTemplateExplorer}
                setPromptTemplateOpen={setPromptTemplateOpen}
                promptTemplateOpen={promptTemplateOpen}
                settingsManager={new SettingsManager(serverUrl, token, setToken)}
                serverUrl={serverUrl} token={token} setToken={setToken}
                />
              : null }
              <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", flex: 1 }}>
                <Chat 
                  provider = {provider}
                  modelSettings={modelSettings} 
                  persona={persona} 
                  newPromptPart={newPromptPart}
                  newPrompt={newPrompt} 
                  newPromptTemplate={newPromptTemplate}
                  loadChat={loadChat} 
                  setAppendNoteContent={setAppendNoteContent}
                  focusOnPrompt={focusOnPrompt}
                  setFocusOnPrompt={setFocusOnPrompt}
                  chatRequest={chatRequest}
                  chatOpen={chatOpen}
                  setChatOpen={setChatOpen}
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
                  />
              <Note 
                noteOpen={noteOpen}
                setNoteOpen={setNoteOpen} 
                appendNoteContent={appendNoteContent} 
                loadNote={loadNote} 
                createNote={createNote}
                setNewPromptPart={setNewPromptPart}
                setNewPrompt={setNewPrompt}
                setChatRequest={setChatRequest}
                onChange={onChange(handleNoteChange)}
                setOpenNoteId={setOpenNoteId}
                serverUrl={serverUrl} token={token} setToken={setToken}
                maxWidth={appSettings.maxPanelWidth}
                />
              </Box>
              { notesOpen ? <Explorer
              handleToggleExplorer={handleToggleNotesOpen}
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
              serverUrl={serverUrl} token={token} setToken={setToken}
              /> : null}
        </Box>
        <StatusBar statusUpdates={statusUpdates}/>
      </Box>
    </ThemeProvider>
  </SystemProvider>
</BrowserRouter>

const loginRender = 
  <SystemProvider serverUrl={serverUrl} setStatusUpdates={setStatusUpdates}>
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
            <Login setUser={setUser} serverUrl={serverUrl} setToken={setToken}/>
          </Box>
          <StatusBar statusUpdates={statusUpdates}/>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  </SystemProvider>

  return user ? appRender : loginRender;
}

export default App;
