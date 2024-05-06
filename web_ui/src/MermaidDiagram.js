import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { v4 as uuidv4 } from 'uuid';
import { memo } from 'react';

const MermaidDiagram = memo(({ markdown }) => {
  const mermaidRef = useRef(null);
  const mermaidId = `mermaid-diagram-${uuidv4()}`;
  const [svg, setSvg] = useState(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
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
          console.error(error);
        });
    }
  }, [mermaidId, markdown]);

  return (
    <div className="mermaid-diagram" id={'id-'+mermaidId} key={'key-'+mermaidId} ref={mermaidRef}>
    </div>
  );
});

export default MermaidDiagram;