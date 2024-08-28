import React, { useState, useEffect, useContext } from 'react';
import { TextField, Tooltip, IconButton } from '@mui/material';
import { use } from 'marked';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { SidekickClipboardContext } from './SidekickClipboardContext';

const PromptTemplateContentHandler = ({ content, setContent,
    isEdited, setIsEdited, isEditable, setContentHandlerControls }) => {

    const sidekickClipboard = useContext(SidekickClipboardContext);
    const [promptTemplate, setPromptTemplate] = useState('');

    useEffect(() => {
        setContentHandlerControls(
            <Tooltip title="Copy prompt template to clipboard">
                <IconButton
                    onClick={(event) => {
                        event.stopPropagation();
                        sidekickClipboard.writeText(promptTemplate);
                    }}>
                    <ContentCopyIcon/>
                </IconButton>
            </Tooltip>
        );
    }, [promptTemplate]);

    useEffect(()=>{
        const defaultPromptTemplate = '';
        if (content && !content.hasOwnProperty('prompt_template')) {
            setContent({ ...content, prompt_template: defaultPromptTemplate });
        }
        setPromptTemplate(content?.prompt_template || defaultPromptTemplate);
    }, [content]);

    const handleChange = (event) => {
        // Handle edits efficiently locally
        setPromptTemplate(event.target.value);
        setIsEdited(true);
    };

    const handleBlur = (event) => {
        // Update the containing structure when the user finishes editing
        if (isEdited) {
            setContent({ ...content, prompt_template: event.target.value });
        }
    };

    return (
        <TextField
            label="Prompt Template"
            disabled={!isEditable()}
            multiline
            rows={8}
            value={promptTemplate}
            onChange={handleChange}
            onBlur={handleBlur}
            variant="outlined"
            fullWidth
            sx={{ mt:2 }}
        />
    );
};

export default PromptTemplateContentHandler;
