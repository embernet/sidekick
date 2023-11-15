import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import ReactMarkdown from 'react-markdown';
import { ClassNames } from "@emotion/react";
import { useContext } from 'react';
import { Card, Toolbar, Typography, Box, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { SystemContext } from './SystemContext';

const SidekickMarkdown = ({ markdown }) => {
    const system = useContext(SystemContext);

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
                const startIndex = match.index;
                const endIndex = codeRegex.lastIndex;
                const before = markdown.slice(lastIndex, startIndex);
                const after = markdown.slice(endIndex);
                renderedMarkdown.push(<ReactMarkdown key={lastIndex} sx={{ whiteSpace: 'pre-wrap' }}>{before}</ReactMarkdown>);
                renderedMarkdown.push(
                <Card key={startIndex} sx={{ height: "fit-content" }}>
                    <Toolbar className={ClassNames.toolbar}>
                        <Typography sx={{ mr: 2 }}>{language}</Typography>
                        <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
                            <IconButton edge="start" color="inherit" aria-label="menu"
                            onClick={() => { navigator.clipboard.writeText(code); }}>
                            <ContentCopyIcon/>
                            </IconButton>
                        </Box>
                    </Toolbar>
                    <SyntaxHighlighter language={language} style={docco}>
                    {code}
                    </SyntaxHighlighter>
                </Card>
                );
                lastIndex = codeRegex.lastIndex;
                if (lastIndex === markdown.length) {
                renderedMarkdown.push(<ReactMarkdown key={lastIndex} sx={{ whiteSpace: 'pre-wrap' }}>{after}</ReactMarkdown>);
                }
            }
            if (lastIndex < markdown.length) {
                renderedMarkdown.push(<ReactMarkdown key={lastIndex} sx={{ whiteSpace: 'pre-wrap' }}>{markdown.slice(lastIndex)}</ReactMarkdown>);
            }
            return <>{renderedMarkdown}</>;
        } catch (err) {
            system.error(`System Error rendering markdown.`, err, "Rendering markdown");
            return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{markdown}</Typography>;
        }
    };
    if (!markdown) {
        return null;
    }
    const result = renderMarkdown(markdown);
    return (result);
};

export default SidekickMarkdown;