import { debounce } from "lodash";
import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { SystemContext } from './SystemContext';
import { Card, Toolbar, Tooltip, IconButton, Box, Paper, Tabs, Tab, TextField, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { grey } from '@mui/material/colors';
import { use } from 'marked';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: grey[300],
    gap: 2,
}));

const AppSettings = ({ appSettingsOpen, setAppSettingsOpen, user, setUser, onClose, serverUrl, token, setToken }) => {
    const system = useContext(SystemContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [reEnteredNewPassword, setReEnteredNewPassword] = useState('');
    const [confirmUser, setConfirmUserId] = useState('');
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);

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
        console.log("AppSettings instantiated");
    }, []);

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

  const handleCancel = () => {
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

  const render = <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "600px", maxWidth: "600px"}}>
    
  <StyledToolbar className={ClassNames.toolbar}>
      <SettingsIcon/>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }} gap={2}>
          <Typography variant="h6">Settings for user: </Typography>
          <Typography sx={{ fontWeight: "bold" }}>{user}</Typography>
      </Box>
      <Box ml="auto">
          <IconButton onClick={() => setAppSettingsOpen(false)}>
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
                  <Tab label="Change Password" />
                  <Tab label="Delete Account" />
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
                          sx={{ width: "300px" }} autoComplete="off" onChange={handleCurrentPasswordChange} />
                      <TextField type="password" label="New Password" value={newPassword} 
                          sx={{ width: "300px" }} autoComplete="off" onChange={handleNewPasswordChange} />
                      <TextField type="password" label="Re-enter new Password" value={reEnteredNewPassword} 
                          sx={{ width: "300px" }} autoComplete="off" onChange={handleReEnteredNewPasswordChange} />
                      <Box sx={{ display: "flex" }}>
                          <Button type="button" onClick={handleChangePassword} sx={{ mr: 1 }}>Save</Button>
                          <Button type="button" onClick={handleCancel}>Cancel</Button>
                      </Box>
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
                          <Button type="button" onClick={handleCancel}>Cancel</Button>
                      </Box>
                  </Box>

              )}
          </Paper>
      </Box>
    </Box>
  </Card>;

  return appSettingsOpen ? render : null;
};

export default AppSettings;
