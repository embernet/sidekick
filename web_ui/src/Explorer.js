import { debounce } from "lodash";
import { useEffect, useState, useContext, useCallback } from 'react';
import { Card, Box, Toolbar, IconButton, Typography, TextField, List, ListItem, ListItemText,
    Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

import axios from 'axios';
import { indigo } from '@mui/material/colors';

import { SystemContext } from './SystemContext';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: indigo[300],
    gap: 2,
  }));

const Explorer = ({handleToggleExplorer, windowPinnedOpen, setWindowPinnedOpen, name, icon, folder, openItemId, setLoadDoc,
     docNameChanged, refresh, setRefresh, itemOpen, hidePrimaryToolbar,
    setItemOpen, // to be able to close the item editor if the item is deleted
    serverUrl, token, setToken
    }) => {
    const system = useContext(SystemContext);
    const [docs, setDocs] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [myFolder, setMyFolder] = useState(folder);

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
        const { width } = entries[0].contentRect;
        setWidth(width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById("chat-panel");
        const observer = new ResizeObserver(handleResize);
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(()=>{
        setMyFolder(folder);
    }, [folder]);

    useEffect(()=>{
        loadItems();
    }, [refresh]);

    useEffect(()=>{
        setRefresh(true);
    }, [myFolder]);

    useEffect(()=>{
        if (docNameChanged !== "") {
            loadItems();
        }
    }, [docNameChanged]);

    const loadItems = () => {
        axios.get(`${serverUrl}/docdb/${myFolder}/documents`, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            console.log("/docdb Response", response);
            response.data.access_token && setToken(response.data.access_token);
            response.data.documents.sort((a, b) => (a.name > b.name) ? 1 : -1);
            setDocs(response.data.documents);
        }).catch(error => {
            console.error("Explorer error loading items:", error);
            system.error(`Explorer error loading items: ${error}`);
        });
    };

    const handleFilterTextChange = (event) => {
        setFilterText(event.target.value);
    };

    const handleFilterKeyDown = (event) => {
        if(event.key === 'Escape') {
            setFilterText("");
            event.preventDefault();
        }
    }

    const handleLoadDoc = (id) => {
        console.log("handleLoadDoc", id);
        setLoadDoc({ "id": id, "timestamp": Date.now() });
    };

    const filteredDocs = docs.filter(doc => {
        return doc.name.toLowerCase().includes(filterText.toLowerCase());
    });

    const handleDeleteFilteredItems = () => {
        console.log("handleDeleteFilteredItems", itemOpen);
        let count = 0;
        const deletePromises = filteredDocs.map(doc => {
            console.log("Deleting", doc.id);
            if (openItemId === doc.id) {
                setItemOpen(false);
            }
            return axios.delete(`${serverUrl}/docdb/${myFolder}/documents/${doc.id}`,{
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(() => { count++; });
        });
        Promise.all(deletePromises).then(() => {
            setFilterText("");
            loadItems();
            system.info(`Deleted ${count} items`);
        }).catch(error => {
            console.error("handleDeleteFilteredItems error", error);
            system.error(`Error deleting items: ${error}`);
        });
    };

    return (
        <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "350px", maxWidth: "450px"}}>
            {
                hidePrimaryToolbar ? null 
                :
                    <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
                        {icon}
                        <Typography>{name}</Typography>
                        <Box ml="auto">
                            <Tooltip title={windowPinnedOpen ? "Unpin window" : "Pin window open"}>
                                <IconButton onClick={() => { setWindowPinnedOpen(state => !state); }}>
                                    {windowPinnedOpen ? <PushPinIcon /> : <PushPinOutlinedIcon/>}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Close window">
                                <IconButton onClick={handleToggleExplorer}>
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </StyledToolbar>
            }
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <TextField
                    id="{name}-explorer-filter"
                    autoComplete='off'
                    label="Filter"
                    value={filterText}
                    onChange={handleFilterTextChange}
                    onKeyDown={handleFilterKeyDown}
                    sx={{ mt: 2, flex: 1 }}
                />
                <Tooltip title={ filterText.length === 0 
                    ? "Enter a filter to enable bulk delete" 
                    : "Delete notes matching filter" 
                }>
                    <Box sx={{ ml: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconButton edge="start" color="inherit" aria-label="delete notes matching filter"
                            onClick={handleDeleteFilteredItems}
                            disabled={filterText.length === 0}
                        >
                            <DeleteIcon/>
                        </IconButton>
                    </Box>
                </Tooltip>
            </Box>
            <Box  sx={{ overflow: 'auto', flex: 1 }}>
                <List>
                    {Object.values(filteredDocs).map(doc => (
                        <ListItem sx={{ padding: 0, pl: 1, cursor: "pointer", backgroundColor: doc.id === openItemId && itemOpen ? "#e0e0e0" : "transparent" }} key={doc.id}>
                            <ListItemText primary={doc.name}
                            selected={openItemId === doc.id}
                            onClick={() => handleLoadDoc(doc.id)}
                            primaryTypographyProps={{ typography: 'body2' }}
                            sx={{ fontSize: '14px' }} />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Card>
    );
  }

  export default Explorer;