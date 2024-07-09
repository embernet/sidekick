import axios from 'axios'
import React, { useState } from 'react';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { Box, Typography,Button, TextField } from '@mui/material';

function AccountDelete({warningMessage, serverUrl, token, setToken, onAccountDeleted, onCancel}) {
    const system = useContext(SystemContext);
    const [password, setPassword] = useState('');
    const [userToDelete, setUserToDelete] = useState('');
    const [confirmedUserToDelete, setConfirmedUserToDelete] = useState('');

    const resetFields = () => {
        setPassword('');
        setUserToDelete('');
        setConfirmedUserToDelete('');
    }
    
    const handleDeleteAccount = () => {
        if (userToDelete !== confirmedUserToDelete) {
            resetFields();
            system.error('Error deleting account: Confirmed Userid does not match Userid to delete.');
            return;
        }
        axios.post(`${serverUrl}/delete_user`,
            {
                "user_id": userToDelete,
                "password": password
            },
            {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then(response => {
                resetFields();
                console.log("delete_user response: ", response);
                response.data.access_token && setToken(response.data.access_token);
                if (response.data.success) {
                    system.info(`Account for user "${userToDelete}" deleted successfully.`);
                    onAccountDeleted && onAccountDeleted();
                } else {
                    system.error(`Failed to delete account.`, response.data.message);
                }
            }).catch(error => {
                system.error(`System Error deleting account.`, error);
            }
        );
      };
    
    const handleCancel = () => {
        resetFields();
        onCancel && onCancel();
    };
    
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px',position: 'relative', gap:2}} component="form">
            <Box margin={6}>{warningMessage}</Box>
            <TextField label="Enter userid to delete" value={userToDelete} autoComplete="off"
                onChange={(event) => {setUserToDelete(event.target.value);}}
                sx={{ width: "90%" }} />
            <TextField label="Confirm userid to delete" value={confirmedUserToDelete} autoComplete="off"
                onChange={(event) => {setConfirmedUserToDelete(event.target.value);}}
                sx={{ width: "90%" }} />
            <TextField type="password" label="Your password" value={password} 
                autoComplete="off" /* disable autoComplete of password for deleting accounts */
                onChange={(event) => {setPassword(event.target.value);}} 
                sx={{ width: "90%" }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="button" onClick={handleDeleteAccount} sx={{ mr: 1 }}>Delete</Button>
                <Button type="button" onClick={handleCancel}>Cancel</Button>
            </Box>
        </Box>
    );
}

export default AccountDelete;