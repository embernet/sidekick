import axios from 'axios'
import React, { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { Box, Tabs, Tab, Button, TextField } from '@mui/material';
import Carousel from './Carousel';

function Login({setUser, serverUrl, setToken}) {
  const system = useContext(SystemContext);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [preLoginMessage, setPreLoginMessage] = useState('');
  const loginPasswordRef = useRef(null);
  const createAccountPasswordRef = useRef(null);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  };

  const formContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'top',
    flex: 1,
    position: 'relative',
  };
  
  const inputContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
    position: 'relative',
  };

  const inputStyle = {
    margin: '6px',
    padding: '4px',
  };

  const applyCustomSettings = () => {
    axios.get(`${serverUrl}/custom_settings/login`).then(response => {
      if ("preLogin" in response.data && "message" in response.data.preLogin) {
        setPreLoginMessage(response.data?.preLogin?.message);
      }
      console.log("Login custom settings:", response);
    }).catch(error => {
      console.error("Error getting login custom settings:", error);
    });
  }

  useEffect(() => {
      if (!pageLoaded) {
          setPageLoaded(true);
      }
      applyCustomSettings();
  }, [pageLoaded]);

  const login = () => {
    axios
    .post(`${serverUrl}/login`, { user_id: userId, password: password })
    .then((response) => {
        console.log(response);
      if (response.data.success) {
        console.log(`User ${userId} logged in`);
        setUser(userId);
        setToken(response.data.access_token)
        system.setServerUp(true);
      } else {
        console.log(response.data.message);
        system.error(response.data.message);
      }
    })
    .catch((error) => {
      console.error(error);
      system.error(`Server not available: ${error}`);
    });
  }

  const handleCreateAccount = (event) => {
      event.preventDefault();
      let properties = "{}";
      axios
      .post(`${serverUrl}/create_account`, { user_id: userId, properties: properties, password: password })
      .then((response) => {
          console.log(response);
        if (response.data.success) {
          console.log(`User ${userId} created`);
          system.info(`User ${userId} created; logging you in...`);
          login();
        } else {
          system.error(response.data.message);
          console.log(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };
  
  const handleLogin = (event) => {
      event.preventDefault();
      login();
  };

  
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return ( pageLoaded &&
    <Box style={containerStyle}>
      <Carousel imageFolderName="./images/logo/" filenamePrefix="sidekick_" 
      filenameExtension=".png" altText="Sidekick logo"
      transitions="8" cycleTime="250"/>
      <Box style={formContainerStyle}>
          <Tabs value={tabIndex} onChange={handleTabChange} style={{ position: 'relative' }}>
            <Tab label="Login" />
            <Tab label="Create Account" />
          </Tabs>
          {tabIndex === 0 && (
              <Box style={inputContainerStyle} component="form">
                  <TextField id="user_id" type="text" placeholder="Username" 
                      style={inputStyle} onChange={(e) => setUserId(e.target.value)} 
                      autoComplete="username"
                      onKeyDown={(e) => { if (e.key === 'Enter') { loginPasswordRef.current.focus(); }}}
                    />
                  <TextField id="password" type="password" placeholder="Password" 
                    inputRef = {loginPasswordRef}
                    style={inputStyle} onChange={(e) => setPassword(e.target.value)} 
                    autoComplete='current-password'
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleLogin(e); }}}
                   />
                  <Button onClick={handleLogin} default>Login</Button>
              </Box>
          )}
          {tabIndex === 1 && (
              <Box style={inputContainerStyle} component="form">
                  <TextField id="create-account-userid" type="text" placeholder="Enter UserId" 
                    style={inputStyle} autoComplete="off"  onChange={(e) => setUserId(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') { createAccountPasswordRef.current.focus(); }}}
                  />
                  <TextField id="create-account-password" type="password" placeholder="Enter Password" 
                    inputRef = {createAccountPasswordRef}
                    style={inputStyle} autoComplete="off" onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleCreateAccount(e); }}} 
                    />
                  <Button onClick={handleCreateAccount} default>Create Account</Button>
              </Box>
          )}
        <Box variant="body3" color="text.secondary" 
          sx={{ textAlign: "center", width: "700px", height: "200px", overflow: "auto", whiteSpace: 'pre-line' }}>
          {preLoginMessage}
        </Box>
      </Box>
    </Box>
  );
}

export default Login;