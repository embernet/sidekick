import { debounce } from "lodash";
import { useEffect, useState, useContext, useCallback } from 'react';
import { Card, Box, IconButton, Typography, Collapse, Tooltip,
     List, ListItem, ListItemText, 
     Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ClassNames } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import { StyledToolbar } from './theme';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

import { SystemContext } from './SystemContext';
import Explorer from './Explorer';

const PromptEngineer = ({handleTogglePromptEngineer, setNewPromptPart, setNewPromptTemplate, openPromptTemplateId,
    promptTemplateNameChanged, refreshPromptTemplateExplorer, setRefreshPromptTemplateExplorer,
    setPromptTemplateOpen, promptTemplateOpen, settingsManager, serverUrl, token, setToken,
    windowPinnedOpen, setWindowPinnedOpen}) => {
    const system = useContext(SystemContext);
    const [promptParts, setPromptParts] = useState({});
    const [promptPartsLoaded, setPromptPartsLoaded] = useState(false);
    const [loadingPromptPartsMessage, setLoadingPromptPartsMessage] = useState("Loading prompt parts...");
    const [mySettingsManager, setMySettingsManager] = useState(settingsManager);

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

    const [openSections, setOpenSections] = useState(() => {
        let newState = {};
        Object.keys(promptParts).forEach((key) => {
          newState[key] = true;
        });
        return newState;
    });


    useEffect(()=>{
        mySettingsManager.loadSettings("prompt_engineer",
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

    const handleSectionClick = (section) => {
        setOpenSections((prevState) => ({
          ...prevState,
          [section]: !prevState[section],
        }));
    };
    
    const handleItemClick = (text) => {
        setNewPromptPart({text: text, timestamp: Date.now()});
    };

    const loadingRender = <Card sx={{display:"flex", flexDirection:"column", padding:"6px",
        flex:1, minWidth: "380px", maxWidth: "450px"}}>
            <Typography>{loadingPromptPartsMessage}</Typography>
        </Card>

    const promptFragmentsRender = 
        <Box sx={{ flexGrow: 1, overflow: 'auto', padding: '6px', }}>
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

    const loadedRender = 
        <Box sx={{display:"flex", flexDirection:"column", height: "100%", overflow: "auto" }}>
            <Accordion defaultExpanded>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="prompt-fragments-content"
                id="prompt-fragments-header"
                >
                    <Typography>Prompt Fragments</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {promptFragmentsRender}
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="prompt-templates-content"
                id="prompt-templtes-header"
                >
                    <Typography>Prompt Templates</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Explorer sx={{flexGrow:1}}
                        handleToggleExplorer={handleTogglePromptEngineer}
                        name="Prompt Templates"
                        icon={<BuildIcon/>}
                        folder="prompt_templates"
                        openItemId={openPromptTemplateId}
                        setLoadDoc={setNewPromptTemplate}
                        docNameChanged={promptTemplateNameChanged}
                        refresh={refreshPromptTemplateExplorer}
                        setRefresh={setRefreshPromptTemplateExplorer}
                        itemOpen={promptTemplateOpen}
                        setItemOpen={setPromptTemplateOpen}
                        windowPinnedOpen = {windowPinnedOpen}
                        setWindowPinnedOpen = {setWindowPinnedOpen}
                        serverUrl={serverUrl} token={token} setToken={setToken}
                        hidePrimaryToolbar={true}
                        />
                </AccordionDetails>
            </Accordion>
        </Box>

    const render = <Card id="prompt-engineer-panel" sx={{display:"flex", flexDirection:"column", padding:"6px", margin: "6px",
        flex:1, minWidth: "380px", maxWidth: "450px"}}>
        <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
            <BuildIcon/>
            <Typography sx={{mr:2}}>Prompt Engineer</Typography>
            <Box ml="auto">
                <Tooltip title={windowPinnedOpen ? "Unpin window" : "Pin window open"}>
                    <IconButton onClick={() => { setWindowPinnedOpen(state => !state); }}>
                        {windowPinnedOpen ? <PushPinIcon /> : <PushPinOutlinedIcon/>}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Close window">
                    <IconButton onClick={handleTogglePromptEngineer}>
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </StyledToolbar>
            <Box sx={{ height: "100%", overflow: 'hidden' }}>
                {promptPartsLoaded ? loadedRender : loadingRender}
            </Box>
    </Card>

    return (render);
  }

  export default PromptEngineer;