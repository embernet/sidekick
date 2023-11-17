import axios from 'axios'
import React, { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { Box, Tabs, Tab, Button, TextField, Typography } from '@mui/material';
import Carousel from './Carousel';
import AccountCreate from './AccountCreate';

function Login({setUser, serverUrl, setToken}) {
  const system = useContext(SystemContext);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [pageLoaded, setPageLoaded] = useState(false);
  const loginPasswordRef = useRef(null);
  const [systemSettings, setSystemSettings] = useState({});

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

  const applySystemSettings = () => {
    axios.get(`${serverUrl}/system_settings/login`).then(response => {
      setSystemSettings(response.data);
      console.log("Login custom settings:", response);
    }).catch(error => {
      console.error("Error getting login custom settings:", error);
    });
  }

  const loginWithOidc = () => {
    system.debug("Login with OIDC");
    // get the access token provided in the URL
    let url = window.location.href;
    let token = url.split('access_token=')[1];
    // remove the token from the URL
    window.history.replaceState({}, document.title, "/");
    // get the user info from the token
    
    if (token) {
      let url = `${serverUrl}/oidc_login_get_user`;
      axios
      .post(url, { }, {
          headers: {
              Authorization: 'Bearer ' + token
          }
      })
      .then((response) => {
        system.debug("OIDC login_get_user response:", response);
        if (response.data.success) {
          system.info(`User account "${userId}" logged in. Welcome.`)
          setUser(response.data.user);
          setToken(response.data.access_token)
          system.setServerUp(true);
        } else {
          system.error(`Failed to login`, response.data.message, url + " POST");
        }
      })
      .catch((error) => {
        system.error(`System Error: Server not available. Please try later.`, error, url + " POST");
      });
    } else if (systemSettings?.functionality?.oidcUrl) {
      // redirect to the OIDC login page
      let redirectUri = window.location.href;
      let loginUrl = `${systemSettings?.functionality?.oidcUrl}` //?response_type=token&client_id=${systemSettings.functionality.oidc.clientId}&redirect_uri=${redirectUri}`;
      window.location.replace(loginUrl);
    }
  }    

  useEffect(() => {
      if (!pageLoaded) {
          setPageLoaded(true);
      }
      system.checkServerUp();
      applySystemSettings();
      loginWithOidc();
      if (systemSettings?.functionality?.oidc) {
        loginWithOidc();
      }
  }, [pageLoaded]);

  const login = ({userId, password}) => {
    let url = `${serverUrl}/login`;
    axios
    .post(url, { user_id: userId, password: password })
    .then((response) => {
        console.log(response);
      if (response.data.success) {
        system.info(`User account "${userId}" logged in. Welcome.`)
        setUser(response.data.user);
        setToken(response.data.access_token)
        system.setServerUp(true);
      } else {
        system.error(`Failed to login`, response.data.message, url + " POST");
      }
    })
    .catch((error) => {
      system.error(`System Error: Server not available. Please try later.`, error, url + " POST");
    });
  }

  const handleLogin = (event) => {
      event.preventDefault();
      login({userId:userId, password:password});
      setUserId('');
      setPassword('');
  };
  
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const ui = <Box style={formContainerStyle}>
    <Tabs value={tabIndex} onChange={handleTabChange} style={{ position: 'relative' }}>
      <Tab label="Login" />
      {systemSettings?.functionality?.createAccount ? <Tab label="Create Account" /> : null}
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
        <AccountCreate serverUrl={serverUrl} onAccountCreated={login}/>
    )}
  <Box variant="body3" color="text.secondary" 
    sx={{ textAlign: "center", width: "700px", height: "200px", overflow: "auto", whiteSpace: 'pre-line' }}>
    { (systemSettings?.preLogin?.message) ? systemSettings.preLogin.message : null}
  </Box>
  </Box>

  return ( pageLoaded &&
    <Box style={containerStyle}>
      <Carousel imageFolderName="./images/logo/" filenamePrefix="sidekick_" 
      filenameExtension=".png" altText="Sidekick logo"
      transitions="8" cycleTime="250" />
      <Box sx={{ flex: 1 }}>
      {system.serverUp ? ui : <Typography variant="h5" color="error">Server not available. Please try later.</Typography>}
      </Box>
    </Box>
  );
}

export default Login;