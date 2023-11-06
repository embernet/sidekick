import axios from 'axios'
import React, { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { Box, Tabs, Tab, Button, TextField } from '@mui/material';

function AccountResetPassword({serverUrl, token, setToken, onAccountUserIdPasswordReset}) {
    const system = useContext(SystemContext);
    const AccountResetPasswordRef = useRef(null);
    const AccountVerifyResetPasswordRef = useRef(null);
    const [userId, setUserId] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [verifiedNewPassword, setVerifiedNewPassword] = useState('');
    
    const handleAccountResetPassword = (event) => {
        event.preventDefault();
        if (newPassword !== verifiedNewPassword) {
            setNewPassword('');
            setVerifiedNewPassword('');
            AccountResetPasswordRef.current.focus();
            system.error("Passwords don't match");
            return;
        }
        axios
        .post(`${serverUrl}/reset_password`, { user_id: userId, new_password: newPassword },
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
        .then((response) => {
            console.log(response);
          if (response.data.success) {
            console.log(`User ${userId} password reset`);
            system.info(`User ${userId} password reset`);
            onAccountUserIdPasswordReset && onAccountUserIdPasswordReset({userId: userId, password: newPassword});
            setUserId('');
            setNewPassword('');
            setVerifiedNewPassword('');
          } else {
            system.error(`Error resetting password: ${response.data.message}`);
            console.log(response.data.message);
          }
        })
        .catch((error) => {
            system.error("Error ", error.message);
            console.error(error);
        });
    };
  
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px',position: 'relative',}}>
            <TextField id="create-account-userid" type="text" placeholder="Enter UserId" 
                value={userId}
                sx={{ margin: '6px', padding: '4px' }} autoComplete="off"  onChange={(e) => setUserId(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { AccountResetPasswordRef.current.focus(); }}}
            />
            <TextField id="create-account-password" type="password" placeholder="Enter Password"
                value={newPassword} 
                inputRef = {AccountResetPasswordRef}
                sx={{ margin: '6px', padding: '4px' }} autoComplete="off" onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { AccountVerifyResetPasswordRef.current.focus(); }}} 
                />
            <TextField id="create-account-verify-password" type="password" placeholder="Verify password" 
                value={verifiedNewPassword}
                inputRef = {AccountVerifyResetPasswordRef}
                sx={{ margin: '6px', padding: '4px' }} autoComplete="off" onChange={(e) => setVerifiedNewPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleAccountResetPassword(e); }}} 
                />
            <Button onClick={handleAccountResetPassword} default>Reset Password</Button>
        </Box>
    );
}

export default AccountResetPassword;