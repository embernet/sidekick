import React, { useState, useRef, useEffect } from 'react';
import { Paper, Typography, Popover, List, ListItem, ListItemText } from '@mui/material';
import { useContext } from 'react';
import { SystemContext } from './SystemContext';

import { grey, red, orange, blue } from '@mui/material/colors';

const StatusBar = ({ statusUpdates }) => {
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
            <Typography variant="caption" component="span"
                sx={{ cursor: statusUpdates.length > 0 ? 'pointer' : 'default', margin: '2px', padding: '2px', borderRadius: '4px', width: '100%' }}
                ref={statusRef}
                onClick={handleStatusClick}
                style={{ color: displayMessage !== ''
                        ? statusColor(statusUpdates.length && statusUpdates[statusUpdates.length - 1].type)
                        : statusColor('default')
                }}
            >
                {displayMessage !== '' ? displayMessage : dateTimeString}
            </Typography>
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
        </Paper>
    );
};

export default StatusBar;
