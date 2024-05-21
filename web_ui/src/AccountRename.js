import axios from 'axios'
import React, { useState } from 'react';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';
import { Box, Typography,Button, TextField } from '@mui/material';

function AccountRename({user, warningMessage, serverUrl, token, setToken, onAccountRenamed, onCancel}) {
    const system = useContext(SystemContext);
    const [password, setPassword] = useState('');
    const [userIdToRename, setUserIdToRename] = useState('');
    const [newUserId, setNewUserId] = useState('');
    const [userName, setUserName] = useState(user?.name || '')

    const resetFields = () => {
        setPassword('');
        setUserIdToRename('');
        setNewUserId('');
        setUserName(user?.name || '');
    }
    
    const handleRenameUserId = () => {
        axios.post(`${serverUrl}/rename_user_id`,
            {
                "user_id": userIdToRename,
                "new_user_id": newUserId,
                "user_name": userName,
                "password": password,
            },
            {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }).then(response => {
                resetFields();
                console.log("rename_user_id response: ", response);
                response.data.access_token && setToken(response.data.access_token);
                if (response.data.success) {
                    system.info(`Account for user "${userIdToRename}" renamed successfully.`);
                    onAccountRenamed && onAccountRenamed();
                } else {
                    system.error(`Failed to rename account.`, response.data.message);
                }
            }).catch(error => {
                console.log("rename_user_id error: ", error);
                let errorMessage = error.response?.data?.message || error.message;
                system.error(`System Error renaming account.`, errorMessage);
            }
        );
      };
    
    const handleCancel = () => {
        resetFields();
        onCancel && onCancel();
    };
    
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px',position: 'relative', gap:2}} component="form">
            <Typography margin={6}>{warningMessage}</Typography>
            <TextField label="Confirm userid to rename" value={userIdToRename} autoComplete="off"
                onChange={(event) => {setUserIdToRename(event.target.value);}}
                sx={{ width: "90%" }} />
            <TextField label="Enter new userid" value={newUserId} autoComplete="off"
                onChange={(event) => {setNewUserId(event.target.value);}}
                sx={{ width: "90%" }} />
            <TextField label="Optionally change user name" value={userName} autoComplete="off"
                onChange={(event) => {setUserName(event.target.value);}}
                sx={{ width: "90%" }} />
            <TextField type="password" label="Your password" value={password} 
                autoComplete="off" /* disable autoComplete of password */
                onChange={(event) => {setPassword(event.target.value);}} 
                sx={{ width: "90%" }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="button" onClick={handleRenameUserId} sx={{ mr: 1 }}>Rename account</Button>
                <Button type="button" onClick={handleCancel}>Cancel</Button>
            </Box>
        </Box>
    );
}

export default AccountRename;
