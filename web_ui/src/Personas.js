import { debounce } from "lodash";
import axios from 'axios';
import { useEffect, useState, useContext, Fragment, useCallback } from 'react';
import { Card, Box, IconButton, Tooltip, Typography, TextField,
    List, ListItem, ListItemText, Menu, MenuItem, Divider } from '@mui/material';
import { ClassNames } from "@emotion/react";
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import ExpandIcon from '@mui/icons-material/Expand';
import FavouriteIcon from '@mui/icons-material/Favorite';
import FavouriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

import { SystemContext } from './SystemContext';
import { StyledToolbar } from './theme';

const Personas = ({handleTogglePersonas, persona, setPersona, setFocusOnPrompt, personasOpen, 
    settingsManager, setShouldAskAgainWithPersona, serverUrl, StreamingChatResponse,
    windowPinnedOpen, setWindowPinnedOpen}) => {
    const system = useContext(SystemContext);
    const [myPersonas, setMyPersonas] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [expandedPersona, setExpandedPersona] = useState(null);
    const [timeoutId, setTimeoutId] = useState(null);
    const [personaContextMenu, setPersonaContextMenu] = useState(null);
    const [personasLoaded, setPersonasLoaded] = useState(false);
    const [loadingPersonasMessage, setLoadingPersonasMessage] = useState("Loading personas...");
    const [mySettingsManager, setMySettingsManager] = useState(settingsManager);
    const [filterByFavourite, setFilterByFavourite] = useState(false);

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById("chat-panel");
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    const setPersonasFilterFocus = () => {
        document.getElementById("personas-filter")?.focus();
    }
    useEffect(()=>{
        mySettingsManager.loadSettings("personas",
            (data) => {
                console.log("Personas loaded:", data)
                setMyPersonas(data.personas);
                const defaultPersona = Object.entries(data.personas).reduce((acc, [key, value]) => {
                    if (value.default) {
                        acc = { name: key, ...value };
                    }
                    return acc;
                }, {});
                setPersona(defaultPersona);
                setPersonasLoaded(true);
            },
            (error) => {
                console.log("get personas:", error);
                setLoadingPersonasMessage("Error loading personas: " + error);
                system.error("Error loading personas: " + error);
            }
        )
    }, []);

    useEffect(()=>{
        if (personasLoaded && personasOpen) {
            setPersonasFilterFocus();
        }
    }, [personasOpen]);

    useEffect(()=>{
        if (personasLoaded) {
            mySettingsManager.setAll({personas: myPersonas});
        }
    }, [myPersonas]);

    const handleFilterTextChange = (event) => {
        setFilterText(event.target.value);
    };

    const handleToggleFavouriteFilter = () => {
        setFilterByFavourite(!filterByFavourite);
    };
    const handlePersonaMouseEnter = (persona) => {
        const id = setTimeout(() => {
            setExpandedPersona(persona);
        }, 1000);
        setTimeoutId(id);
    };

    const handlePersonaMouseLeave = () => {
        clearTimeout(timeoutId);
        setExpandedPersona(null);
    };

    const handleExpandCollapse = () => {
        let newState = !expanded;
        setExpanded(newState);
        setFocusOnPrompt(true);
    };

    const handlePersonaContextMenu = (event, persona) => {
        event.preventDefault();
        setPersonaContextMenu(
          personaContextMenu === null
            ? {
                mouseX: event.clientX + 2,
                mouseY: event.clientY - 6,
                persona: persona,
              }
            : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
              // Other native context menus might behave differently.
              // With this behavior we prevent contextmenu from the backdrop re-locating existing context menus.
              null,
        );
    };

    const handlePersonaContextMenuClose = (event) => {
        setPersonaContextMenu(null);
        event.stopPropagation();
    };

    const handleSelectPersona = (persona) => {
        console.log("Select persona", persona.name);
        setPersona(persona);
        setFocusOnPrompt(true);
    };

    const handleSetAsDefault = (event) => {
        event.stopPropagation();
        console.log("Set default persona:", personaContextMenu.persona.name);
        // set all the other personas to not default
        const updatedPersonas = Object.entries(myPersonas).reduce((acc, [key, value]) => {
          if (key !== personaContextMenu.persona.name) {
            acc[key] = { ...value, default: false };
          } else {
            acc[key] = { ...value, default: true };
          }
          return acc;
        }, {});
        setMyPersonas(updatedPersonas);
        setPersonaContextMenu(null);
      };

    const handleAskAgainWithPersona = (event) => {
        event.stopPropagation();
        console.log("Ask again with persona", personaContextMenu.persona);
        setShouldAskAgainWithPersona({persona: personaContextMenu.persona, timestamp: Date.now()});
        setPersonaContextMenu(null);
    };

    const handleToggleFavourite = (persona) => {
        console.log("Toggle favourite persona", persona.name);
        setMyPersonas((prevPersonas) => ({
          ...prevPersonas,
          [persona.name]: {
            ...prevPersonas[persona.name],
            favourite: !persona.favourite,
          },
        }));
    };

    const handleFilterKeyDown = (event) => {
        if(event.key === 'Escape') {
            setFilterText("");
            event.preventDefault();
        }
    }
  
    const filteredPersonas = Object.entries(myPersonas).reduce((acc, [key, value]) => {
        const nameMatch = key.toLowerCase().includes(filterText.toLowerCase());
        const descriptionMatch = value?.description && value.description.toLowerCase().includes(filterText.toLowerCase());
        const promptMatch = value.system_prompt.toLowerCase().includes(filterText.toLowerCase());
        const tagsMatch = value?.tags && value.tags.includes(filterText.toLowerCase());
        if ((nameMatch || descriptionMatch || promptMatch || tagsMatch) && (!filterByFavourite || value.favourite)) {
          const selected = persona && persona.name === key;
          acc[key] = { name: key, ...value, selected };
        }
        return acc;
      }, {});

    const loadingRender = <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px",
    flex:1, minWidth: "350px", maxWidth: "450px"}}>
        <Typography>{loadingPersonasMessage}</Typography>
    </Card>

    const loadedRender =
        <List sx={{ overflowY: "auto" }}>
        {Object.values(filteredPersonas).map(persona => (
            <ListItem onContextMenu={(event) => handlePersonaContextMenu(event, persona)}
                sx={{ padding: 1, cursor: "pointer" }}
                key={persona.name}
                onClick={() => { handleSelectPersona(persona); }}
                onMouseEnter={() => { handlePersonaMouseEnter(persona.name); }}
                onMouseLeave={handlePersonaMouseLeave}
                >
                        <Card
                            sx={{ padding:2, paddingTop: 1, paddingBottom:1, 
                                backgroundColor: persona.selected ? "lightgrey" : "inherit", width: "100%" }}
                        >
                            <ListItemText
                                primary={
                                    <Typography sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>
                                            {persona.name.charAt(0).toUpperCase() + persona.name.slice(1)}
                                            {persona.default && <Typography sx={{ ml:2 }} variant="caption">(default)</Typography>}
                                        </span>
                                            {persona.favourite ? (
                                                <FavouriteIcon
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleToggleFavourite(persona);
                                                    }}
                                                />
                                                ) : (
                                                    <FavouriteBorderIcon
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleToggleFavourite(persona);
                                                    }}
                                                    />
                                                )
                                            }
                                    </Typography>
                                }
                                secondary={
                                    <Fragment>
                                        <Typography>{persona.description}</Typography>
                                        {
                                            expanded || expandedPersona === persona.name
                                            ? <Typography mt={1}>{persona.system_prompt}</Typography>
                                            : null
                                        } 
                                    </Fragment>
                                }
                            />
                        </Card>
                    <Menu
                        open={personaContextMenu !== null}
                        onClose={ (event) => { handlePersonaContextMenuClose(event); }}
                        anchorReference="anchorPosition"
                        anchorPosition={
                        personaContextMenu !== null
                            ? { 
                                top: personaContextMenu.mouseY,
                                left: personaContextMenu.mouseX,
                                persona: persona
                                }
                            : undefined
                        }
                    >
                        <MenuItem onClick={(event) => handleAskAgainWithPersona(event)}
                            disabled={StreamingChatResponse === ""}>Ask again with this persona</MenuItem>
                        <MenuItem onClick={(event) => handleSetAsDefault(event)}>Set as default persona</MenuItem>
                    </Menu>
            </ListItem>
        ))}
        </List>

    const render = <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px",
    flex:1, minWidth: "350px", maxWidth: "450px"}}>
        <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
            <PersonIcon/>
            <Typography sx={{mr:2}}>Personas</Typography>
            <Box ml="auto">
                <Tooltip title={ expanded ? "Hide details" : "Show details" }>
                    <IconButton onClick={handleExpandCollapse} color="inherit" aria-label="expand">
                        <ExpandIcon/>
                    </IconButton>
                </Tooltip>
                <Tooltip title={windowPinnedOpen ? "Unpin window" : "Pin window open"}>
                    <IconButton onClick={() => { setWindowPinnedOpen(state => !state); }}>
                        {windowPinnedOpen ? <PushPinIcon /> : <PushPinOutlinedIcon/>}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Close window">
                    <IconButton onClick={handleTogglePersonas}>
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </StyledToolbar>
        {personasLoaded
        ?
            <Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
                <TextField
                    id="personas-filter"
                    label="Filter"
                    value={filterText}
                    autoComplete='off'
                    onChange={handleFilterTextChange}
                    onKeyDown={handleFilterKeyDown}
                    sx={{ mt: 2, mb: 3, flex: 1 }}
                />
                <Box ml="auto">{/* spacer */}
                    <Tooltip title={filterByFavourite ? "Turn off filter by favourite" : "Filter by favourite"}>
                        <IconButton onClick={handleToggleFavouriteFilter}>
                            {filterByFavourite ? <FavouriteIcon /> : <FavouriteBorderIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        :
            null
        }
        {personasLoaded ? loadedRender : loadingRender}
    </Card>

    return ( personasOpen ? render : null )
  }

  export default Personas;