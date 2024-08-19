import React from 'react';
import { Box, Typography, Tooltip, IconButton, TextField } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { SecondaryToolbar } from './theme';

const SharedDocPanel = ({ type, documentOwnerName, shareData, handleClone }) => {
    return (
        <Box sx={{ 
            border: '2px solid', 
            borderColor: 'orange', 
            borderRadius: 1, 
            mt: 1, 
            width: '100%',
        }}>
            <SecondaryToolbar sx={{ gap: 1 }}>
                <Typography style={{ flexGrow: 1, fontWeight: 'bold' }}>Shared {type}</Typography>
                <Typography>Clone to edit:</Typography>
                <Tooltip title="Clone note">
                    <IconButton edge="end" onClick={() => { handleClone(); }}>
                        <FileCopyIcon />
                    </IconButton>
                </Tooltip>
            </SecondaryToolbar>
            <Box sx={{ width: '100%' }}>
                <TextField 
                    label="Shared by" 
                    disabled 
                    sx={{ width: 'calc(100% - 8px)', m: '4px', mt: '10px' }}
                    value={documentOwnerName}
                />
                {shareData && shareData.description && (
                    <TextField 
                        label="Description" 
                        disabled 
                        sx={{ width: 'calc(100% - 8px)', m: '4px', mt: '10px' }} 
                        multiline 
                        rows={4}
                        value={shareData.description}
                    />
                )}
            </Box>
        </Box>
    );
};

export default SharedDocPanel;