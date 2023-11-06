import { debounce } from "lodash";
import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { SystemContext } from './SystemContext';
import { Card, Toolbar, Tooltip, IconButton, Box, Paper, Tabs, Tab, TextField, Button, Typography,
    Stack, Switch } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { red } from '@mui/material/colors';
import AccountCreate from "./AccountCreate";
import AccountResetPassword from "./AccountResetPassword";
import AccountDelete from "./AccountDelete";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: red[500],
    gap: 2,
}));

const Admin = ({ adminOpen, setAdminOpen, user, setUser,
     onClose, serverUrl, token, setToken, userPermissions }) => {
    const system = useContext(SystemContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [reEnteredNewPassword, setReEnteredNewPassword] = useState('');
    const [confirmUser, setConfirmUserId] = useState('');
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);

    // System settings
    const [appSystemSettingsLoaded, setAppSystemSettingsLoaded] = useState(false);
    const [appSystemSettings, setAppSystemSettings] = useState({});
    const [loginSystemSettings, setLoginSystemSettings] = useState({});
    const [appSettingsSystemSettings, setAppSettingsSystemSettings] = useState({});
    const [loginSystemSettingsLoaded, setLoginSystemSettingsLoaded] = useState(false);
    const [appSettingsSystemSettingsLoaded, setAppSettingsSystemSettingsLoaded] = useState(false);
    const [chatSystemSettingsLoaded, setChatSystemSettingsLoaded] = useState(false);
    const [chatSystemSettings, setChatSystemSettings] = useState({});
    const [noteSystemSettingsLoaded, setNoteSystemSettingsLoaded] = useState(false);
    const [noteSystemSettings, setNoteSystemSettings] = useState({});

    // Functionality settings
    const [createAccountEnabled, setCreateAccountEnabled] = useState(false);
    const [changePasswordEnabled, setChangePasswordEnabled] = useState(false);
    const [deleteAccountEnabled, setDeleteAccountEnabled] = useState(false);
    
    // Custom text settings
    const [customTextChanged, setCustomTextChanged] = useState(false);
    // App custom text settings
    const [instanceName, setInstanceName] = useState('');
    const [instanceUsage, setInstanceUsage] = useState('');
    // Login custom text settings
    const [preLoginMessage, setPreLoginMessage] = useState('');
    // Chat custom text settings
    const [chatUserPromptReady, setChatUserPromptReady] = useState('');
    // Note custom text settings
    const [noteUserPromptReady, setNoteUserPromptReady] = useState('');

    const loadSystemSettings = () => {
        axios.get(`${serverUrl}/system_settings/app`).then(response => {
            setAppSystemSettings(response.data);
            console.log("App system settings:", response);
        }).catch(error => {
            console.error("Error getting App system settings:", error);
        });
        axios.get(`${serverUrl}/system_settings/login`).then(response => {
          setLoginSystemSettings(response.data);
          console.log("Login system settings:", response);
        }).catch(error => {
          console.error("Error getting Login system settings:", error);
        });
        axios.get(`${serverUrl}/system_settings/appsettings`).then(response => {
            setAppSettingsSystemSettings(response.data);
            console.log("AppSettings system settings:", response);
        }).catch(error => {
            console.error("Error getting AppSettings system settings:", error);
        });
        axios.get(`${serverUrl}/system_settings/chat`).then(response => {
            setChatSystemSettings(response.data);
            console.log("Chat system settings:", response);
        }).catch(error => {
            console.error("Error getting Chat system settings:", error);
        });
        axios.get(`${serverUrl}/system_settings/note`).then(response => {
            setNoteSystemSettings(response.data);
            console.log("Note system settings:", response);
        }).catch(error => {
            console.error("Error getting Note system settings:", error);
        });
    }
    
    const [width, setWidth] = useState(0);
    const handleResize = useCallback( 
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
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

    const inputContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '50px',
    };

    useEffect(() => {
        loadSystemSettings();
        console.log("AppSettings instantiated");
    }, []);

    useEffect(() => {
        if (!loginSystemSettingsLoaded && loginSystemSettings.functionality) {
            console.log("loginSystemSettings: ",loginSystemSettings);
            setLoginSystemSettingsLoaded(true);
            setCreateAccountEnabled(loginSystemSettings.functionality.createAccount);
            setPreLoginMessage(loginSystemSettings.preLogin.message);
        }
    }, [loginSystemSettings]);

    useEffect(() => {
        if (!appSettingsSystemSettingsLoaded && appSettingsSystemSettings.functionality) {
            setAppSettingsSystemSettingsLoaded(true);
            setDeleteAccountEnabled(appSettingsSystemSettings.functionality.deleteAccount);
            setChangePasswordEnabled(appSettingsSystemSettings.functionality.changePassword);
        }
    }, [appSettingsSystemSettings]);

    useEffect(() => {
        if (!chatSystemSettingsLoaded && chatSystemSettings.userPromptReady) {
            setChatSystemSettingsLoaded(true);
            setChatUserPromptReady(chatSystemSettings.userPromptReady);
        }
    }, [chatSystemSettings]);

    useEffect(() => {
        if (!noteSystemSettingsLoaded && noteSystemSettings.userPromptReady) {
            setNoteSystemSettingsLoaded(true);
            setNoteUserPromptReady(noteSystemSettings.userPromptReady);
        }
    }, [noteSystemSettings]);

    useEffect(() => {
        if (!appSystemSettingsLoaded) {
            setAppSystemSettingsLoaded(true);
            setInstanceName(appSystemSettings?.instanceName ? appSystemSettings.instanceName : '');
            setInstanceUsage(appSystemSettings?.instanceUsage ? appSystemSettings.instanceUsage : '');
        }
    }, [appSystemSettings]);

    useEffect(() => {
        if (tabIndex === 2) {
            setConfirmUserId('');
        }
    }, [tabIndex]);

    const saveAppSystemSettings = (newAppSystemSettings) => {
        axios.put(`${serverUrl}/system_settings/app`, newAppSystemSettings, {
            headers: {
                Authorization: 'Bearer ' + token
                }
        }).then(response => {
            console.log("appSystemSettings save response", response);
            response.data.access_token && setToken(response.data.access_token);
        }).catch(error => {
            console.error("appSystemSettings save error", error);
        });
    };

    const saveChatSystemSettings = (newChatSystemSettings) => {
        axios.put(`${serverUrl}/system_settings/chat`, newChatSystemSettings, {
            headers: {
                Authorization: 'Bearer ' + token
                }
        }).then(response => {
            console.log("chatSystemSettings save response", response);
            response.data.access_token && setToken(response.data.access_token);
        }).catch(error => {
            console.error("chatSystemSettings save error", error);
        });
    };

    const saveNoteSystemSettings = (newNoteSystemSettings) => {
        axios.put(`${serverUrl}/system_settings/note`, newNoteSystemSettings, {
            headers: {
                Authorization: 'Bearer ' + token
                }
        }).then(response => {
            console.log("noteSystemSettings save response", response);
            response.data.access_token && setToken(response.data.access_token);
        }).catch(error => {
            console.error("noteSystemSettings save error", error);
        });
    };

    const saveLoginSystemSettings = (newLoginSystemSettings) => {
        axios.put(`${serverUrl}/system_settings/login`, newLoginSystemSettings, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("loginSystemSettings save response", response);
            response.data.access_token && setToken(response.data.access_token);
        }).catch(error => {
            console.error("loginSystemSettings save error", error);
        });
    };

    const saveAppSettingsSystemSettings = (newAppSettingsSystemSettings) => {
        axios.put(`${serverUrl}/system_settings/appsettings`, appSettingsSystemSettings, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("appSettingsSystemSettings save response", response);
            response.data.access_token && setToken(response.data.access_token);
        }).catch(error => {
            console.error("appSettingsSystemSettings save error", error);
        });
    };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

    const handleToggleFunctionalityLoginCreateAccount = () => {
        let newCreateAccountEnabled = !createAccountEnabled;
        setCreateAccountEnabled(newCreateAccountEnabled);
        let newLoginSystemSettings = loginSystemSettings;
        if (!newLoginSystemSettings.functionality) {
            newLoginSystemSettings.functionality = {};
        }
        newLoginSystemSettings.functionality.createAccount = newCreateAccountEnabled;
        console.log("handleToggleFunctionalityLoginCreateAccount", newLoginSystemSettings);
        setLoginSystemSettings(newLoginSystemSettings);
        saveLoginSystemSettings(newLoginSystemSettings);
    };

    const handleToggleFunctionalityAppSettingsChangePassword = () => {
        let newChangePasswordEnabled = !changePasswordEnabled;
        setChangePasswordEnabled(newChangePasswordEnabled);
        let newAppSettingsSystemSettings = appSettingsSystemSettings;
        if (!newAppSettingsSystemSettings.functionality) {
            newAppSettingsSystemSettings.functionality = {};
        }
        newAppSettingsSystemSettings.functionality.changePassword = newChangePasswordEnabled;
        setAppSettingsSystemSettings(newAppSettingsSystemSettings);
        saveAppSettingsSystemSettings(newAppSettingsSystemSettings);
    };

    const handleToggleFunctionalityAppSettingsDeleteAccount = () => {
        let newDeleteAccountEnabled = !deleteAccountEnabled;
        setDeleteAccountEnabled(newDeleteAccountEnabled);
        let newAppSettingsSystemSettings = appSettingsSystemSettings;
        newAppSettingsSystemSettings.functionality.deleteAccount = newDeleteAccountEnabled;
        setAppSettingsSystemSettings(newAppSettingsSystemSettings);
        saveAppSettingsSystemSettings(newAppSettingsSystemSettings);
    };

    const handleSaveCustomTextChanges = () => {
        // app
        let newAppSystemSettings = appSystemSettings;
        newAppSystemSettings.instanceName = instanceName;
        newAppSystemSettings.instanceUsage = instanceUsage;
        setAppSystemSettings(newAppSystemSettings);
        saveAppSystemSettings(newAppSystemSettings);

        // login
        let newLoginSystemSettings = loginSystemSettings;
        newLoginSystemSettings.preLogin.message = preLoginMessage;
        setLoginSystemSettings(newLoginSystemSettings);
        saveLoginSystemSettings(newLoginSystemSettings);

        // chat
        let newChatSystemSettings = chatSystemSettings;
        newChatSystemSettings.userPromptReady = chatUserPromptReady;
        setChatSystemSettings(newChatSystemSettings);
        saveChatSystemSettings(newChatSystemSettings);

        // note
        let newNoteSystemSettings = noteSystemSettings;
        newNoteSystemSettings.userPromptReady = noteUserPromptReady;
        setNoteSystemSettings(newNoteSystemSettings);
        saveNoteSystemSettings(newNoteSystemSettings);
        setCustomTextChanged(false);
        system.info("Custom text changes saved.");
    }

    const handleCancelCustomTextChanges = () => {
        setPreLoginMessage(loginSystemSettings.preLogin.message);
        setInstanceName(appSystemSettings.instanceName);
        setInstanceUsage(appSystemSettings.instanceUsage);
        setChatUserPromptReady(chatSystemSettings.userPromptReady);
        setNoteUserPromptReady(noteSystemSettings.userPromptReady);
        setTabIndex(0);
    }

    const TAB_ABOUT = 0;
    const TAB_CUSTOM_TEXT = 1;
    const TAB_FUNCTIONALITY = 2;
    const TAB_CREATE_ACCOUNT = 3;
    const TAB_RESET_PASSWORD = 4;
    const TAB_DELETE_ACCOUNT = 5;

  const render = <Card sx={{display:"flex", flexDirection:"column", 
    padding:"6px", margin:"6px", flex:1, 
    minWidth: "600px", maxWidth: "800px"}}>
    
  <StyledToolbar className={ClassNames.toolbar}>
      <AdminPanelSettingsIcon/>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }} gap={2}>
          <Typography variant="h6">Sidekick Admin</Typography>
      </Box>
      <Box ml="auto">
          <IconButton onClick={() => setAdminOpen(false)}>
              <CloseIcon />
          </IconButton>
      </Box>
  </StyledToolbar>

    <Box sx={{ display: "flex", flexDirection: "row", height:"calc(100% - 64px)"}}>
        <Box sx={{ width: "200px" }}>
            <Tabs value={tabIndex} onChange={handleTabChange} orientation="vertical"
                sx={{  textAlign: "left" }}>
                <Tab label="About" />
                <Tab label="Custom text" />
                <Tab label="Functionality" />
                <Tab label="Create Account" />
                <Tab label="Reset Password" />
                <Tab label="Delete Account" />
            </Tabs>
        </Box>
        <Paper sx={{ display: "flex", flexDirection: "column", justifyContent: "top",
            flex: 1, margin: "6px", padding: "6px" }}>
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto" }}>
                {tabIndex === TAB_ABOUT && (
                <Typography margin={6}>The Sidekick Admin panel lets you change application wide settings across all users and perform admin tasks on individual user accounts.</Typography>
                )}
                {tabIndex === TAB_CUSTOM_TEXT && (
                    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }} style={inputContainerStyle} gap={2}>
                        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
                            <Typography variant="h6">Change custom text</Typography>
                            <Typography sx={{mt:1}}>You can edit the custom text below and then press the Save button to commit the changes. Once done, logout and in again to check the text renders as you want.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: "column", flex: 1, overflow: "auto", width: "100%" }}>

                            <Paper sx={{ display: "flex", flexDirection: "column", margin: 1, padding : "6px 20px" }}>
                            <Typography variant="h7" sx={{margin:2}}>Login</Typography>
                                <TextField
                                    id="custom-text-pre-login-message"
                                    label="Pre-Login message"
                                    multiline
                                    inputProps={{ maxLength: 200 }}
                                    sx={{ width: "100%" }}
                                    value = {preLoginMessage}
                                    onChange = {(e) => {setCustomTextChanged(true); setPreLoginMessage(e.target.value);}}
                                    />
                                    <Typography variant="caption" sx={{mb:1}}>(The pre-login message will appear benath the login form.)</Typography>
                            </Paper>

                            <Paper sx={{ display: "flex", flexDirection: "column", margin: 1, padding : "6px 20px" }}>
                            <Typography variant="h7" sx={{margin:2}}>App</Typography>
                                <TextField
                                    id="custom-text-instance-name"
                                    label="Instance name"
                                    inputProps={{ maxLength: 20 }}
                                    sx={{ width: "100%" }}
                                    value = {instanceName}
                                    onChange = {(e) => {setCustomTextChanged(true); setInstanceName(e.target.value);}}
                                    />
                                    <Typography variant="caption" sx={{mb:1}}>(The instance name will appear in the main App bar after the App version.)</Typography>
                                <TextField
                                    id="custom-text-instance-usage"
                                    label="Instance usage"
                                    inputProps={{ maxLength: 20 }}
                                    sx={{ width: "100%" }}
                                    value = {instanceUsage}
                                    onChange = {(e) => {setCustomTextChanged(true); setInstanceUsage(e.target.value);}}
                                    />
                                    <Typography variant="caption" sx={{mb:1}}>(The usage will appear in the main App bar after the instance name.)</Typography>
                            </Paper>

                            <Paper sx={{ display: "flex", flexDirection: "column", margin: 1, padding : "6px 20px" }}>
                            <Typography variant="h7" sx={{margin:2}}>Chat</Typography>
                                <TextField
                                    id="custom-text-chat-user-prompt-ready"
                                    multiline
                                    label="Chat prompt label"
                                    inputProps={{ maxLength: 200 }}
                                    sx={{ width: "100%" }}
                                    value = {chatUserPromptReady}
                                    onChange = {(e) => {setCustomTextChanged(true); setChatUserPromptReady(e.target.value);}}
                                    />
                                    <Typography variant="caption" sx={{mb:1}}>(The chat prompt label will appear in brackets after the Chat prompt)</Typography>
                            </Paper>

                            <Paper sx={{ display: "flex", flexDirection: "column", margin: 1, padding : "6px 20px" }}>
                            <Typography variant="h7" sx={{margin:2}}>Note</Typography>
                                <TextField
                                    id="custom-text-note-user-prompt-ready"
                                    multiline
                                    label="Note Writer prompt label"
                                    inputProps={{ maxLength: 200 }}
                                    sx={{ width: "100%" }}
                                    value = {noteUserPromptReady}
                                    onChange = {(e) => {setCustomTextChanged(true); setNoteUserPromptReady(e.target.value);}}
                                    />
                                    <Typography variant="caption" sx={{mb:1}}>(The note prompt label will appear in brackets after the Note prompt)</Typography>
                            </Paper>

                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button type="button" onClick={handleSaveCustomTextChanges} sx={{ mr: 1 }} disabled={!customTextChanged}>Save</Button>
                                <Button type="button" onClick={handleCancelCustomTextChanges}>Cancel</Button>
                            </Box>

                        </Box>
                    </Box>
                )}
                {tabIndex === TAB_FUNCTIONALITY && (
                    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }} style={inputContainerStyle} gap={2}>
                        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
                            <Typography variant="h6">Enable or disable app-wide functionality</Typography>
                            <Typography variant="h7">User Account Functions</Typography>
                            <Typography margin={2}>Change which functions are visible to users by toggling the switches below. Functional changes will appear next time a user logs in.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: "column", flex: 1, overflow: "auto" }}>
                        
                            <Paper sx={{ display: "flex", margin: 1, padding : "6px 20px" }}>
                                <Box sx={{ display: 'flex', flexDirection: "column" }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography variant="h7">Create Account</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Switch
                                            checked={createAccountEnabled}
                                            onChange={handleToggleFunctionalityLoginCreateAccount}
                                            name="loginCreateAccountEnabled"
                                            inputProps={{ 'aria-label': 'Toggle enable create account' }}
                                            />
                                            <Typography>{createAccountEnabled ? "On" : "Off"}</Typography>
                                        </Box>
                                    </Stack>
                                    <Typography variant="caption">
                                        Enabling Create Account will provide a tab on the Login screen that will enable anyone with access to that screen to create an account with a username and password of their choice. Disable this if you want to use an alternative account creation method such as via a Single Sign-On provider.
                                    </Typography>
                                </Box>
                            </Paper>

                            <Paper sx={{ display: "flex",  margin: 1, padding : "6px 20px" }}>
                                <Box sx={{ display: 'flex', flexDirection: "column" }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography variant="h7">Change Password</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Switch
                                            checked={changePasswordEnabled}
                                            onChange={handleToggleFunctionalityAppSettingsChangePassword}
                                            name="appSettingsChangePasswordEnabled"
                                            inputProps={{ 'aria-label': 'Toggle enable change password' }}
                                            />
                                            <Typography>{changePasswordEnabled ? "On" : "Off"}</Typography>
                                        </Box>
                                    </Stack>
                                    <Typography variant="caption">
                                        Enable Change Password if you are using Sidekick's built-in authentication. Disabling Change Password will remove the Change Password tab from the Settings screen. Disable this if you want to use an alternative password change method such as via a Single Sign-On provider.
                                    </Typography>
                                </Box>
                            </Paper>

                            <Paper sx={{ display: "flex",  margin: 1, padding : "6px 20px" }}>
                                <Box sx={{ display: 'flex', flexDirection: "column" }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography variant="h7">Delete Account</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Switch
                                            checked={deleteAccountEnabled}
                                            onChange={handleToggleFunctionalityAppSettingsDeleteAccount}
                                            name="appSettingsDeleteAccountEnabled"
                                            inputProps={{ 'aria-label': 'Toggle enable delete account' }}
                                            />
                                            <Typography>{deleteAccountEnabled ? "On" : "Off"}</Typography>
                                        </Box>
                                    </Stack>
                                    <Typography variant="caption">
                                        Enabling Delete Account will provide a tab on the Settings screen that will enable users to delete their account and remove all their data from the database. Disable this if you want to use an alternative account deletion method such as via a Single Sign-On provider, or want to safeguard the data.
                                    </Typography>
                                </Box>
                            </Paper>

                        </Box>
                    </Box>
                )}
                {tabIndex === TAB_CREATE_ACCOUNT && (

                <Box style={inputContainerStyle} gap={2}>
                    <Typography variant="h6">Create a new user account</Typography>
                    <Typography margin={4}>Enter the username and password below to create the account, then provide these to the user in a secure way.</Typography>
                    <AccountCreate serverUrl={serverUrl} />
                </Box>
                )}
                {tabIndex === TAB_RESET_PASSWORD && (
                    <Box style={inputContainerStyle} gap={2}>
                    <Typography variant="h6">Reset password for user</Typography>
                    <Typography margin={4}>Enter the username and new password below to reset their password, then provide these to the user in a secure way.</Typography>
                    <AccountResetPassword serverUrl={serverUrl} token={token} setToken={setToken}/>
                    </Box>

                )}
                {tabIndex === TAB_DELETE_ACCOUNT && (
                <Box style={inputContainerStyle} gap={2}>
                    <AccountDelete
                        warningMessage = {<Typography>Warning: This will delete the user's account and all their data.<br/><br/>Make sure they have copies of anything they need before proceeding.</Typography>}
                        serverUrl={serverUrl} token={token} setToken={setToken}
                        onCancel={() => {setTabIndex(0);}}
                    />
                </Box>
                )}
            </Box>
        </Paper>
    </Box>
  </Card>;

  return render;
};

export default Admin;