import React, { useState, useEffect, useRef, useContext } from 'react';
import { Box, Toolbar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Switch, FormControlLabel, TextField, Typography, Tooltip } from '@mui/material';
import axios from 'axios';
import { SystemContext } from './SystemContext';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import ShareButton from './ShareButton';

import PromptTemplateContentHandler from './PromptTemplateContentHandler';
import SharedDocPanel from './SharedDocPanel';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import LocalLibraryOutlinedIcon from '@mui/icons-material/LocalLibraryOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

import { green, lightBlue, grey } from '@mui/material/colors';

/**
 * DocEditor Component
 * 
 * @param {Object} props - The properties object.
 * @param {string} props.folder - The folder where the document is located in the /docdb/folder/documents/id path, e.g. "notes".
 * @param {string} props.type - The type of the document, for UI use, e.g. "Note".
 * @param {string} props.serverUrl - The URL of the server to fetch and save documents.
 * @param {string} props.token - The authentication token for API requests.
 * @param {function} props.setToken - Function to update the authentication token.
 * @param {boolean} props.loadDoc - to trigger document loading of doc with id loadDoc.id.
 * @param {function} props.setLoadDoc - Function to update the loadDoc flag when creating a new doc.
 * @param {function} props.onChange - Callback function to handle changes in the document.
 * @param {function} props.applyDoc - Function to apply the doc to the provided user, e.g. set the chat prompt to a prompt template value.
 * @param {function} props.onClose - Callback function to handle closing the editor.
 * @param {boolean} props.darkMode - Flag to indicate if dark mode is enabled.
 * @param {boolean} props.debugMode - Flag to enable debug logging.
 */
