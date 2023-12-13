import React, { useState } from 'react';
import { Tooltip, Button } from '@mui/material';
import { red } from '@mui/material/colors';

const TextStatsDisplay = ({ name, sizeInCharacters, maxTokenSize=null }) => {
  const [displayTokens, setDisplayTokens] = useState(true);

  const handleClick = () => {
    setDisplayTokens(!displayTokens);
  };

  const tokenSize = () => {
    return Math.round(sizeInCharacters / 4);
  }

  const displaySize = displayTokens ? tokenSize() : sizeInCharacters;
  const unit = displayTokens ? 'Tokens' : 'Characters';

  return (
    <Tooltip title={`Size of ${name} in ${unit}. `+
    `${tokenSize() > maxTokenSize 
      ? `THIS EXCEEDS THE CONTEXT WINDOW OF THE SELECTED MODEL BY ${tokenSize() - maxTokenSize} TOKENS` +
      ` (${Math.round((tokenSize() - maxTokenSize)/maxTokenSize)}%). ` : ''}` +
      `Click to change units`}>
        <Button id={{name} + "-text-stats-display"} variant="outlined" size="small" 
            sx={{ fontSize: "0.8em", textTransform: 'none', color:!maxTokenSize || tokenSize() <= maxTokenSize ? "primary" : red[500] }}
            onClick={handleClick}>
            {`${displaySize}${unit[0]}`}
        </Button>
    </Tooltip>
  );
}

export default TextStatsDisplay;