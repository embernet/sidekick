import React, { useEffect, useRef, useState } from "react";
import { Box, Collapse, Button, Typography } from "@mui/material";
import mermaid from "mermaid";
import { v4 as uuidv4 } from 'uuid';
import { memo } from 'react';

const MermaidDiagram = memo(({ markdown }) => {
  const mermaidRef = useRef(null);
  const mermaidId = `mermaid-diagram-${uuidv4()}`;
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

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
          <div
            className="mermaid-diagram"
            id={'id-'+mermaidId} key={'key-'+mermaidId} ref={mermaidRef}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
          </div>
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