const DocEditor = ({ folder, type, serverUrl, token, setToken,
    loadDoc, setLoadDoc, onChange, applyDoc, onClose, darkMode, debugMode }) => {
    const system = useContext(SystemContext);

    const [id, setId] = useState('')
    const [myFolder, setMyFolder] = useState(folder);
    const [docData, setDocData] = useState(null);
    const [docEditorOpen, setDocEditorOpen] = useState(false);
    const [shareData, setShareData] = useState({});
    const [documentOwner, setDocumentOwner] = useState('');
    const [documentOwnerName, setDocumentOwnerName] = useState('');
    const [tags, setTags] = useState([]);
    const docNameRef = useRef(null);
    const [name, setName] = useState('');
    const [bookmarked, setBookmarked] = useState(false);
    const [starred, setStarred] = useState(false);
    const [inAILibrary, setInAILibrary] = useState(false);
    const [favourite, setFavourite] = useState(false);
    const [visibility, setVisibility] = useState('private');
    const [content, setContent] = useState({});
    const isLoading = useRef(false);
    const [isEdited, setIsEdited] = useState(false);
    const [shareStatusChanged, setShareStatusChanged] = useState(false);
    const [contentHandlerControls, setContentHandlerControls] = useState(null);
    const [showShareData, setShowShareData] = useState(false);

    const StyledToolbar = styled(Toolbar)(({ theme }) => ({
        backgroundColor: darkMode ? grey[800] : grey[300],
        marginRight: theme.spacing(2),
    }));    

    const isEditable = () => {
        let editable = false;
        if (docData?.metadata && system.user.id === docData.metadata?.user_id) {
            editable = true;
        }
        return editable;
    }

    const contentHandler = <PromptTemplateContentHandler
                                content={content} setContent={setContent}
                                setIsEdited={setIsEdited} isEditable={isEditable}
                                setContentHandlerControls={setContentHandlerControls} />;
    const defaultContent = { prompt_template: '' };

    const resetDoc = () => {
        setId("");
        setName(`New ${type}`);
        setShareData({});
        setVisibility("private");
        setDocumentOwner(system.user.id);
        setDocumentOwnerName(system.user.name);
        setTags([]);
        setBookmarked(false);
        setStarred(false);
        setInAILibrary(false);
        setContent({});
    }

    const instantiate = async (response) => {
        setDocData(response.data);
        setId(response.data.metadata.id);
        setDocumentOwner(response.data.metadata.user_id);
        setDocumentOwnerName(response.data.metadata.user_name);
        setTags(response.data.metadata.tags);
        setName(response.data.metadata.name);
        setVisibility(response.data.metadata.visibility);
        setBookmarked(response.data.metadata.properties.bookmarked);
        setStarred(response.data.metadata.properties.starred);
        setInAILibrary(response.data.metadata.properties.inAILibrary);
        setFavourite(response.data.metadata.properties.favourite);
        setShareData(response.data.metadata?.properties?.shareData || {});
        setContent(response.data.content);
        setDocEditorOpen(true);
        setIsEdited(false);
        // Give the sets time to complete to avoide race conditions with setIsEdited
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    const load = async (id) => {
        try {
            const response = await axios.get(`${serverUrl}/docdb/${myFolder}/documents/${id}`, {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            });
            debugMode && console.log("DocEditor load response", response);
            await instantiate(response);
        } catch (error) {
            console.error('Error loading document:', error);
        }
    };

    useEffect(() => {
        const loadDocument = async () => {
            if (loadDoc?.id) {
                debugMode && console.log("DocEditor loadDoc", loadDoc);
                isLoading.current = true;
                await load(loadDoc.id);
                isLoading.current = false;
            }
        };
        loadDocument();
    }, [loadDoc]);

    useEffect(() => {
        if (!isLoading.current && shareStatusChanged) {
            save();
            setShareStatusChanged(false);
        }
    }, [shareStatusChanged]);

    useEffect(() => {
        if (!isLoading.current) {
            setIsEdited(true);
        }
    }, [name, visibility, tags, inAILibrary, starred, bookmarked, favourite, shareData, content]);

    const create = async () => {
        const request = {
            metadata: {
                name: `New ${type}`,
                visibility: "private",
                tags: [],
                properties: {
                    inAILibrary: false,
                    starred: false,
                    bookmarked: false,
                    favourite: false,
                    shareData: {},
                },
            },
            content: defaultContent,
        };
        let url = `${serverUrl}/docdb/${myFolder}/documents`;
        debugMode && console.log("DocEditor create request", request)
        axios.post(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(async response => {
            response.data.access_token && setToken(response.data.access_token);
            await instantiate(response);
            onChange(response.data.metadata.id, response.data.metadata.name, "created", "");
            system.info(`${type} "${response.data.metadata.name}" created.`);
            debugMode && console.log("DocEditor create response", response);
        }).catch(error => {
            system.error(`System Error saving Doc.`, error, url + " PUT");
        });
    }

    const _save = () => {
        const request = {
            metadata: {
                name: name,
                visibility: visibility,
                tags: tags,
                properties: {
                    inAILibrary: inAILibrary,
                    starred: starred,
                    bookmarked: bookmarked,
                    favourite: favourite,
                    shareData: shareData,
                },
            },
            content: content,
        }
        let url = `${serverUrl}/docdb/${myFolder}/documents/${id}`;
        debugMode && console.log("DocEditor save request", request)
        axios.put(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            setIsEdited(false);
            response.data.access_token && setToken(response.data.access_token);
            debugMode && console.log("DocEditor save response", response);
            onChange(id, name, "changed", "");
        }).catch(error => {
            system.error(`System Error saving Doc.`, error, url + " PUT");
        });
    }

    const save = () => {
        // wait 0.2 seconds to allow any state changes to complete
        setTimeout(() => {
            _save();
        }, 200);
    }

    const clone = () => {
        let request = {
            metadata: {
                name: name + " clone",
                tags: tags,
                properties: {
                    inAILibrary: inAILibrary, // if its in the AI library then thats probbaly why you want to clone it, so keep it in there
                    starred: false, // don't clone the starred status
                    bookmarked: false, // don't clone the bookmarked status
                    // shareData not cloned
                }
            },
            content: content
        };
        const url = `${serverUrl}/docdb/${folder}/documents`;
        axios.post(url, request, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then(response => {
            response.data.access_token && setToken(response.data.access_token);
            onChange(id, name, "created", "");
            system.info(`Cloned ${type} into "${response.data.metadata.name}".`);
            debugMode && system.debug(`${type} cloned`, response, url + " POST");
            load(response.data.metadata.id);
        }).catch(error => {
            system.error(`System Error cloning ${type}`, error, url + " POST");
        });
    }

    const deleteDoc = () => {
        const idToDelete = id;
        const nameToDelete = name;
        let url = `${serverUrl}/docdb/${folder}/documents/${idToDelete}`;
        axios.delete(url, {
            headers: {
                Authorization: 'Bearer ' + token
              }
        }).then(response => {
            system.info(`${type} "${nameToDelete}" deleted.`);
            system.debug(`${type} "${nameToDelete}" deleted.`, response, url + " DELETE");
            debugMode && console.log(`delete ${type} Response`, response);
            response.data.access_token && setToken(response.data.access_token);
            onChange(idToDelete, nameToDelete, "deleted", "");
            resetDoc();
            setDocEditorOpen(false);
        }).catch(error => {
            system.error(`System Error deleting ${type}.`, error, url + " DELETE");
        });
    }


    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleCancel = async () => {
        setIsEdited(false);
        isLoading.current = true;
        await load(id);
        isLoading.current = false;
    };

    const handleClose = () => {
        setDocEditorOpen(false);
        resetDoc();
        onClose && onClose();
    };

    const focusOnName = () => {
        if (docNameRef.current) {
            docNameRef.current.focus();
        }
    }

    const handleNewDoc = () => {
        create();
        focusOnName();
    }

    const toolbar = (
        <StyledToolbar className={ClassNames.toolbar} sx={{ width: "100%", gap: 1, mb:2 }} >
            <Typography sx={{ mr:2 }}>Editor</Typography>
            <Tooltip title={ id === "" ? `You are in a new ${type}` : `New ${type}` }>
                <span>
                    <IconButton edge="start" color="inherit" aria-label={`New ${type}`}
                        disabled={id === ""} onClick={handleNewDoc}
                    >
                        <AddOutlinedIcon/>
                    </IconButton>
                </span>
            </Tooltip>
            { isEditable() &&
                <Tooltip title={ bookmarked ? "Unbookmark this note" : "Bookmark this note"}>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label={bookmarked ? "Unbookmark this note" : "Bookmark this note"}
                            onClick={ () => {setBookmarked(x=>!x)} }
                        >
                            {bookmarked ? <BookmarkIcon/> : <BookmarkBorderIcon/>}
                        </IconButton>
                    </span>
                </Tooltip>
            }
            { isEditable() &&
                <Tooltip title={starred ? "Unstar this note" : "Star this note"}>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label={starred ? "Unstar this note" : "Star this note"}
                            onClick={ () => {setStarred(x=>!x)} }
                        >
                            {starred ? <StarIcon/> : <StarBorderIcon/>}
                        </IconButton>
                    </span>
                </Tooltip>
            }
            { isEditable() &&
                <Tooltip title={ inAILibrary ? "Remove from AI Library" : "Add to AI library. When you click the same library icon in the Chat Prompt Editor it will give you the option of adding notes to the context of your chat. These notes do not appear in the chat transcript but are sent to the AI every time you prompt it so it has them as context." }>
                    <IconButton edge="start" color="inherit" aria-label={ inAILibrary ? "Remove from AI Library" : "Add to AI library" }
                        onClick={() => { setInAILibrary(x=>!x)}}>
                        { inAILibrary ? <LocalLibraryIcon/> : <LocalLibraryOutlinedIcon/> }
                    </IconButton>
                </Tooltip>
            }
            { isEditable() && !isEdited &&
                <ShareButton
                    disabled={id === ""}
                    id={id} name={name} visibility={visibility} setVisibility={setVisibility}
                    shareData={shareData} setShareData={setShareData} setShareStatusChanged={setShareStatusChanged}
                    />
            }
            <Box ml="auto">
                { isEditable() && !isEdited &&
                    <Tooltip title={ "Delete" }>
                        <IconButton edge="end" color="inherit" aria-label="delete"
                            onClick={deleteDoc}
                        >
                            <DeleteIcon/>
                        </IconButton>
                    </Tooltip>
                }
                <IconButton onClick={ ()=>{ setDocEditorOpen(false) } }>
                    <CloseIcon />
                </IconButton>
            </Box>
        </StyledToolbar>
    )

    return (
        docEditorOpen ?
            <Box>
                {toolbar}
                <TextField
                    ref={docNameRef}
                    disabled={!isEditable()}
                    label={`${type} name`}
                    placeholder="Name"
                    variant="outlined"
                    value={name}
                    onChange={handleNameChange}
                    fullWidth
                />
                {contentHandler}
                <Box className="actions" display="flex" flexDirection="row" alignItems="center">
                    {isEdited ?  null : contentHandlerControls}
                    <Box>
                        {
                            visibility !== "private" && documentOwner !== system.user.id ?
                                <Tooltip title={showShareData ? "Hide sharing info" : "Show sharing info"}>
                                    <IconButton onClick={() => setShowShareData(x=>!x)}>
                                        {
                                            showShareData ? <ShareIcon sx={{ color:"orange" }}/>
                                            : <ShareOutlinedIcon sx={{ color:"orange" }}/>
                                        }
                                        
                                    </IconButton>
                                </Tooltip>
                            : null
                        }
                    </Box>
                    <Box flexGrow={1} /> {/* This will take up the remaining space and push the buttons to the right */}
                    {isEdited ? (
                        <>
                            <Button onClick={save}>Save</Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>Close</Button>
                    )}
                </Box>
                {
                    !isEditable() && showShareData &&
                    <SharedDocPanel type="Prompt Template" documentOwnerName={documentOwnerName} shareData={shareData} handleClone={clone} />
                }
            </Box>
        : null
    );
};

export default DocEditor;
