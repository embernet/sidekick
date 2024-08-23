import { debounce } from "lodash";
import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Card, CardActionArea, CardContent, Box, Divider, Toolbar, IconButton, Typography, TextField, List, ListItem, ListItemText,
    Tooltip, FormControl, InputLabel, Select, MenuItem, Stack,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
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
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import LocalLibraryOutlinedIcon from '@mui/icons-material/LocalLibraryOutlined';
import ShareIcon from '@mui/icons-material/Share';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewHeadlineOutlinedIcon from '@mui/icons-material/ViewHeadlineOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

import { indigo, grey } from '@mui/material/colors';
import { StyledBox } from "./theme";

import axios from 'axios';

import { SystemContext } from './SystemContext';
import SettingsManager from './SettingsManager';
import { ShareOutlined } from "@mui/icons-material";
import { Form } from "react-router-dom";

const Explorer = ({onClose, windowPinnedOpen, setWindowPinnedOpen, name, icon, folder, openItemId, setLoadDoc,
     docNameChanged, refresh, setRefresh, itemOpen, hidePrimaryToolbar, deleteEnabled, darkMode,
    setItemOpen, // to be able to close the item editor if the item is deleted
    serverUrl, token, setToken, isMobile, maxWidth="600px"
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
    const [mySettings, setMySettings] = useState({
        showFilters: true,
        view: "list",
        sortOrder: "updated",
        sortOrderDirection: -1,
        scope: "mine",
        showItemDetails: false,
        filterBookmarked: false,
        filterStarred: false,
        filterInAiLibrary: false,
        filterSharedByMe: false,
        filterSharedByOther: false
    });
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [docsToDelete, setDocsToDelete] = useState([]);

    const [width, setWidth] = useState(0);
    const [myMaxWidth, setMyMaxWidth] = useState(maxWidth);
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
        sortDocs(mySettings.sortOrder, mySettings.sortOrderDirection);
    }, [docs]);

    const updateSetting = (key, value) => {
        setMySettings((prevState) => ({
            ...prevState,
            [key]: value,
        }));
        saveUserDefaults({ ...mySettings, [key]: value });
    };

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
        loadItems();
        if (refresh?.reason === "showExplorer" && isMobile) {
            panelWindowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }
    }, [refresh, mySettings.scope]);

    useEffect(()=>{
        mySettingsManager.loadSettings(`${folder}_explorer_settings`,
            (loadedSettings) => {
                setMySettings({ ...mySettings, ...loadedSettings});
                loadItems(loadedSettings.sortOrder, loadedSettings.sortOrderDirection);
            },
            (error) => {
                console.log(`load ${folder}_explorer_settings:`, error);
                loadItems();
            }
        )
    }, [myFolder]);

    useEffect(()=>{
        if (docNameChanged !== "") {
            loadItems();
        }
    }, [docNameChanged]);

    const loadItems = (sortOrder=mySettings.sortOrder, sortOrderDirection=mySettings.sortOrderDirection) => {
        let url = `${serverUrl}/docdb/${myFolder}/${mySettings.scope}/documents`;
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

    const clearFilters = () => {
        setFilterText("");
        const newSettings = ({
            ...mySettings,
            filterText: "",
            filterBookmarked: false,
            filterStarred: false,
            filterInAiLibrary: false,
            filterSharedByMe: false,
            filterSharedByOther: false
        });
        setMySettings(newSettings);
        saveUserDefaults(newSettings);
    }

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
            sortedList = list.sort((a, b) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                return (nameA > nameB) ? sortDirection : (nameA < nameB) ? sortDirection * -1 : 0;
            });
        } else if (sortBy === "created") {
            sortedList = list.sort((a, b) => (a.created_date > b.created_date) ? sortDirection : (a.created_date < b.created_date) ? sortDirection * -1 : 0);
        } else if (sortBy === "updated") {
            sortedList = list.sort((a, b) => (a.updated_date > b.updated_date) ? sortDirection : (a.updated_date < b.updated_date) ? sortDirection * -1 : 0);
        } else if (sortBy === "size") {
            sortedList = list.sort((a, b) => (a.size - b.size) * sortDirection);
        }
        return sortedList;
    }

    const sortDocs = (sortBy, sortDirection) => {
        let sortedDocs = sortedList(docs, sortBy, sortDirection);
        setDocs(sortedDocs);
    }

    const saveUserDefaults = (settings) => {
        if (mySettingsManager) {
            mySettingsManager.setAll(settings, (error) => {
                console.log(`save ${name}_explorer_settings:`, error);
            });
        }
    }

    const handleSortOrderChange = (value) => {
        updateSetting("sortOrder", value);
        sortDocs(value, mySettings.sortOrderDirection);
    }

    const handleScopeChange = (event) => {
        updateSetting("scope", event.target.value);
    };

    const handleToggleSortOrderDirection = () => {
        const newSortOrderDirection = mySettings.sortOrderDirection * -1;
        updateSetting("sortOrderDirection", newSortOrderDirection);
        sortDocs(mySettings.sortOrder, newSortOrderDirection);
    }

    const handleLoadDoc = (id) => {
        console.log("handleLoadDoc", id);
        setLoadDoc({ "id": id, "timestamp": Date.now() });
    };

    const filteredDocs = docs.filter(doc => {
        const matches = 
            doc.name.toLowerCase().includes(filterText.toLowerCase()) &&
            (!mySettings.filterBookmarked || doc?.properties?.bookmarked) &&
            (!mySettings.filterStarred || doc?.properties?.starred) &&
            (!mySettings.filterInAiLibrary || doc?.properties?.inAILibrary) &&
            (!mySettings.filterSharedByMe || (doc?.visibility !== "private" && doc.user_id === system.user.id)) &&
            (!mySettings.filterSharedByOther || (doc?.visibility !== "private" && doc.user_id !== system.user.id));
        return matches;
    });

    const handleDeleteFilteredItems = () => {
        setDocsToDelete(filteredDocs.filter(doc => doc.user_id === system.user.id));
    };

    useEffect(() => {
        if (docsToDelete.length === 0) {
            return;
        }
        setOpenDeleteDialog(true);
    }, [docsToDelete]);

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
    };    
    
    const deleteItems = (docsToDelete) => {
        setOpenDeleteDialog(false);
        console.log("handleDeleteFilteredItems", itemOpen);
        let count = 0;
        let url = `${serverUrl}/docdb/${myFolder}/documents/`;
        const deletePromises = docsToDelete.map(doc => {
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

    const confirmDeleteDialog =
        <Dialog
            open={openDeleteDialog}
            onClose={handleCancelDelete}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
            <DialogContent>
                { (filteredDocs.length === docsToDelete.length) ? null :
                    <DialogContentText id="alert-dialog-warning" sx={{ mb:2 }}>
                            Warning: {filteredDocs.length - docsToDelete.length} of the {filteredDocs.length} selected documents are not yours,
                            so cannot be deleted by you. If you continue, only your selected items will be deleted.
                    </DialogContentText>
                }
                <DialogContentText id="alert-dialog-confirmation">
                    Are you sure you want to delete {docsToDelete.length} items?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancelDelete} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => { deleteItems(docsToDelete); }} color="primary" autoFocus>
                    OK
                </Button>
            </DialogActions>
        </Dialog>;

    const docIcons = (doc) => {
        return (
            <Stack direction="row">
                {
                    doc?.properties?.bookmarked ?
                        <Tooltip title="You bookmarked this">
                            <BookmarkIcon/>
                        </Tooltip>
                    : null
                }
                {
                    doc?.properties?.starred ?
                        <Tooltip title="You starred this">
                            <StarIcon/>
                        </Tooltip>
                    : null
                }
                {
                    doc?.visibility !== "private" ? 
                        doc.user_id !== system.user.id ?
                            <Tooltip title="Shared by someone else">
                                <ShareIcon sx={{ color:"orange" }}/>
                            </Tooltip>
                        :
                        <Tooltip title="Shared by you">
                            <ShareIcon sx={{ color:"purple" }}/>
                        </Tooltip>
                    : null
                }
                {
                    doc?.properties?.inAILibrary ?
                        <Tooltip title="You added this to your AI library">
                            <LocalLibraryIcon/>
                        </Tooltip>
                    : null
                }
            </Stack>
        );
    }

    const render = <Card id={{name}+"-explorer-panel"} ref={panelWindowRef}
                    sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1,
                    width: isMobile ? `${window.innerWidth}px` : "600px",
                    minWidth: isMobile ? `${window.innerWidth}px` : "380px",
                    maxWidth: isMobile ? `${window.innerWidth}px` : maxWidth,
                    }}
                    >
        {confirmDeleteDialog}
        {
           hidePrimaryToolbar ? null 
           :
               <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
                    {icon}
                    <Typography sx={{mr:2}}>{name}</Typography>
                    <Box ml="auto">
                        {
                            isMobile ? null :
                                <Tooltip title={windowPinnedOpen ? "Unpin window" : "Pin window open"}>
                                    <span>
                                        <IconButton edge="end" onClick={() => { setWindowPinnedOpen(state => !state); }}>
                                            {windowPinnedOpen ? <PushPinIcon /> : <PushPinOutlinedIcon/>}
                                        </IconButton>
                                    </span>
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
        <Box sx={{ width: "100%", paddingLeft: 0, paddingRight: 0, display: "flex", flexDirection: "column" }}>
            <FormControl sx={{ ml:1, mt: 2, gap: 1, flexDirection: "row", width: "100%" }} size="small">
                <Tooltip title={mySettings.showItemDetails ? "Hide details" : "Show details"}>
                    <IconButton onClick={() => { updateSetting("showItemDetails", !mySettings.showItemDetails); }}
                        sx={{
                            backgroundColor: mySettings.showItemDetails ? 'lightgrey' : 'transparent'
                        }}>
                        <ListAltIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={mySettings.view === "list" ? "View is set to list" : "View items as list"}>
                    <IconButton onClick={() => { updateSetting("view", "list"); }}
                        sx={{
                            backgroundColor: mySettings.view === "list" ? 'lightgrey' : 'transparent'
                        }}>
                        <ViewHeadlineOutlinedIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={mySettings.view === "cards" ? "View is set to cards" : "View items as cards"}>
                    <IconButton onClick={() => { updateSetting("view", "cards"); }}
                        sx={{
                            backgroundColor: mySettings.view === "cards" ? 'lightgrey' : 'transparent'
                        }}>
                        <GridViewOutlinedIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={mySettings.showFilters ? "Hide filters" : "Show filters"}>
                    <IconButton onClick={() => { updateSetting("showFilters", !mySettings.showFilters); }}
                        sx={{
                            backgroundColor: mySettings.showFilters ? 'lightgrey' : 'transparent'
                        }}>
                        <FilterAltOutlinedIcon />
                    </IconButton>
                </Tooltip>
            </FormControl>
            {
                mySettings.showFilters ?
                    <Box>
                        <Box sx={{ display: "flex", flexDirection: "row", mt: 2, width: "100%" }}>
                            <FormControl sx={{ minWidth: 120 }} size="small" >
                                <InputLabel id={name + "-explorer-scope-label"}>Scope</InputLabel>
                                <Select
                                    id={name + "-explorer-scope"} name={"Scope"}
                                    labelId={name + "-explorer-scope-label"}
                                    value={mySettings.scope} label="Scope"
                                    onChange={handleScopeChange}
                                    >
                                            <MenuItem value="mine">Mine</MenuItem>
                                            <MenuItem value="my-shared">My shared</MenuItem>
                                            <MenuItem value="my-private">My private</MenuItem>
                                            <MenuItem value="all-shared">All shared</MenuItem>
                                            <MenuItem value="others-shared">Others' shared</MenuItem>
                                            <MenuItem value="all">All</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1, width: "100%" }} size="small">
                                <Tooltip title="Refresh explorer, e.g. to show new items shared by others since last refresh.">
                                    <IconButton onClick={() => { loadItems() }}>
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                                <TextField
                                    id={name + "-explorer-filter"}
                                    sx={{ flexGrow: 1 }}
                                    autoComplete='off' label="Filter"
                                    value={filterText}
                                    onChange={handleFilterTextChange}
                                    onKeyDown={handleFilterKeyDown}
                                    size="small"
                                />
                                {
                                    deleteEnabled ?
                                        <Tooltip title={ filterText.length === 0 
                                            ? "Enter filter text to enable bulk delete" 
                                            : "Bulk delete all notes matching filter" 
                                        }>
                                            <span>
                                                <IconButton color="inherit" aria-label="delete notes matching filter"
                                                    onClick={handleDeleteFilteredItems}
                                                    disabled={filterText.length === 0}
                                                >
                                                    <DeleteIcon/>
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    : null
                                }
                            </FormControl>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row" }}>
                            <FormControl sx={{ mt: 2, minWidth: 120 }} size="small">
                                <InputLabel id={{name} + "-explorer-sort-order-label"}>Sort order</InputLabel>
                                <Select
                                    id={name + "-explorer-sort-order"}
                                    name={name + " explorer sort order"}
                                    labelId={name + "-explorer-sort-order-label"}
                                    value={mySettings.sortOrder}
                                    label="Sort order"
                                    onChange={(event) => { handleSortOrderChange(event.target.value); }}
                                    >
                                            <MenuItem value="name">Name</MenuItem>
                                            <MenuItem value="created">Created</MenuItem>
                                            <MenuItem value="updated">Updated</MenuItem>
                                            <MenuItem value="size">Size</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl sx={{ mt: 2, flexDirection: "row", width: "100%" }} size="small">
                                <Tooltip title="Change sort order">
                                    <IconButton onClick={handleToggleSortOrderDirection}>
                                        { mySettings.sortOrderDirection === 1 ? <ArrowUpwardIcon/> : <ArrowDownwardIcon/> }
                                    </IconButton>
                                </Tooltip>
                                <Box sx={{ 
                                    display: 'flex', flexDirection: 'row', width: '100%',
                                    justifyContent: 'space-between', alignItems: 'center', 
                                    border: '1px solid', borderColor: 'grey.400', borderRadius: 1, 
                                    p: 0, flexGrow: 1

                                }}>
                                    <Box width={8} />
                                    <Tooltip title={ mySettings.filterBookmarked ? "Don't filter on bookmarked" : "Filter to show only bookmarked items"}>
                                        <span>
                                            <IconButton edge="start" color="inherit"
                                                aria-label={ mySettings.filterBookmarked ? "Don't filter on bookmarked" : "Filter to show only bookmarked items"}
                                                onClick={ () => { updateSetting("filterBookmarked", !mySettings.filterBookmarked); } }
                                            >
                                                {mySettings.filterBookmarked ? <BookmarkIcon/> : <BookmarkBorderIcon/>}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={ mySettings.filterStarred ? "Don't filter on starred" : "Show only starred items"}>
                                        <span>
                                            <IconButton edge="start" color="inherit"
                                                aria-label={ mySettings.filterStarred ? "Don't filter on starred" : "Show only starred items"}
                                                onClick={ () => { updateSetting("filterStarred", !mySettings.filterStarred); } }
                                            >
                                                {mySettings.filterStarred ? <StarIcon/> : <StarBorderIcon/>}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={ mySettings.filterInAiLibrary ? "Don't filter on whether in AI Library" : "Filter to show items in AI Library"}>
                                        <span>
                                            <IconButton edge="start" color="inherit" aria-label={ mySettings.filterInAiLibrary ? "Don't filter on whether in AI Library" : "Filter to show items in AI Library"}
                                                onClick={ () => { updateSetting("filterInAiLibrary", !mySettings.filterInAiLibrary); } }
                                            >
                                                {mySettings.filterInAiLibrary ? <LocalLibraryIcon/> : <LocalLibraryOutlinedIcon/>}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={ mySettings.filterSharedByMe ? "Don't filter on whether it's shared by me" : "Filter to show items shared by me"}>
                                        <span>
                                            <IconButton edge="start" color="inherit" aria-label={ mySettings.filterSharedByMe ? "Don't filter on whether it's shared by me" : "Filter to show items shared by me"}
                                                onClick={ () => { updateSetting("filterSharedByMe", !mySettings.filterSharedByMe); } }
                                            >
                                                {mySettings.filterSharedByMe ? <ShareIcon sx={{ color: "purple" }}/> : <ShareOutlined/>}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={ mySettings.filterSharedByOther ? "Don't filter on whether it's shared by others" : "Filter to show items shared by others"}>
                                        <span>
                                            <IconButton edge="start" color="inherit" aria-label={ mySettings.filterSharedByOther ? "Don't filter on whether it's shared by others" : "Filter to show items shared by others"}
                                                onClick={ () => { updateSetting("filterSharedByOther", !mySettings.filterSharedByOther); } }
                                            >
                                                {mySettings.filterSharedByOther ? <ShareIcon sx={{ color:"orange" }}/> : <ShareOutlined sx={{ color:"orange" }}/>}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Box width={8} />
                                </Box>
                                <Tooltip title="Clear filters">
                                    <IconButton color="inherit"
                                        onClick={(event) => {
                                            event.stopPropagation(); clearFilters();
                                        }}
                                        >
                                        { (mySettings.filterSharedByOther || mySettings.filterBookmarked || mySettings.filterInAiLibrary ||
                                            mySettings.filterSharedByMe || mySettings.filterStarred || filterText.length > 0
                                        ) ? <HighlightOffIcon/> : <HighlightOffIcon sx={{ color:"grey" }}/>}
                                    </IconButton>
                                </Tooltip>
                            </FormControl>
                        </Box>
                    </Box>
                : null
            }
        </Box>
        <Divider sx={{ my: 2 }} />
        <StyledBox  sx={{ overflow: 'auto', flex: 1 }}>
            {
                mySettings.view === "cards" ?
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', overflow: 'auto', width: '100%' }}>
                        {Object.values(filteredDocs).map(doc => (
                            <Card sx={{ margin: '8px', flex: mySettings.showItemDetails ? '1 0 200px' : '1 0 100px' }} key={doc.id}>
                                <CardActionArea sx={{ height: '100%' }} onClick={() => { handleLoadDoc(doc.id); }}>
                                    <CardContent>
                                        <Typography variant="h7" component="div" sx={{ fontWeight: (mySettings.showItemDetails ? 'bold' : 'normal') }}>
                                            {doc.name}
                                        </Typography>
                                        {mySettings.showItemDetails && (
                                            <Box
                                                sx={{
                                                    fontSize: '12px',
                                                    color: 'text.secondary',
                                                    whiteSpace: 'pre-wrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {(doc.user_id !== system.user.id) ? `Shared by: ${doc.user_name}\n` : "Owned by you\n"}
                                                {`Created: ${doc.created_date.substring(0, 19)}\n${doc.updated_date ? 'Updated: ' + doc.updated_date.substring(0, 19) : ''}`}
                                                {`\nSize: ${doc.size} bytes`}
                                                {docIcons(doc)}
                                            </Box>
                                        )}
                                    </CardContent>
                                    </CardActionArea>
                            </Card>
                        ))}
                    </Box>
                :
                    <List>
                        {Object.values(filteredDocs).map(doc => (
                            <ListItem sx={{ padding: 0, pl: 1, cursor: "pointer", backgroundColor: doc.id === openItemId && itemOpen ? (darkMode ? grey[600] : grey[300]) : "transparent" }} key={doc.id}>
                                    <ListItemText primary={doc.name}
                                        primaryTypographyProps={{ typography: 'body2', fontWeight: (mySettings.showItemDetails ? 'bold' : 'normal') }}
                                        secondary={
                                            mySettings.showItemDetails ? (
                                            <Typography
                                            sx={{
                                                fontSize: '12px',
                                                color: 'text.secondary',
                                                whiteSpace: 'pre-wrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                            >
                                            {(doc.user_id !== system.user.id) && `Shared by: ${doc.user_name}\n`}
                                            {`Created: ${doc.created_date.substring(0, 19)}\n${doc.updated_date ? 'Updated: ' + doc.updated_date.substring(0, 19) : ''}`}
                                            {`\nSize: ${doc.size} bytes`}
                                            { mySettings.showItemDetails ? docIcons(doc) : null }
                                            </Typography>
                                        ) : null
                                        }                            
                                        selected={openItemId === doc.id}
                                        onClick={() => { handleLoadDoc(doc.id); }}
                                        sx={{ fontSize: '14px' }}
                                    />
                            </ListItem>
                        ))}
                    </List>
                }
       </StyledBox>
   </Card>;
    return (render);
  }

  export default Explorer;