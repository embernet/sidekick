import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Tooltip, Paper, Typography, Popover, Button, List, ListItem, ListItemText } from '@mui/material';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';

import { grey, red, orange, blue } from '@mui/material/colors';
import HistoryIcon from '@mui/icons-material/History';

const StatusBar = ({ statusUpdates, darkMode, persona, modelSettings,
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

    const displayDateTimeString = () => {
        return isMobile ? system.userTimeString() : system.userDateTimeString();
    };

    useEffect(() => {
    if (!displayMessage) {
        setDateTimeString(displayDateTimeString());
        const timer = setInterval(() => {
            setDateTimeString(displayDateTimeString());
        }, 10000); // Update every 10 seconds

        return () => clearInterval(timer);
    }
    }, [displayMessage]);

    const handleCloseLogPopover = () => {
        setPopoverOpen(false);
        document.removeEventListener('keydown', handleEscape);
      };
      
      const handleCloseMessagePopover = () => {
        setDisplayMessage('');
      };
      
    const handleEscape = (event) => {
    if (event.key === 'Escape') {
        handleCloseLogPopover();
        handleCloseMessagePopover();
    }
    };

    const handleStatusClick = () => {
        if (statusUpdates.length > 0) {
            setPopoverOpen(true);
            document.addEventListener('keydown', handleEscape);
        }
    };

    return (
        <Paper sx={{ margin: "2px 0px", padding: "2px 6px", display:"flex", gap: 1,
            backgroundColor: darkMode ? grey[900] : grey[100] }}>
            {
                statusUpdates.length ?
                    <Button ref={statusRef} onClick={handleStatusClick} variant="outlined" size="small" color="primary" sx={{ padding: 0, minWidth: 26 }}>
                        <HistoryIcon fontSize="small" style={{ color: statusColor(statusUpdates.length && statusUpdates[statusUpdates.length - 1].type) }} />
                    </Button>
                : null
            }
            <Button id="status-button-log" variant={statusUpdates.length > 0 ? "outlined" : "text"}
                size="small" color="primary"
                sx={{ fontSize: "0.8em", textTransform: 'none', width: isMobile ? "40px" : "auto", minWidth: 40 }}>
                <Typography variant="caption" component="span"
                    style={{ color: "primary" }}
                >
                    {dateTimeString}
                </Typography>
            </Button>
            <Popover
                open={popoverOpen}
                anchorEl={statusRef.current}
                onClose={handleCloseLogPopover}
                onClick={handleCloseLogPopover}
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
            <Popover
                open={displayMessage !== ''}
                anchorEl={statusRef.current}
                onClose={handleCloseMessagePopover}
                onClick={handleCloseMessagePopover}
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
                <Typography variant="caption" component="span"
                    sx={{ cursor: statusUpdates.length > 0 ? 'pointer' : 'default', margin: '2px', padding: '2px', borderRadius: '4px', width: '100%' }}
                    style={{ color: displayMessage !== ''
                            ? statusColor(statusUpdates.length && statusUpdates[statusUpdates.length - 1].type)
                            : "primary"
                    }}
                >
                    {displayMessage}
                </Typography>
            </Popover>
            { persona && 
                <Tooltip title={
                        "Selected AI persona" + (personasOpen ? " (click to hide Persona Explorer)" : " (click to show Persona Explorer)")
                }>
                    <Button id="status-button-personas" variant="outlined" size="small" color="primary" sx={{ fontSize: "0.8em", textTransform: 'none' }} onClick={togglePersonasOpen}>
                        <Typography variant="caption" component="span"
                            sx={{ margin: '2px', padding: '2px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {persona.name}
                        </Typography>
                    </Button>
                </Tooltip>
            }
            {  modelSettings?.request && modelSettings?.request?.model &&
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
                            sx={{ margin: '2px', padding: '2px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {modelSettings.asShortText}
                        </Typography>
                    </Button>
                </Tooltip>
            }
        </Paper>
    );
};

export default StatusBar;
