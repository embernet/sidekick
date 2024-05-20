import React, { useEffect, useRef, useState, useContext } from "react";
import { Box, Collapse, Button, Typography, IconButton, Toolbar, Tooltip } from "@mui/material";
import mermaid from "mermaid";
import { v4 as uuidv4 } from 'uuid';
import { memo } from 'react';

import { SystemContext } from './SystemContext';
import { SidekickClipboardContext } from './SidekickClipboardContext';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';

const MermaidDiagram = memo(({ markdown, escapedMarkdown }) => {
  const system = useContext(SystemContext);
  const mermaidRef = useRef(null);
  const mermaidId = `mermaid-diagram-${uuidv4()}`;
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const sidekickClipboard = useContext(SidekickClipboardContext);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      suppressErrorRendering: true,
    });
  }, []);

  useEffect(() => {
    if (mermaidRef.current && svg !== null) {
      mermaidRef.current.innerHTML = svg;
    }
  }, [svg]);

  const handleCopyImage = (event) => {
    event.stopPropagation();
    if (mermaidRef.current) {
      try {
        const svgElement = mermaidRef.current.querySelector('svg');
        const scaleFactor = 2;
        const rect = svgElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const svgElementClone = svgElement.cloneNode(true);
        svgElementClone.setAttribute('width', width * scaleFactor);
        svgElementClone.setAttribute('height', height * scaleFactor);
        const svgData = new XMLSerializer().serializeToString(svgElementClone);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = () => {
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
          canvas.toBlob(blob => {
            (async () => {
              await sidekickClipboard.write({
                png: blob,
                sidekickObject: { markdown: escapedMarkdown }
              });
              })();
          });
        };
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      } catch (error) {
        system.error('Error copying image to clipboard', error);
      }
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (mermaidRef.current && markdown !== "") {
      mermaid.render(mermaidId, markdown)
      .then(({svg}) => {
        if (!isCancelled) {
          setSvg(svg);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setError({ message: 'Error rendering mermaid diagram.', error: error});
          const mermaidInjectedErrorElement = document.getElementById(mermaidId);
          if (mermaidInjectedErrorElement) {
            // Hide the mermaid 'Syntax error in text' bomb message
            mermaidInjectedErrorElement.style.display = 'none';
          }
        }
      });
    }

    // This cleanup function is called when the component unmounts or when the markdown prop changes.
    // It sets isCancelled to true, to prevent the .then and .catch callbacks from updating the state
    // to avoid race conditions due to the asynchronous nature of the mermaid.render() function.
    return () => {
      isCancelled = true;
    };
  }, [markdown]);

  return (
    <Box>
      {
        !error
        ?
        <Box>
          <Toolbar>
            <Tooltip title="Copy image as PNG to clipboard for external use (markdown will be placed in the internal clipboard)" arrow>
              <IconButton edge="start" color="inherit"
                aria-label="copy image to clipboard"
                onClick={handleCopyImage}>
                <CollectionsOutlinedIcon/>
              </IconButton>
            </Tooltip>
          </Toolbar>
          <div
            className="mermaid-diagram"
            id={'id-'+mermaidId} key={'key-'+mermaidId} ref={mermaidRef}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
          </div>
        </Box>
        :
        <Box>
          <Button onClick={() => setShowError(!showError)} aria-expanded={showError} aria-label="show more" style={{ color: 'red' }}>
            {error.message + " Click for details."}
          </Button>
          <Collapse in={showError}>
            <Box>
              {error.error.toString()}
            </Box>
          </Collapse>
          <Box sx={{ whiteSpace: 'pre-wrap', padding:4 }}>
            <Typography style={{ fontWeight: 'bold' }}> Here's the markdown that generated the error:</Typography>
            {markdown}
          </Box>
        </Box>      
      }
    </Box>
  );
});

export default MermaidDiagram;