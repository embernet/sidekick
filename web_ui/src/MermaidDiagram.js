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
    if (mermaidRef.current && markdown !== "") {
      mermaid.render(mermaidId, markdown)
      .then(({svg}) => {
        setSvg(svg);
      })
      .catch((error) => {
        console.error("Error rendering mermaid diagram", mermaidId, error);
        setError({ message: 'Error rendering mermaid diagram.', error: error});
        const mermaidInjectedErrorElement = document.getElementById(mermaidId);
        if (mermaidInjectedErrorElement) {
          // Hide the mermaid 'Syntax error in text' bomb message
          mermaidInjectedErrorElement.style.display = 'none';
        }
      });
    }
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
            {error.message}
          </Button>
          <Collapse in={showError}>
            <Box>
              {error.error.toString()}
            </Box>
          </Collapse>
          <Box sx={{ whiteSpace: 'pre-wrap', padding:4 }}>
            <Typography style={{ fontWeight: 'bold' }}> Here's the markdown the generated the error:</Typography>
            {markdown}
          </Box>
        </Box>      
      }
    </Box>
  );
});

export default MermaidDiagram;