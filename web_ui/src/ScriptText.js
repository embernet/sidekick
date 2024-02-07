/*
Purpose:
    Allow the user to enter text for use in a script.
Visualisation:
    A name field and a multi-line value field.
Function:
    When the text box is changed, the context is updated.
Parameters:
    value: the initial value of the text box (a dict with name and value entries)
    setValue: a function to update the value of the text box
*/

import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import { grey } from '@mui/material/colors';
import { use } from 'marked';

const ScriptText = ({ cellName, setCellName,
    cellValue, setCellValue }) => {
    const [myCellName, setMyCellName] = useState(cellName);
    const [myCellValue, setMyCellValue] = useState(cellValue);

    useEffect(() => {
        setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        setCellValue(myCellValue);
    }
    , [myCellValue]);

    const handleNameChange = (event) => {
        setMyCellName(event.target.value);
    }

    const handleValueChange = (event) => {
        setMyCellValue(event.target.value);
    };

    return (
        <Box>
            <TextField label="name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                value={myCellName} onChange={handleNameChange}
            />
            <TextField label="value" variant="outlined" sx={{ mt: 2, width: "100%" }} multiline
                rowsMax={6} value={myCellValue} onChange={handleValueChange}
            />
        </Box>
    );
}

export default ScriptText;
