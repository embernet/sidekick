import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Tooltip, Paper, Typography, Popover, Button, List, ListItem, ListItemText } from '@mui/material';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';

import { grey, red, orange, blue } from '@mui/material/colors';

const StatusBar = ({ statusUpdates, persona, modelSettings,
modelSettingsOpen, toggleModelSettingsOpen,
personasOpen, togglePersonasOpen, isMobile }) => {
    const system = useContext(SystemContext);
    const [displayMessage, setDisplayMessage] = useState('');
    const [dateTimeString, setDateTimeString] = useState('');
    const [popoverOpen, setPopoverOpen] = useState(false);
    const statusRef = useRef();

    const statusColor = (status) => {
        switch (status) {
            case 'error':
                return red[500];
            case 'warning':
                return orange[500];
            case 'info':
                return blue[500];
            default:
                return grey[500];
        }
    }

    useEffect(() => {
        if (statusUpdates.length > 0) {
          setDisplayMessage(statusUpdates[statusUpdates.length - 1].message);
    
          const timer = setTimeout(() => {
            setDisplayMessage('');
          }, 5000);
    
          return () => clearTimeout(timer);
        }
      }, [statusUpdates]);
    
    useEffect(() => {
    if (!displayMessage) {
        setDateTimeString(system.userDateTimeString());
        const timer = setInterval(() => {
            setDateTimeString(system.userDateTimeString());
        }, 10000); // Update every 10 seconds

        return () => clearInterval(timer);
    }
    }, [displayMessage]);

    const handleClose = () => {
        setPopoverOpen(false);
        document.removeEventListener('keydown', handleEscape);
      };
      
    const handleEscape = (event) => {
    if (event.key === 'Escape') {
        handleClose();
    }
    };

    const handleStatusClick = () => {
        if (statusUpdates.length > 0) {
            setPopoverOpen(true);
            document.addEventListener('keydown', handleEscape);
        }
    };

    return (
        <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 1, backgroundColor: grey[100] }}>
            <Button id="status-button-log" variant={statusUpdates.length > 0 ? "outlined" : "text"}
                size="small" color="primary"
                sx={{ fontSize: "0.8em", textTransform: 'none', width: isMobile ? "100%" : "auto" }} onClick={handleStatusClick}>
                <Typography variant="caption" component="span"
                    sx={{ cursor: statusUpdates.length > 0 ? 'pointer' : 'default', margin: '2px', padding: '2px', borderRadius: '4px', width: '100%' }}
                    ref={statusRef}
                    style={{ color: displayMessage !== ''
                            ? statusColor(statusUpdates.length && statusUpdates[statusUpdates.length - 1].type)
                            : "primary"
                    }}
                >
                    {displayMessage !== '' ? displayMessage : dateTimeString}
                </Typography>
            </Button>
            <Popover
                open={popoverOpen}
                anchorEl={statusRef.current}
                onClose={handleClose}
                onClick={handleClose}
                anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
                }}
                transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
                }}
                sx={{width: isMobile ? "100%" : "auto"}}
            >
                <List dense>
                {statusUpdates.map((msg, index) => (
                    <ListItem key={index}>
                        <ListItemText primary={`${msg?.timestamp} - ${msg.message}`}
                            style={{ color: statusColor(msg.type) }}
                        />
                    </ListItem>
                ))}
                </List>
            </Popover>
            { !isMobile && persona && 
                <Tooltip title={
                        "Selected AI persona" + (personasOpen ? " (click to hide Persona Explorer)" : " (click to show Persona Explorer)")
                }>
                    <Button id="status-button-personas" variant="outlined" size="small" color="primary" sx={{ fontSize: "0.8em", textTransform: 'none' }} onClick={togglePersonasOpen}>
                        <Typography variant="caption" component="span"
                            sx={{ margin: '2px', padding: '2px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {persona.name}
                        </Typography>
                    </Button>
                </Tooltip>
            }
            {  !isMobile && modelSettings?.request && modelSettings?.request?.model &&
                <Tooltip title={ 
                    <Fragment>
                        <pre>
                            {"Model Settings" +
                            (modelSettingsOpen ? " (click to hide)" : " (click to edit)") +
                            "\n" + modelSettings.asMultiLineText}
                        </pre>
                    </Fragment>
                    }>
                    <Button id="status-button-model-settings" variant="outlined" size="small" color="primary" sx={{ fontSize: "0.8em", textTransform: 'none' }} onClick={toggleModelSettingsOpen}>
                        <Typography variant="caption" component="span"
                            sx={{ margin: '2px', padding: '2px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {modelSettings.asShortText}
                        </Typography>
                    </Button>
                </Tooltip>
            }
        </Paper>
    );
};

export default StatusBar;
