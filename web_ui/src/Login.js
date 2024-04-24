import axios from 'axios'
import React, { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { Box, Tabs, Tab, Button, TextField, Typography } from '@mui/material';
import Carousel from './Carousel';
import AccountCreate from './AccountCreate';

function Login({setUser, serverUrl, setToken, darkMode, setDarkMode}) {
  const system = useContext(SystemContext);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [pageLoaded, setPageLoaded] = useState(false);
  const loginPasswordRef = useRef(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loginMode, setLoginMode] = useState('none'); // set to oidc, token, or local in [pageLoaded] useEffect

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

  const applySystemSettings = async () => {
    const response = await axios.get(`${serverUrl}/system_settings/login`).then(response => {
      setSystemSettings(response.data);
      // also get darkMode setting from browser local storage as we don't know who the user is yet
      let darkMode = localStorage.getItem('darkMode');
      if (darkMode) {
        setDarkMode(darkMode === 'true');
      }
      console.log("Login custom settings:", response);
      return response.data;
    }).catch(error => {
      system.setServerUp(false);
      console.error("Error getting login custom settings:", error);
      system.error("System Error: Server not available. Please try later.", error);
    });
    return response;
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  const loggedInWithToken = (jwtToken) => {
    try {        
      if (jwtToken) {
        setToken(jwtToken);
        // get the user info from the token
        let tokenData = parseJwt(jwtToken);
        let user = {
          id: tokenData.id,
          name: tokenData.name,
          is_oidc: tokenData.is_oidc,
        }
        setUser(user);
        system.info(`User "${user.name}" logged in. Welcome.`)
        system.setServerUp(true);
        window.history.replaceState({}, document.title, "/");
      }
    } catch (error) {
      system.error(`System Error: Server not available. Please try later.`, error);
    }
  }

  const loginWithOidc = () => {
    // Get the redirect URL (this page) for the OIDC provider to call with the access_token once the user is authenticated
    let redirectUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
    let loginUrl = `${serverUrl}/oidc_login?redirect_uri=${redirectUrl}` 
    system.debug(`Redirecting to OIDC login page: ${loginUrl}`);
    window.location.replace(loginUrl);
  }

  useEffect(() => {
    if (!pageLoaded) {
        setPageLoaded(true);
        setLoginMode('none');
    }
    applySystemSettings().then((response) => {
      system.setServerUp(true);
      console.log("Login page loaded with custom settings:", response)
      // if the /login/native page was called then set the login mode to local
      system.debug("Login pathname:", window.location.pathname)
      if (window.location.pathname === '/login/native') {
        setLoginMode('local');
      } else if (response?.functionality?.oidc) {
        system.debug("Login will be via OIDC");
        let url = window.location.href;
        try {
          // check if an access_token was provided in the URL
          let token = url.split('access_token=')[1];
          if (token) {
            setLoginMode('token');
            loggedInWithToken(token);
          } else {
            setLoginMode('oidc');
          }
        } catch (error) {
          system.error(`System Error: Attempt to login via token with invalid access_token.`, error, url);
        }
      } else {
        setLoginMode('local');
      }
    })
    .catch((error) => {
        system.setServerUp(false);
        system.error(`System Error: Server not available. Please try later.`, error);
    });
  }, [pageLoaded]);

  const nativeLogin = ({userId, password}) => {
    let url = `${serverUrl}/login`;
    axios
    .post(url, { user_id: userId, password: password })
    .then((response) => {
        console.log(response);
      if (response.data.success) {
        system.info(`User "${userId}" logged in. Welcome.`)
        setUser(response.data.user);
        setToken(response.data.access_token)
        system.setServerUp(true);
        window.history.replaceState({}, document.title, "/");
      } else {
        system.error(`Failed to login`, response.data.message, url + " POST");
      }
    })
    .catch((error) => {
      system.setServerUp(false);
      system.error(`System Error: Server not available. Please try later.`, error, url + " POST");
    });
  }

  const handleNativeLogin = (event) => {
      event.preventDefault();
      nativeLogin({userId:userId, password:password});
      setUserId('');
      setPassword('');
  };
  
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const nativeLoginUI = <>
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
              onKeyDown={(e) => { if (e.key === 'Enter') { handleNativeLogin(e); }}}
            />
            <Button onClick={handleNativeLogin} default>Login</Button>
        </Box>
    )}
    {tabIndex === 1 && (
        <AccountCreate serverUrl={serverUrl} onAccountCreated={nativeLogin}/>
    )}
  </>

  const oidcLoginUI = <>
    <Box style={inputContainerStyle} component="form">
      <Button onClick={loginWithOidc} default>Login with Single Sign-On</Button>
      <Box variant="body3" color="text.secondary" 
        sx={{ textAlign: "center", width: "700px", height: "200px", overflow: "auto", whiteSpace: 'pre-line' }}>
        { (systemSettings?.preLogin?.oidcMessage) ? systemSettings.preLogin.oidcMessage : null}
      </Box>
    </Box>
  </>

  const ui = <Box style={formContainerStyle}>
    {loginMode === 'oidc' ? oidcLoginUI : null}
    {loginMode === 'local' ? nativeLoginUI : null}
    <Box variant="body3" color="text.secondary" 
      sx={{ textAlign: "center", width: "80%", height: "200px", overflow: "auto", whiteSpace: 'pre-line' }}>
      { (systemSettings?.preLogin?.message) ? systemSettings.preLogin.message : null}
    </Box>
  </Box>

  return ( pageLoaded &&
    <Box style={containerStyle}>
      <Carousel imageFolderName="./images/logo/" filenamePrefix="sidekick_" 
      filenameExtension=".png" altText="Sidekick logo"
      transitions="8" cycleTime="250" />
      <Box sx={{ flex: 1 }}>
      {system.serverUp && systemSettings ? ui : system.serverPinged ? <Typography variant="h5" color="error">Server not available. Please try later.</Typography> : null}
      </Box>
    </Box>
  );
}

export default Login;