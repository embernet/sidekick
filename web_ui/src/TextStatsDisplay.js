import React, { useState } from 'react';
import { Tooltip, Button } from '@mui/material';

const TextStatsDisplay = ({ name, sizeInCharacters }) => {
  const [displayTokens, setDisplayTokens] = useState(false);

  const handleClick = () => {
    setDisplayTokens(!displayTokens);
  };

  const displaySize = displayTokens ? Math.round(sizeInCharacters / 4) : sizeInCharacters;
  const unit = displayTokens ? 'tokens' : 'characters';

  return (
    <Tooltip title={`Size of ${name} in ${unit}, click to change units`}>
        <Button id={{name} + "-text-stats-display"} variant="outlined" size="small" 
            color="primary" sx={{ fontSize: "0.8em", textTransform: 'none' }}
            onClick={handleClick}>
            {`${displaySize}${unit[0]}`}
        </Button>
    </Tooltip>
  );
}

export default TextStatsDisplay;