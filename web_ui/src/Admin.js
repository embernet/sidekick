import { debounce } from "lodash";
import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { SystemContext } from './SystemContext';
import { Card, Toolbar, Tooltip, IconButton, Box, Paper, Tabs, Tab, TextField, Button, Typography,
    Stack, FormGroup, FormControl, FormLabel, FormControlLabel, Switch } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { red } from '@mui/material/colors';
import { use } from "marked";

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
    const [systemSettings, setSystemSettings] = useState({});
    const [loginSystemSettings, setLoginSystemSettings] = useState({});
    const [appSettingsSystemSettings, setAppSettingsSystemSettings] = useState({});
    const [loginSystemSettingsLoaded, setLoginSystemSettingsLoaded] = useState(false);
    const [appSettingsSystemSettingsLoaded, setAppSettingsSystemSettingsLoaded] = useState(false);
    const [createAccountEnabled, setCreateAccountEnabled] = useState(false);
    const [deleteAccountEnabled, setDeleteAccountEnabled] = useState(false);
    
    const loadSystemSettings = () => {
        axios.get(`${serverUrl}/custom_settings/login`).then(response => {
          setLoginSystemSettings(response.data);
          console.log("Login system settings:", response);
        }).catch(error => {
          console.error("Error getting Login system settings:", error);
        });
        axios.get(`${serverUrl}/custom_settings/appsettings`).then(response => {
            setAppSettingsSystemSettings(response.data);
            console.log("AppSettings system settings:", response);
        }).catch(error => {
            console.error("Error getting AppSettings system settings:", error);
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

    const inputStyle = {
        margin: '10px',
        padding: '5px',
    };

    useEffect(() => {
        loadSystemSettings();
        console.log("AppSettings instantiated");
    }, []);

    useEffect(() => {
        if (!loginSystemSettingsLoaded && loginSystemSettings.functionality) {
            console.log(`loginSystemSettings: ${loginSystemSettings}`);
            setLoginSystemSettingsLoaded(true);
            setCreateAccountEnabled(loginSystemSettings.functionality.createAccount);
        } else {
            axios.put(`${serverUrl}/custom_settings/login`, appSettingsSystemSettings, {
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(response => {
                console.log("loginSystemSettings save response", response);
                response.data.access_token && setToken(response.data.access_token);
            }).catch(error => {
                console.error("loginSystemSettings save error", error);
            });
        }
    }, [loginSystemSettings]);

    useEffect(() => {
        if (!appSettingsSystemSettingsLoaded && appSettingsSystemSettings.functionality) {
            setAppSettingsSystemSettingsLoaded(true);
            setDeleteAccountEnabled(appSettingsSystemSettings.functionality.deleteAccount);
        } else {
            axios.put(`${serverUrl}/custom_settings/appsettings`, appSettingsSystemSettings, {
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(response => {
                console.log("appSettingsSystemSettings save response", response);
                response.data.access_token && setToken(response.data.access_token);
            }).catch(error => {
                console.error("appSettingsSystemSettings save error", error);
            });
        }
    }, [appSettingsSystemSettings]);

    useEffect(() => {
        if (tabIndex === 2) {
            setConfirmUserId('');
        }
    }, [tabIndex]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleCurrentPasswordChange = (event) => {
    setCurrentPassword(event.target.value);
  };

  const handleNewPasswordChange = (event) => {
    setNewPassword(event.target.value);
  };

  const handleReEnteredNewPasswordChange = (event) => {
    setReEnteredNewPassword(event.target.value);
  };

  const handleConfirmNameChange = (event) => {
    setConfirmUserId(event.target.value);
  };

  const handleCancelChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setReEnteredNewPassword('');
    setConfirmUserId('');
    setTabIndex(0);
  };

  const handleChangePassword = async () => {
    if (newPassword !== reEnteredNewPassword) {
        system.error('New passwords do not match!');
        return;
    }
    axios.post(`${serverUrl}/change_password`,
        {
            "user_id": user,
            "current_password": currentPassword,
            "new_password": newPassword
        },
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            setCurrentPassword('');
            setNewPassword('');
            console.log("handleChangePassword response: ", response);
            response.data.access_token && setToken(response.data.access_token);
            if (response.data.success) {
                system.info('Password changed successfully!');
            } else {
                system.error(`Failed to change password: ${response.data.message}`);
            }
        }).catch(error => {
            setCurrentPassword('');
            setNewPassword('');
            console.error(error);
            system.error(`An error occurred while changing password: ${error}`);
        }
    );
  };

    const handleSaveSystemSettings = () => {
        system.info('System settings saved successfully');
    }

  const handleDeleteAccount = () => {
    if (user !== confirmUser) {
        system.error('Userid does not match!');
        return;
    }
    axios.post(`${serverUrl}/delete_user`,
        {
            "user_id": user,
            "password": currentPassword
        },
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            setCurrentPassword('');
            console.log("handleChangePassword response: ", response);
            response.data.access_token && setToken(response.data.access_token);
            if (response.data.success) {
                system.info('Account deleted successfully. Logging out...');
                setUser('')
            } else {
                system.error(`Failed to delete account: ${response.data.message}`);
            }
        }).catch(error => {
            setCurrentPassword('');
            console.error(error);
            system.error(`An error occurred while deleting the account: ${error}`);
        }
    );
  };

    const handleToggleFunctionalityLoginCreateAccount = () => {
        let newCreateAccountEnabled = !createAccountEnabled;
        setCreateAccountEnabled(newCreateAccountEnabled);
        let newLoginSystemSettings = loginSystemSettings;
        newLoginSystemSettings.functionality.createAccount = newCreateAccountEnabled;
        setLoginSystemSettings(newLoginSystemSettings);
    };

    const handleToggleFunctionalityAppSettingsDeleteAccount = () => {
        let newAppSettingsSystemSettings = appSettingsSystemSettings;
        newAppSettingsSystemSettings.functionality.deleteAccount = !newAppSettingsSystemSettings.functionality.deleteAccount;
        console.log(newAppSettingsSystemSettings)
        setAppSettingsSystemSettings(newAppSettingsSystemSettings);
    };

    const handleToggleFunctionalityAppSettingsChangePassword = () => {
        let newAppSettingsSystemSettings = appSettingsSystemSettings;
        newAppSettingsSystemSettings.functionality.changePassword = !newAppSettingsSystemSettings.functionality.changePassword;
        console.log(newAppSettingsSystemSettings)
        setAppSettingsSystemSettings(newAppSettingsSystemSettings);
    };

  const render = <Card sx={{display:"flex", flexDirection:"column", 
    padding:"6px", margin:"6px", flex:1, 
    width: "800px", minWidth: "600px", maxWidth: "800px"}}>
    
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

  <Box sx={{ height: "100%" }}>
    <Box sx={{ display: "flex", flexDirection: "row", height: "100%"}}>
          <Box sx={{ width: "200px" }}>
                <Tabs value={tabIndex} onChange={handleTabChange} orientation="vertical"
                    sx={{  textAlign: "left" }}>
                    <Tab label="About" />
                    <Tab label="Functionality" />
                    <Tab label="Create Account" />
                    <Tab label="Reset Password" />
                    <Tab label="Disable Account" />
                    <Tab label="Enable Account" />
                    <Tab label="Delete Account" />
                    <Tab label="System Settings" />
                </Tabs>
          </Box>
          <Paper sx={{ flexDirection: "column", justifyContent: "top",
              height: "100%", margin: "6px", padding: "6px", flex: 1}}>
              {tabIndex === 0 && (
                  <Box style={inputContainerStyle} component="form" gap={2}>
                      <Typography margin={6}>The Sidekick Admin panel lets you change application wide settings across all users.</Typography>
                  </Box>
              )}
              {tabIndex === 1 && (
                    <Box style={inputContainerStyle} component="form" gap={2}>
                        <Typography variant="h6">Enable or disable app-wide functionality</Typography>
                        <Typography variant="h7">Account</Typography>
                        
                        <Paper sx={{ margin: 1, padding : "6px 20px" }}>
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
                                        <Typography>{loginSystemSettings.functionality.createAccount ? "On" : "Off"}</Typography>
                                    </Box>
                                </Stack>
                                <Typography variant="caption">
                                    Enabling Create Account will provide a tab on the Login screen that will enable anyone with access to that screen to create an account with a username and password of their choice. Disable this if you want to use an alternative account creation method such as via a Single Sign-On provider.
                                </Typography>
                            </Box>
                        </Paper>

                        <Paper sx={{ margin: 1, padding : "6px 20px" }}>
                            <Box sx={{ display: 'flex', flexDirection: "column" }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="h7">Delete Account</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Switch
                                        checked={appSettingsSystemSettings.functionality.deleteAccount}
                                        onChange={handleToggleFunctionalityAppSettingsDeleteAccount}
                                        name="appSettingsDeleteAccountEnabled"
                                        inputProps={{ 'aria-label': 'Toggle enable delete account' }}
                                        />
                                        <Typography>{appSettingsSystemSettings.functionality.deleteAccount ? "On" : "Off"}</Typography>
                                    </Box>
                                </Stack>
                                <Typography variant="caption">
                                    Enabling Delete Account will provide a tab on the Settings screen that will enable users to delete their account and remove all their data from the database. Disable this if you want to use an alternative account deletion method such as via a Single Sign-On provider, or want to safeguard the data.
                                </Typography>
                            </Box>
                        </Paper>

                        <Paper sx={{ margin: 1, padding : "6px 20px" }}>
                            <Box sx={{ display: 'flex', flexDirection: "column" }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="h7">Change Password</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Switch
                                        checked={appSettingsSystemSettings.functionality.changePassword}
                                        onChange={handleToggleFunctionalityAppSettingsChangePassword}
                                        name="appSettingsChangePasswordEnabled"
                                        inputProps={{ 'aria-label': 'Toggle enable change password' }}
                                        />
                                        <Typography>{appSettingsSystemSettings.functionality.changePassword ? "On" : "Off"}</Typography>
                                    </Box>
                                </Stack>
                                <Typography variant="caption">
                                    Enable Change Password if you are using Sidekick's built-in authentication. Disabling Change Password will remove the Change Password tab from the Settings screen. Disable this if you want to use an alternative password change method such as via a Single Sign-On provider.
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
              )}
              {tabIndex === 2 && (
                  <Box style={inputContainerStyle} component="form" gap={2}>
                      <Typography margin={6}>Warning: This will delete your account and your database with all your chats and notes.
                      <br/><br/>Make sure you have copies of anything you need before proceeding.</Typography>
                      <TextField type="password" label="Current Password" value={currentPassword} 
                          autoComplete="off" onChange={handleCurrentPasswordChange} 
                          sx={{ width: "300px" }} /* disable autoComplete of password for deleting accounts *//>
                      <TextField label="Type your userid to confirm" value={confirmUser} autoComplete="off"
                          onChange={handleConfirmNameChange}
                          sx={{ width: "300px" }} />
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <Button type="button" onClick={handleDeleteAccount} sx={{ mr: 1 }}>Delete</Button>
                          <Button type="button" onClick={handleCancelChangePassword}>Cancel</Button>
                      </Box>
                  </Box>
              )}
              {tabIndex === 3 && (
                  <Box style={inputContainerStyle} component="form" gap={2}>
                      <Typography margin={6}>System settings change the behaviour of this Sidekick deployment instance and apply to all users of this system.</Typography>
                      <TextField label="Chat 'Enter prompt...' label"
                          sx={{ width: "300px" }} />
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <Button type="button" onClick={handleSaveSystemSettings} sx={{ mr: 1 }}>Save</Button>
                          <Button type="button" onClick={handleCancelChangePassword}>Cancel</Button>
                      </Box>
                  </Box>

              )}
          </Paper>
      </Box>
    </Box>
  </Card>;

  return render;
};

export default Admin;
