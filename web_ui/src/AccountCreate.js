import axios from 'axios'
import React, { useState, useRef } from 'react';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { Box, Button, TextField } from '@mui/material';

function AccountCreate({serverUrl, onAccountCreated}) {
    const system = useContext(SystemContext);
    const createAccountPasswordRef = useRef(null);
    const createAccountVerifyPasswordRef = useRef(null);
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [verifiedPassword, setVerifiedPassword] = useState('');
    
    const handleCreateAccount = (event) => {
        event.preventDefault();
        if (password !== verifiedPassword) {
            setPassword('');
            setVerifiedPassword('');
            createAccountPasswordRef.current.focus();
            system.error("Passwords don't match");
            return;
        }
        let properties = "{}";
        axios
        .post(`${serverUrl}/create_account`, { user_id: userId, properties: properties, password: password })
        .then((response) => {
            system.debug("Create account", response, "response");
          if (response.data.success) {
            system.info(`User account "${userId}" created.`);
            onAccountCreated && onAccountCreated({userId: userId, password: password});
            setUserId('');
            setPassword('');
            setVerifiedPassword('');
          } else {
            system.error("Error creating account", response.data.message);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    };
  
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px',position: 'relative',}} component="form">
            <TextField id="create-account-userid" type="text" placeholder="Enter UserId" 
                value={userId}
                sx={{ margin: '6px', padding: '4px' }} autoComplete="off"  onChange={(e) => setUserId(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { createAccountPasswordRef.current.focus(); }}}
            />
            <TextField id="create-account-password" type="password" placeholder="Enter Password"
                value={password} 
                inputRef = {createAccountPasswordRef}
                sx={{ margin: '6px', padding: '4px' }} autoComplete="off" onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { createAccountVerifyPasswordRef.current.focus(); }}} 
                />
            <TextField id="create-account-verify-password" type="password" placeholder="Verify password" 
                value={verifiedPassword}
                inputRef = {createAccountVerifyPasswordRef}
                sx={{ margin: '6px', padding: '4px' }} autoComplete="off" onChange={(e) => setVerifiedPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleCreateAccount(e); }}} 
                />
            <Button onClick={handleCreateAccount} default>Create Account</Button>
        </Box>
    );
}

export default AccountCreate;