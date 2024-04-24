import { debounce } from "lodash";
import { useEffect, useState, useContext, useCallback, useRef } from 'react';
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
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import { indigo, grey } from '@mui/material/colors';
import { StyledBox } from "./theme";

import axios from 'axios';

import { SystemContext } from './SystemContext';
import SettingsManager from './SettingsManager';

const Explorer = ({onClose, windowPinnedOpen, setWindowPinnedOpen, name, icon, folder, openItemId, setLoadDoc,
     docNameChanged, refresh, setRefresh, itemOpen, hidePrimaryToolbar, deleteEnabled, darkMode,
    setItemOpen, // to be able to close the item editor if the item is deleted
    serverUrl, token, setToken, isMobile
    }) => {

    const panelWindowRef = useRef(null);
    const [mySettingsManager, setMySettingsManager] = useState(new SettingsManager(serverUrl, token, setToken));
    const StyledToolbar = styled(Toolbar)(({ theme }) => ({
        backgroundColor: darkMode ? indigo[800] : indigo[300],
        gap: 2,
    }));
    const system = useContext(SystemContext);
    const [docs, setDocs] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [myFolder, setMyFolder] = useState(folder);
    const [sortOrder, setSortOrder] = useState("updated");
    const [sortOrderDirection, setSortOrderDirection] = useState(-1);
    const [showItemDetails, setShowItemDetails] = useState(false);
    const [userDefaultsLoaded, setUserDefaultsLoaded] = useState(false);
    const [filterBookmarked, setFilterBookmarked] = useState(false);
    const [filterStarred, setFilterStarred] = useState(false);

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
        sortDocs(sortOrder, sortOrderDirection);
    }, [docs]);

    useEffect(()=>{
        saveUserDefaults();
    }, [sortOrder, sortOrderDirection]);

    useEffect(()=>{
        // onOpen
        // This hook is called when the explorer opens
        // is the equivalent of [explorerOpen] / [chatsOpen]
        setMyFolder(folder);
        if (isMobile) {
            panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }
    }, [folder]);

    useEffect(()=>{
        loadItems(sortOrder, sortOrderDirection);
        if (refresh?.reason === "showExplorer" && isMobile) {
            panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }
    }, [refresh]);

    useEffect(()=>{
        mySettingsManager.loadSettings(`${folder}_explorer_settings`,
            (data) => {
                setSortOrder(data.sortOrder);
                setSortOrderDirection(data.sortOrderDirection);
                setUserDefaultsLoaded(true);
                loadItems(data.sortOrder, data.sortOrderDirection);
            },
            (error) => {
                console.log(`load ${folder}_explorer_settings:`, error);
                loadItems(sortOrder, sortOrderDirection);
            }
        )
    }, [myFolder]);

    useEffect(()=>{
        if (docNameChanged !== "") {
            loadItems(sortOrder, sortOrderDirection);
        }
    }, [docNameChanged]);

    const loadItems = (sortOrder, sortOrderDirection) => {
        let url = `${serverUrl}/docdb/${myFolder}/documents`;
        axios.get(url, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
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

    const saveUserDefaults = () => {
        if (mySettingsManager && userDefaultsLoaded) {
            mySettingsManager.setAll({
                sortOrder: sortOrder,
                sortOrderDirection: sortOrderDirection
            }, (error) => {
                console.log(`save ${name}_explorer_settings:`, error);
            });
        }
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
        const matches = 
            doc.name.toLowerCase().includes(filterText.toLowerCase()) &&
            (!filterBookmarked || doc?.properties?.bookmarked) &&
            (!filterStarred || doc?.properties?.starred);
        return matches;
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
            loadItems(sortOrder, sortOrderDirection);
            system.info(`${name} Explorer deleted ${count} items`);
        }).catch(error => {
            system.error(`System Error deleting filtered items in ${name} Explorer`, error, url + " DELETE");
        });
    };

    const render = <Card id={{name}+"-explorer-panel"} ref={panelWindowRef}
                    sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1,
                    width: isMobile ? `${window.innerWidth}px` : null,
                    minWidth: isMobile ? `${window.innerWidth}px` : "380px",
                    maxWidth: isMobile ? `${window.innerWidth}px` : "450px"
                    }}
                    >
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
                    <Tooltip title={ filterBookmarked ? "Don't filter on bookmarked" : "Filter to show only bookmarked items"}>
                        <span>
                            <IconButton edge="start" color="inherit" aria-label={ filterBookmarked ? "Don't filter on bookmarked" : "Filter to show only bookmarked items"}
                                onClick={ () => {setFilterBookmarked(x=>!x)} }
                            >
                                {filterBookmarked ? <BookmarkIcon/> : <BookmarkBorderIcon/>}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={ filterStarred ? "Don't filter on starred" : "Show only starred items"}>
                        <span>
                            <IconButton edge="start" color="inherit" aria-label={ filterStarred ? "Don't filter on starred" : "Show only starred items"}
                                onClick={ () => {setFilterStarred(x=>!x)} }
                            >
                                {filterStarred ? <StarIcon/> : <StarBorderIcon/>}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Box ml="auto">
                        {
                            isMobile ? null :
                                <Tooltip title={windowPinnedOpen ? "Unpin window" : "Pin window open"}>
                                    <IconButton onClick={() => { setWindowPinnedOpen(state => !state); }}>
                                        {windowPinnedOpen ? <PushPinIcon /> : <PushPinOutlinedIcon/>}
                                    </IconButton>
                                </Tooltip>
                        }
                        
                        <Tooltip title="Close window">
                            <IconButton onClick={onClose}>
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
               </StyledToolbar>
       }
       <Box sx={{ width: "100%", paddingLeft: 0, paddingRight: 0, display: "flex", flexDirection: "row" }}>
           <FormControl sx={{ mt: 2, minWidth: 120 }} size="small">
               <InputLabel id={{name} + "-explorer-sort-order-label"}>Sort order</InputLabel>
               <Select
                   id={name + "-explorer-sort-order"}
                   name={name + " explorer sort order"}
                   labelId={name + "-explorer-sort-order-label"}
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
                   id={name + "-explorer-filter"}
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
       <StyledBox  sx={{ overflow: 'auto', flex: 1 }}>
           <List>
               {Object.values(filteredDocs).map(doc => (
                   <ListItem sx={{ padding: 0, pl: 1, cursor: "pointer", backgroundColor: doc.id === openItemId && itemOpen ? (darkMode ? grey[600] : grey[300]) : "transparent" }} key={doc.id}>
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
       </StyledBox>
   </Card>;
    return (render);
  }

  export default Explorer;