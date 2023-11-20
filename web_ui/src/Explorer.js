import { debounce } from "lodash";
import { useEffect, useState, useContext, useCallback } from 'react';
import { Card, Box, Toolbar, IconButton, Typography, TextField, List, ListItem, ListItemText,
    Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ListAltIcon from '@mui/icons-material/ListAlt';

import axios from 'axios';
import { indigo } from '@mui/material/colors';

import { SystemContext } from './SystemContext';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: indigo[300],
    gap: 2,
  }));

const Explorer = ({handleToggleExplorer, windowPinnedOpen, setWindowPinnedOpen, name, icon, folder, openItemId, setLoadDoc,
     docNameChanged, refresh, setRefresh, itemOpen, hidePrimaryToolbar, deleteEnabled,
    setItemOpen, // to be able to close the item editor if the item is deleted
    serverUrl, token, setToken
    }) => {
    const system = useContext(SystemContext);
    const [docs, setDocs] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [myFolder, setMyFolder] = useState(folder);
    const [sortOrder, setSortOrder] = useState("name");
    const [sortOrderDirection, setSortOrderDirection] = useState(1);
    const [showItemDetails, setShowItemDetails] = useState(false);

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`${name}-explorer-panel`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
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
        let url = `${serverUrl}/docdb/${myFolder}/documents`;
        axios.get(url, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            system.debug(`Response loading items in ${name} Explorer`, response, url + " GET");
            response.data.access_token && setToken(response.data.access_token);
            response.data.documents.sort((a, b) => (a.name > b.name) ? 1 : -1);
            setDocs(sortedList(response.data.documents, sortOrder, sortOrderDirection));
        }).catch(error => {
            system.error(`System Error loading items in ${name} Explorer`, error, url + " GET");
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
    };

    const sortedList = (list, sortBy, sortDirection) => {
        let sortedList = [];
        if (sortBy === "name") {
            sortedList = list.sort((a, b) => (a.name > b.name) ? sortDirection : sortDirection * -1);
        } else if (sortBy === "created") {
            sortedList = list.sort((a, b) => (a.created_date > b.created_date) ? sortDirection : sortDirection * -1);
        } else if (sortBy === "updated") {
            sortedList = list.sort((a, b) => (a.updated_date > b.updated_date) ? sortDirection : sortDirection * -1);
        }
        return sortedList;
    }

    const sortDocs = (sortBy, sortDirection) => {
        let sortedDocs = sortedList(docs, sortBy, sortDirection);
        setDocs(sortedDocs);
    }

    const handleSortOrderChange = (value) => {
        setSortOrder(value);
        sortDocs(value, sortOrderDirection);
    }

    const handleToggleSortOrderDirection = () => {
        sortDocs(sortOrder, sortOrderDirection * -1);
        setSortOrderDirection(x=>x*-1);
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
        let url = `${serverUrl}/docdb/${myFolder}/documents/`;
        const deletePromises = filteredDocs.map(doc => {
            if (openItemId === doc.id) {
                setItemOpen(false);
            }
            return axios.delete(url + doc.id,{
                headers: {
                    Authorization: 'Bearer ' + token
                  }
            }).then(() => { 
                count++;
                console.log("Deleted", doc.id);
                system.info(`${name} Explorer deleted: "${doc.name}"`);
    
            });
        });
        Promise.all(deletePromises).then(() => {
            setFilterText("");
            loadItems();
            system.info(`${name} Explorer deleted ${count} items`);
        }).catch(error => {
            system.error(`System Error deleting filtered items in ${name} Explorer`, error, url + " DELETE");
        });
    };

    const render = <Card id={{name}+"-explorer-panel"} sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px",
    flex:1, minWidth: "320px", maxWidth: "450px", width: "100%"}}>
       {
           hidePrimaryToolbar ? null 
           :
               <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
                   {icon}
                   <Typography sx={{mr:2}}>{name}</Typography>
                   <Tooltip title={showItemDetails ? "Hide details" : "Show details"}>
                       <IconButton edge="start" onClick={() => { setShowItemDetails(state => !state); }}>
                           <ListAltIcon />
                       </IconButton>
                   </Tooltip>
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
       <Box sx={{ width: "100%", paddingLeft: 0, paddingRight: 0, display: "flex", flexDirection: "row" }}>
           <FormControl sx={{ mt: 2, minWidth: 120 }} size="small">
               <InputLabel id="{name}-explorer-sort-order-label">Sort order</InputLabel>
               <Select
                   id="{name}-explorer-sort-order}"
                   labelId="{name}-explorer-sort-order-label"
                   value={sortOrder}
                   label="Sort order"
                   onChange={(event) => { handleSortOrderChange(event.target.value); }}
                   >
                           <MenuItem value="name">Name</MenuItem>
                           <MenuItem value="created">Created</MenuItem>
                           <MenuItem value="updated">Updated</MenuItem>
               </Select>
           </FormControl>
           <Tooltip title="Change sort order">
               <IconButton onClick={handleToggleSortOrderDirection}>
                   { sortOrderDirection === 1 ? <ArrowUpwardIcon/> : <ArrowDownwardIcon/> }
               </IconButton>
           </Tooltip>
           <Box sx={{ flexGrow: 1 }}>
               <TextField
                   id="{name}-explorer-filter"
                   autoComplete='off'
                   label="Filter"
                   value={filterText}
                   onChange={handleFilterTextChange}
                   onKeyDown={handleFilterKeyDown}
                   size="small"
                   sx={{ mt: 2, flex: 1 }}
               />
           </Box>
           {deleteEnabled ? <Tooltip title={ filterText.length === 0 
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
           </Tooltip> : null}
       </Box>
       <Box  sx={{ overflow: 'auto', flex: 1 }}>
           <List>
               {Object.values(filteredDocs).map(doc => (
                   <ListItem sx={{ padding: 0, pl: 1, cursor: "pointer", backgroundColor: doc.id === openItemId && itemOpen ? "#e0e0e0" : "transparent" }} key={doc.id}>
                       <ListItemText primary={doc.name}
                         secondary={
                           showItemDetails ? (
                             <Typography
                               sx={{
                                 fontSize: '12px',
                                 color: 'text.secondary',
                                 whiteSpace: 'pre-wrap',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis',
                               }}
                             >
                               {`Created: ${doc.created_date.substring(0, 19)}\n${doc.updated_date ? 'Updated: ' + doc.updated_date.substring(0, 19) : ''}`}
                             </Typography>
                           ) : null
                         }                            
                       selected={openItemId === doc.id}
                       onClick={() => handleLoadDoc(doc.id)}
                       primaryTypographyProps={{ typography: 'body2' }}
                       sx={{ fontSize: '14px' }} />
                   </ListItem>
               ))}
           </List>
       </Box>
   </Card>;
    return (render);
  }

  export default Explorer;