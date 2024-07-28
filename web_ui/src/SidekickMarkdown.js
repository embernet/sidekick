import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ReactMarkdown from 'react-markdown';
import { ClassNames } from "@emotion/react";
import { useContext, useState, useEffect } from 'react';
import { Card, Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';

// Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { SystemContext } from './SystemContext';
import { SidekickClipboardContext } from './SidekickClipboardContext';

import { memo } from 'react';
import MermaidDiagram from './MermaidDiagram';
import { v4 as uuidv4 } from 'uuid';

const SidekickMarkdown = memo(({ markdown, sx = {} }) => {
    const system = useContext(SystemContext);
    const sidekickClipboard = useContext(SidekickClipboardContext);

    const [myMarkdown, setMyMarkdown] = useState(null);
    const [myRenderedMarkdown, setMyRenderedMarkdown] = useState(null);
    const [customSx, setCustomSx] = useState(sx);

    useEffect(() => {
        setMyMarkdown(markdown);
    }, [markdown]);

    useEffect(() => {
        if (myMarkdown) {
            setMyRenderedMarkdown(renderMarkdown(myMarkdown));
        }
    }, [myMarkdown]);

    const renderMarkdown = (markdown) => {
        try {
            const codeRegex = /```([a-zA-Z]*)([\s\S]*?)```/g;
            let lastIndex = 0;
            const renderedMarkdown = [];
            let match;
            while ((match = codeRegex.exec(markdown)) !== null) {
                let language = match[1];
                if (language === "" || !language) { language = "code"; } // provide a default if ``` used wuthout specifying a language
                const code = match[2];
                const codeMarkdown = `\`\`\`${language}\n${code.trim()}\n\`\`\`\n`;
                const startIndex = match.index;
                const endIndex = codeRegex.lastIndex;
                const before = markdown.slice(lastIndex, startIndex);
                const after = markdown.slice(endIndex);
                renderedMarkdown.push(<ReactMarkdown key={lastIndex} sx={{ width: "100%", whiteSpace: 'pre-wrap' }}>{before}</ReactMarkdown>);
                renderedMarkdown.push(
                <Card key={uuidv4()} sx={{ width: "100%", height: "fit-content" }}>
                    <Toolbar className={ClassNames.toolbar}>
                        <Typography sx={{ mr: 2 }}>{language}</Typography>
                        <Box sx={{ display: "flex", width: "100%", flexDirection: "row", ml: "auto" }}>
                            <Tooltip title="Copy markdown to clipboard" arrow>
                                <IconButton edge="start" color="inherit" aria-label="copy to clipboard"
                                onClick={(event) => { (async () => {
                                    await sidekickClipboard.write({text: code, sidekickObject: { markdown: codeMarkdown }});
                                })(); event.stopPropagation(); }}>
                                <ContentCopyIcon/>
                                </IconButton>
                            </Tooltip>
                        </Box>
                        
                    </Toolbar>
                    {(language === "mermaid") ?
                        <MermaidDiagram markdown={code} escapedMarkdown={codeMarkdown}/>
                    :
                        <SyntaxHighlighter sx={{ width: "100%" }} lineProps={{style: {wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}} language={language} wrapLines={true} style={docco}>
                        {code}
                        </SyntaxHighlighter>
                    }
                </Card>
                );
                lastIndex = codeRegex.lastIndex;
                if (lastIndex === markdown.length) {
                renderedMarkdown.push(<ReactMarkdown key={lastIndex} sx={{ width: "100%", whiteSpace: 'pre-wrap' }}>{after}</ReactMarkdown>);
                }
            }
            if (lastIndex < markdown.length) {
                renderedMarkdown.push(<ReactMarkdown key={lastIndex} sx={{ width: "100%", whiteSpace: 'pre-wrap' }}>{markdown.slice(lastIndex)}</ReactMarkdown>);
            }
            return <Box sx={{ width: "100%", ...customSx }}>{renderedMarkdown}</Box>;
        } catch (err) {
            system.error(`System Error rendering markdown.`, err, "Rendering markdown");
            return <Typography sx={{ width: "100%", whiteSpace: 'pre-wrap' }}>{markdown}</Typography>;
        }
    };
    const result = myRenderedMarkdown ? myRenderedMarkdown : null;
    return (result);
});

export default SidekickMarkdown;