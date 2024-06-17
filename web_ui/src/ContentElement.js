/*
Purpose:
    Provide dynamic editable content elements.
Visualisation:
    If not populated, a button with the element name is provided to create the element.
    If created, the element is displayed on a card with its name.
Function:
    Provide the containing component with the ability to create, edit and delete the element.
Parameters:
    name: the name of the element
    setName: a function to update the name of the element
    content: the content of the element
    setContent: a function to update the content of the element
*/

import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from "lodash";

import { Card, Button, TextField, Box } from '@mui/material';
import { memo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { use } from 'marked';

const ContentElement = memo(({ name, setName, placeholder, content, setContent, rows }) => {

    const [myName, setMyname] = useState(name || "");
    const [myPlaceholder, setMyPlaceholder] = useState(placeholder || name || "Enter content here");
    const [mycontent, setMyContent] = useState( typeof content === "string" ? content : "");
    const myId= uuidv4();

    // UI state
    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`content-element-${myId}`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(() => {
        setMyname(name);
    }, [name]);

    useEffect(() => {
        setMyContent(content);
    }, [content]);

    useEffect(() => {
        setMyPlaceholder(placeholder);
    }, [placeholder]);

    useEffect(() => {
        name !== myName && setName && setName(myName);
    }
    , [myName]);

    useEffect(() => {
        content !== mycontent && setContent && setContent(mycontent);
    }
    , [mycontent]);

    const handleNameChange = (event) => {
        setMyname(event.target.value);
    }

    const handleContentChange = (event) => {
        setMyContent(event.target.value);
    };

    const memoizedValue = React.useMemo(() => mycontent, [mycontent]);

    return (
        <Box sx={{ width: "100%", ml: 1, mr: 1 }} id={`content-element-${myId}`}>

            {
                setName ?
                    <TextField label={myName} variant="outlined" sx={{ mt: 2, width: "100%" }}
                        value={myName} onChange={handleNameChange}
                    />
                : null
            }
            {mycontent === undefined ? (
                <Button variant="contained" color="primary">
                    + {myName}
                </Button>
            ) : (
                <TextField label={myName} placeholder={myPlaceholder}
                    variant="outlined" sx={{ mt: 2, width: "100%" }} multiline
                    rows={rows ? rows : 1} value={memoizedValue} onChange={handleContentChange} disabled={!setContent}
                />
            )}
        </Box>
    );
});

export default ContentElement;
