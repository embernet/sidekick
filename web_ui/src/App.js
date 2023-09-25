// File: App.js
// Author: Mark Burnett
// Date: 2022-09-23
// Description: An AI powered tool for creativity, thinking, exploring ideas, problem-solving, knowledge-building,
// and getting things done

import './App.css';
import axios from 'axios';
import { SystemProvider } from './SystemContext';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import useToken from './useToken';
import { useEffect, useState } from 'react';
import { CssBaseline, Box, AppBar, Toolbar, IconButton, Typography, Tooltip } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Import icons
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ModeCommentIcon from '@mui/icons-material/ModeComment';
import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import MinimizeIcon from '@mui/icons-material/Minimize';
import FolderIcon from '@mui/icons-material/Folder';
import LogoutIcon from '@mui/icons-material/Logout';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HelpIcon from '@mui/icons-material/Help';

import Chat from './Chat';
import Personas from './Personas';
import ModelSettings from './ModelSettings';
import PromptComposer from './PromptComposer';
import Note from './Note';
import Explorer from './Explorer';
import SettingsManager from './SettingsManager';
import Login from './Login';
import FeedbackButton from './FeedbackButton';
import AppSettings from './AppSettings';
import SidekickAI from './SidekickAI';

import { theme } from './theme';

import { runtimeEnvironment } from './ServerUrlThunk';
import { Toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VERSION = "0.0.4";

function App() {
  const system = useContext(SystemContext);
  const { token, removeToken, setToken } = useToken();
  const chatsOpenDefault = true;
  const chatOpenDefault = true;
  const notesOpenDefault = false;
  const noteOpenDefault = false;
  const personasOpenDefault = false;
  const modelSettingsOpenDefault = false;
  const promptComposerOpenDefault = false;
  const appSettingsOpenDefault = false;
  const sidekickAIOpenDefault = false;
  const [sidekickAIOpen, setSidekickAIOpen] = useState(sidekickAIOpenDefault);
  const [chatOpen, setChatOpen] = useState(chatOpenDefault);
  const [appSettingsOpen, setAppSettingsOpen] = useState(appSettingsOpenDefault);
  const [chatsOpen, setChatsOpen] = useState(chatsOpenDefault);
  const [personasOpen, setPersonasOpen] = useState(personasOpenDefault);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(modelSettingsOpenDefault);
  const [promptComposerOpen, setPromptComposerOpen] = useState(promptComposerOpenDefault);
  const [createNote, setCreateNote] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(notesOpenDefault);
  const [provider, setProvider] = useState(null);
  const [modelSettings, setModelSettings] = useState({});
  const [persona, setPersona] = useState({});
  const [newPromptPart, setNewPromptPart] = useState({});
  const [loadChat, setLoadChat] = useState("");
  const [refreshChatsExplorer, setRefreshChatsExplorer] = useState(false);
  const [appendNoteContent, setAppendNoteContent] = useState("");
  const [chatNameChanged, setChatNameChanged] = useState("");
  const [noteNameChanged, setNoteNameChanged] = useState("");
  const [loadNote, setLoadNote] = useState("");
  const [focusOnPrompt, setFocusOnPrompt] = useState(false);
  const [chatRequest, setChatRequest] = useState("");
  const [refreshNotesExplorer, setRefreshNotesExplorer] = useState(false);
  const [temperatureText, setTemperatureText] = useState('');
  const [user, setUser] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);
  const [openNoteId, setOpenNoteId] = useState(null);
  const [serverUrl, setServerUrl] = useState(runtimeEnvironment.serverHost + ":" + runtimeEnvironment.serverPort);
  const [shouldAskAgainWithPersona, setShouldAskAgainWithPersona] = useState(null);
  const [streamingChatResponse, setStreamingChatResponse] = useState("");
  const [chatStreamingOn, setChatStreamingOn] = useState(true);

  useEffect(() => {
    setChatOpen(chatOpenDefault);
    setAppSettingsOpen(appSettingsOpenDefault);
    setChatsOpen(chatsOpenDefault);
    setPersonasOpen(personasOpenDefault);
    setModelSettingsOpen(modelSettingsOpenDefault);
    setPromptComposerOpen(promptComposerOpenDefault);
    setNoteOpen(noteOpenDefault);
    setNotesOpen(notesOpenDefault);
    setSidekickAIOpen(sidekickAIOpenDefault);
  }, [user]);

  useEffect(()=>{
  }, [loadChat]);

  useEffect(()=>{
    if (!noteOpen) {
      if (appendNoteContent && appendNoteContent !== "") {
        setCreateNote(Date.now());
      }
    }
  }, [appendNoteContent]);

  const handleToggleAppSettings = () => {
    const newState = !appSettingsOpen;
    setAppSettingsOpen(newState);
  }

  const handleLogout = () => {
    axios({
      method: "POST",
      url:`${serverUrl}/logout`,
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    .then((response) => {
        removeToken();
    }).catch((error) => {
      if (error.response) {
        console.log(error.response)
        console.log(error.response.status)
        console.log(error.response.headers)
        }
    })
    setUser(null);
  }

  const handleToggleChats = () => {
    let newState = !chatsOpen
    setChatsOpen(newState);
  }

  const handleTogglePromptComposer = () => {
    let newState = !promptComposerOpen
    setPromptComposerOpen(newState);
  }

  const handleTogglePersonas = () => {
    let newState = !personasOpen
    setPersonasOpen(newState);
  }

  const handleCreateNote = () => {
    setCreateNote(Date.now());
    setNoteOpen(Date.now());
  }

  const handleToggleNotes = () => {
    let newState = !notesOpen
    setNotesOpen(newState);
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
    } else {
      setRefreshChatsExplorer(change);
    }
  }

  const minimiseWindows = () => {
    setChatOpen(false);
    setAppSettingsOpen(false);
    setChatsOpen(false);
    setPromptComposerOpen(false);
    setModelSettingsOpen(false);
    setPersonasOpen(false);
    setCreateNote(false);
    setNotesOpen(false);
    setNoteOpen(false);
    setSidekickAIOpen(false);
  }

  // Provide a generic onChange despatcher for the chat and note components
  const onChange = (xOnChange) => { 
    return (id, name, reason, detail) => {
      xOnChange({"id": id, "name": name, "reason": reason, "detail": detail, timestamp: Date.now()});
    }
  }

  const appRender =
  <SystemProvider>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{display:"flex", height:"100vh", flexDirection:"column", overflow:"hidden"}}>
          <AppBar position="sticky">
            <Toolbar>
              <Box display="flex" gap={2}>
                <Typography sx={{ display: "flex", alignItems: "center", justifyContent: "center" }} variant="h6">Sidekick</Typography>
                <Typography sx={{ mr: 2, display: "inline-flex", alignItems: "center", justifyContent: "center" }} variant='subtitle2'>v{VERSION}</Typography>
                <Typography sx={{ mr: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>({user})</Typography>
                <Tooltip title="Sidekick AI help">
                  <IconButton edge="start" color="inherit" aria-label="Sidekick AI help" onClick={() => { setSidekickAIOpen(true) }}>
                    <HelpIcon/>
                  </IconButton>                  
                </Tooltip>
                <Tooltip title={ chatsOpen ? "Hide chat history" : "Show chat history" }>
                  <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleToggleChats}>
                    <QuestionAnswerIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={ modelSettingsOpen ? "Hide model settings" : "Show model settings" }>
                  <IconButton edge="start" color="inherit" aria-label="Model settings" onClick={() => { setModelSettingsOpen(!modelSettingsOpen) }}>
                    <TuneIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={ personasOpen ? "Hide AI personas" : "Show AI persons" }>
                  <IconButton edge="start" color="inherit" aria-label="Personas" onClick={handleTogglePersonas}>
                    <PersonIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={ promptComposerOpen ? "Hide prompt composer" : "Show prompt composer" }>
                  <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleTogglePromptComposer}>
                    <BuildIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title="New chat">
                  <IconButton edge="start" color="inherit" aria-label={ chatOpen ? "Close Chat" : "New chat" } onClick={() => { setChatOpen(!chatOpen) }}>
                    <ModeCommentIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Minimise windows">
                  <IconButton edge="start" color="inherit" aria-label="Minimise windows" onClick={minimiseWindows}>
                    <MinimizeIcon/>
                  </IconButton>
                </Tooltip>
              </Box>
              <Box display="flex" ml="auto" gap={2}>
                <Tooltip title="New note">
                  <IconButton edge="end" color="inherit" aria-label="New note" onClick={handleCreateNote}>
                    <PlaylistAddIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={ notesOpen ? "Hide Notes" : "Show Notes" }>
                  <IconButton edge="end" color="inherit" aria-label="Hide/Show notes" onClick={handleToggleNotes}>
                    <FolderIcon/>
                  </IconButton>
                </Tooltip>
                <FeedbackButton icon={<RateReviewIcon/>} serverUrl={serverUrl} token={token} setToken={setToken}>
                    <RateReviewIcon/>
                </FeedbackButton>
                <Tooltip title={ appSettingsOpen ? "Hide App Settings" : "Show App Setings" }>
                  <IconButton edge="end" color="inherit" aria-label="Settings" onClick={handleToggleAppSettings}>
                    <SettingsIcon/>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Logout">
                  <IconButton edge="end" color="inherit" aria-label="Logout" onClick={handleLogout}>
                    <LogoutIcon/>
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>
          <Box display="flex" flexDirection="row" flex="1" overflow-y="hidden" overflow="auto" width="100%">
            <ToastContainer/>
            <AppSettings 
              appSettingsOpen={appSettingsOpen}
              setAppSettingsOpen={setAppSettingsOpen}
              user={user}
              setUser={setUser}
              serverUrl={serverUrl} token={token} setToken={setToken}
            />
            <SidekickAI
              sidekickAIOpen={sidekickAIOpen}
              setSidekickAIOpen={setSidekickAIOpen}
              chatStreamingOn={chatStreamingOn} 
              serverUrl={serverUrl} token={token} setToken={setToken}
            />
            { chatsOpen ? <Explorer
            handleToggleExplorer={handleToggleChats}
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
            serverUrl={serverUrl} token={token} setToken={setToken}
            /> : null}
            <ModelSettings 
            setModelSettings={setModelSettings}
            setFocusOnPrompt={setFocusOnPrompt}
            modelSettingsOpen={modelSettingsOpen}
            setModelSettingsOpen={setModelSettingsOpen}
            temperatureText={temperatureText}
            setTemperatureText={setTemperatureText}
            settingsManager={new SettingsManager(serverUrl, token, setToken)}
            serverUrl={serverUrl} token={token} setToken={setToken}
            chatStreamingOn={chatStreamingOn}
            setChatStreamingOn={setChatStreamingOn}
            />
            <Personas 
            handleTogglePersonas={handleTogglePersonas} 
            persona={persona} 
            setPersona={setPersona}
            setFocusOnPrompt={setFocusOnPrompt}
            personasOpen={personasOpen}
            settingsManager={new SettingsManager(serverUrl, token, setToken)}
            setShouldAskAgainWithPersona={setShouldAskAgainWithPersona}
            serverUrl={serverUrl} token={token} setToken={setToken}
            streamingChatResponse={streamingChatResponse}
            />
            { promptComposerOpen ? <PromptComposer 
              handleTogglePromptComposer={handleTogglePromptComposer} 
              setNewPromptPart={setNewPromptPart}
              settingsManager={new SettingsManager(serverUrl, token, setToken)}
              serverUrl={serverUrl} token={token} setToken={setToken}
              /> : null }
            <Chat 
              provider = {provider}
              modelSettings={modelSettings} 
              persona={persona} 
              newPromptPart={newPromptPart} 
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
              setModelSettingsOpen={setModelSettingsOpen}
              personasOpen={personasOpen}
              setPersonasOpen={setPersonasOpen}
              onChange={onChange(handleChatChange)}
              setOpenChatId={setOpenChatId}
              shouldAskAgainWithPersona={shouldAskAgainWithPersona}
              serverUrl={serverUrl} token={token} setToken={setToken}
              streamingChatResponse={streamingChatResponse}
              setStreamingChatResponse={setStreamingChatResponse}
              chatStreamingOn={chatStreamingOn}
              />
            <Note 
              noteOpen={noteOpen}
              setNoteOpen={setNoteOpen} 
              appendNoteContent={appendNoteContent} 
              loadNote={loadNote} 
              createNote={createNote}
              setNewPromptPart={setNewPromptPart}
              setChatRequest={setChatRequest}
              onChange={onChange(handleNoteChange)}
              setOpenNoteId={setOpenNoteId}
              serverUrl={serverUrl} token={token} setToken={setToken}
              />
              { notesOpen ? <Explorer
              handleToggleExplorer={handleToggleNotes}
              name="Notes"
              icon={<FolderIcon />}
              folder="notes"
              openItemId={openNoteId}
              setLoadDoc={setLoadNote}
              docNameChanged={noteNameChanged}
              refresh={refreshNotesExplorer}
              setRefresh={setRefreshNotesExplorer}
              itemOpen={noteOpen} // tell the explorer which note is open
              setItemOpen={setNoteOpen}
              serverUrl={serverUrl} token={token} setToken={setToken}
              /> : null}
        </Box>
      </Box>
    </ThemeProvider>
  </BrowserRouter>
</SystemProvider>

const loginRender = 
  <SystemProvider>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{display:"flex", height:"100vh", flexDirection:"column", overflow:"hidden"}}>
          <AppBar position="sticky">
            <Toolbar>
              <Box display="flex" gap={2}>
                <Typography sx={{ mr: 2, display: "flex", alignItems: "center", justifyContent: "center" }} variant="h6">Sidekick</Typography>
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{display:"flex", flexDirection:"row", flex:"1",
          overflowY:"hidden", overflow:"auto", width:"100%",
          justifyContent:"center", alignItems:"center"}}>
            <ToastContainer/>
            <Login setUser={setUser} serverUrl={serverUrl} setToken={setToken}/>
          </Box>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  </SystemProvider>

  return user ? appRender : loginRender;
}

export default App;
