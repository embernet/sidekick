import React from 'react';
import { Paper, Popover, Box, Toolbar, IconButton, Button, Grid, Typography } from '@mui/material';
import { styled } from '@mui/system';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// modalDialogInfo is a dictionary with the following parameters:
// title: text to use on the title bar of the modal dialog, this will also determine the icon used
// message: text to display in the body of the modal dialog
const SidekickModalDialog = ({modalDialogInfo, setModalDialogInfo}) => {

    const StyledToolbar = styled(Toolbar)(({ theme }) => ({
        backgroundColor: theme.palette.secondary.main,
        gap: 2,
      }));

    const render = modalDialogInfo ?
        <Popover
            open={Boolean(modalDialogInfo)}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            PaperProps={{
                style: {
                maxWidth: '400px',
                padding: '4px',
                },
            }}
            onClose={() => {setModalDialogInfo(false);}}
            >
            <StyledToolbar sx={{ gap: 1 }}>
                <InfoOutlinedIcon/><Typography variant="h6" align="center">{modalDialogInfo.title}</Typography>
            </StyledToolbar>
            <Paper sx={{padding:2}}>
                <Typography variant="body2">{modalDialogInfo.message}</Typography>
                <Box display="flex" justifyContent="flex-end">
                    <Button onClick={()=>{setModalDialogInfo(undefined);}}>Close</Button>
                </Box>
            </Paper>
        </Popover>
        : null;
    return (render);
};

export default SidekickModalDialog;