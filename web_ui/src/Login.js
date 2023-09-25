import axios from 'axios'
import React, { useState, useEffect } from 'react';
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
  };
  
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
      if (!pageLoaded) {
          setPageLoaded(true);
      }
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
      axios
      .post(`${serverUrl}/create_account`, { user_id: userId, password: password })
      .then((response) => {
          console.log(response);
        if (response.data.success) {
          console.log(`User ${userId} created`);
          system.info(`User ${userId} created; logging you in...`);
          login();
        } else {
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
            <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="Login" />
            <Tab label="Create Account" />
            </Tabs>
            {tabIndex === 0 && (
                <Box style={inputContainerStyle} component="form">
                    <TextField id="user_id" type="text" placeholder="Username" 
                        style={inputStyle} onChange={(e) => setUserId(e.target.value)} 
                        autoComplete="username"/>
                    <TextField id="password" type="password" placeholder="Password" 
                        style={inputStyle} onChange={(e) => setPassword(e.target.value)} 
                        autoComplete='current-password' />
                    <Button type='submit' onClick={handleLogin} default>Login</Button>
                </Box>
            )}
            {tabIndex === 1 && (
                <Box style={inputContainerStyle} component="form">
                    <TextField type="text" placeholder="Username" 
                        style={inputStyle} autoComplete="false" onChange={(e) => setUserId(e.target.value)} 
                        />
                    <TextField type="password" placeholder="Password" 
                        style={inputStyle} autoComplete="false" onChange={(e) => setPassword(e.target.value)} 
                        />
                    <Button onClick={handleCreateAccount} default>Create Account</Button>
                </Box>
            )}
        </Box>
    </Box>
  );
}

export default Login;