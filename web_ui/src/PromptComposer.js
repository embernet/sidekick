import { useEffect, useState, useContext } from 'react';
import { Card, Box, IconButton, Typography, Collapse, Tooltip, List, ListItem, ListItemText } from '@mui/material';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import { StyledToolbar } from './theme';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import ExpandIcon from '@mui/icons-material/Expand';
import BuildIcon from '@mui/icons-material/Build';

import { SystemContext } from './SystemContext';

const PromptComposer = ({handleTogglePromptComposer, setNewPromptPart, settingsManager, serverUrl}) => {
    const system = useContext(SystemContext);
    const [expanded, setExpanded] = useState(true);
    const [promptParts, setPromptParts] = useState({});
    const [promptPartsLoaded, setPromptPartsLoaded] = useState(false);
    const [loadingPromptPartsMessage, setLoadingPromptPartsMessage] = useState("Loading prompt parts...");
    const [mySettingsManager, setMySettingsManager] = useState(settingsManager);
    const [openSections, setOpenSections] = useState(() => {
        let newState = {};
        Object.keys(promptParts).forEach((key) => {
          newState[key] = true;
        });
        return newState;
    });


    useEffect(()=>{
        mySettingsManager.loadSettings("prompt_composer",
            (data) => {
                setPromptParts(data.prompt_parts);
                setPromptPartsLoaded(true);
            },
            (error) => {
                console.log("get prompt_parts:", error);
                setLoadingPromptPartsMessage("Error loading prompt parts: " + error);
            }
        );
    }, []);

    const handleExpandCollapse = () => {
        let newState = !expanded;
        setExpanded(newState);
    };

    const handleSectionClick = (section) => {
        setOpenSections((prevState) => ({
          ...prevState,
          [section]: !prevState[section],
        }));
    };

    useEffect(() => {
        let openclose = false;
        if (expanded) {
            openclose = true
        }
        let newState = {};
        Object.keys(openSections).forEach((key) => {
            newState[key] = openclose;
        });
        setOpenSections(newState);
    }, [expanded]);
    
    const handleItemClick = (text) => {
        setNewPromptPart(text);
    };

    const loadingRender = <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px",
        flex:1, minWidth: "300px", maxWidth: "400px"}}>
            <Typography>{loadingPromptPartsMessage}</Typography>
        </Card>

    const loadedRender = 
    <Box sx={{ flexGrow: 1, overflow: 'auto', padding: '6px', marginBottom: '16px'}}>
        <List dense>
            {Object.entries(promptParts).map(([section, items]) => (
                <div key={section}>
                <ListItem onClick={() => handleSectionClick(section)}>
                    <ListItemText primary={section} />
                    {openSections[section] ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={openSections[section]} timeout="auto" unmountOnExit>
                    <List dense component="div" disablePadding>
                    {items.map((text) => (
                        <ListItem key={text} sx={{ pl:4 }} onClick={() => handleItemClick(text)}>
                            <ListItemText primary={text} />
                        </ListItem>
                    ))}
                    </List>
                </Collapse>
                </div>
            ))}
        </List>
    </Box>

const render = <Card sx={{display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth: "300px", maxWidth: "400px"}}>
        <StyledToolbar className={ClassNames.toolbar}>
            <BuildIcon/>
            <Typography>Composer</Typography>
            <Box ml="auto">
                <Tooltip title={ expanded ? "Hide descriptions" : "Show descriptions" }>
                    <IconButton onClick={handleExpandCollapse} color="inherit" aria-label="expand">
                        <ExpandIcon/>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Close window">
                    <IconButton onClick={handleTogglePromptComposer}>
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </StyledToolbar>
        {promptPartsLoaded ? loadedRender : loadingRender}
    </Card>

    return (render);
  }

  export default PromptComposer;