import { debounce } from "lodash";
import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { SystemContext } from './SystemContext';
import { Card, Toolbar, IconButton, Box, Paper, Tabs, Tab, TextField, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { lightBlue } from '@mui/material/colors';
import AccountDelete from "./AccountDelete";

const AppSettings = ({ appSettingsOpen, setAppSettingsOpen, user, setUser,
     onClose, serverUrl, token, setToken, darkMode, isMobile }) => {

    const panelWindowRef = useRef(null);

    const StyledToolbar = styled(Toolbar)(({ theme }) => ({
        backgroundColor: darkMode ? lightBlue[800] : lightBlue[200],
        marginRight: theme.spacing(2),
    }));
    
    const system = useContext(SystemContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [reEnteredNewPassword, setReEnteredNewPassword] = useState('');
    const [confirmUser, setConfirmUserId] = useState('');
    const [tabIndex, setTabIndex] = useState(0);
    const [appSettingsSystemSettings, setAppSettingsSystemSettings] = useState({});

    const [width, setWidth] = useState(0);

    const loadSystemSettings = () => {
        axios.get(`${serverUrl}/system_settings/appsettings`).then(response => {
            setAppSettingsSystemSettings(response.data);
            console.log("AppSettings system settings:", response);
        }).catch(error => {
            console.error("Error getting AppSettings system settings:", error);
        });
    }

    const handleResize = useCallback( 
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`app-settings-panel`);
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
        if (isMobile) {
            panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }
}, [appSettingsOpen]);

    useEffect(() => {
        // onOpen
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

  const resetChangePasswordFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setReEnteredNewPassword('');
  };

  const handleCancelPasswordChange = () => {
    resetChangePasswordFields();
    setTabIndex(0);
  };

  const handleCancelDeleteAccount = () => {
    setTabIndex(0);
  }

  const handleChangePassword = async () => {
    if (newPassword !== reEnteredNewPassword) {
        system.error('Failed to change passwords: New passwords do not match.');
        resetChangePasswordFields();
        return;
    }
    axios.post(`${serverUrl}/change_password`,
        {
            "user_id": user?.id,
            "current_password": currentPassword,
            "new_password": newPassword
        },
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            resetChangePasswordFields();
            console.log("handleChangePassword response: ", response);
            response.data.access_token && setToken(response.data.access_token);
            if (response.data.success) {
                system.info('Password changed successfully.');
            } else {
                system.error(`Error changing password.`, response.data.message);
            }
        }).catch(error => {
            resetChangePasswordFields();
            system.error("System Error changing password.", error);
        }
    );
  };

  const render = <Card id="app-settings-panel" ref={panelWindowRef}
    sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1,
    width: isMobile ? `${window.innerWidth}px` : null,
    minWidth: isMobile ? `${window.innerWidth}px` : "600px",
    maxWidth: isMobile ? `${window.innerWidth}px` : "600px"
    }}
    >
    
  <StyledToolbar sx={{width:"100%"}} className={ClassNames.toolbar}>
    <IconButton edge="start" color="inherit" aria-label="Settings">
        <SettingsIcon/>
    </IconButton>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }} gap={2}>
          <Typography>Settings</Typography>
      </Box>
      <Box ml="auto">
          <IconButton onClick={() => setAppSettingsOpen(false)}>
              <CloseIcon />
          </IconButton>
      </Box>
  </StyledToolbar>
  <Box>
      <TextField label="User" disabled sx={{ width: "100%", mt: 2, mb: 2 }}
      value={user?.name ? user?.name : user?.id} />
  </Box>

  <Box sx={{ height: "100%", width: "100%" }}>
    <Box sx={{ display: "flex", flexDirection: "row", height: "100%"}}>
          <Box sx={{ width: isMobile ? "115px" : "200px" }}>
              <Tabs value={tabIndex} onChange={handleTabChange} orientation="vertical"
                  sx={{  textAlign: "left" }}>
                  <Tab label="About" />
                  {appSettingsSystemSettings?.functionality?.changePassword &&
                  !user?.is_oidc ? <Tab label="Change Password" /> : null}
                  {appSettingsSystemSettings?.functionality?.deleteAccount &&
                  !user?.is_oidc ? <Tab label="Delete Account" /> : null}
              </Tabs>
          </Box>
          <Paper sx={{ flexDirection: "column", justifyContent: "top",
              height: "100%", margin: "6px", padding: "6px", flex: 1}}>
              {tabIndex === 0 && (
                  <Box style={inputContainerStyle} component="form" gap={2}>
                      <Typography margin={6}>The App Settings panel lets you change Sidekick settings that are specific to your userid.</Typography>
                  </Box>
              )}
              {tabIndex === 1 && (
                  <Box style={inputContainerStyle} component="form" gap={2}>
                      <TextField type="password" label="Current Password" value={currentPassword} 
                          sx={{ width: "90%" }} autoComplete="off" onChange={handleCurrentPasswordChange} />
                      <TextField type="password" label="New Password" value={newPassword} 
                          sx={{ width: "90%" }} autoComplete="off" onChange={handleNewPasswordChange} />
                      <TextField type="password" label="Re-enter new Password" value={reEnteredNewPassword} 
                          sx={{ width: "90%" }} autoComplete="off" onChange={handleReEnteredNewPasswordChange} />
                      <Box sx={{ display: "flex" }}>
                          <Button type="button" onClick={handleChangePassword} sx={{ mr: 1 }}>Save</Button>
                          <Button type="button" onClick={handleCancelPasswordChange}>Cancel</Button>
                      </Box>
                  </Box>
              )}
              {tabIndex === 2 && (
                <AccountDelete
                    warningMessage = {<Typography>Warning: This will delete your account and all your data.<br/><br/>Make sure you have copies of anything you need before proceeding.</Typography>}
                    serverUrl={serverUrl} token={token} setToken={setToken}
                    onAccountDeleted={() => {setUser('');}
                    }
                    onCancel={handleCancelDeleteAccount}
                />
              )}
          </Paper>
      </Box>
    </Box>
  </Card>;

  return appSettingsOpen ? render : null;
};

export default AppSettings;
