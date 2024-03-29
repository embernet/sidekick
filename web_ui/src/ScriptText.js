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

import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from "lodash";

import { TextField, Box } from '@mui/material';
import { memo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ScriptText = memo(({ cellName, setCellName,
    cellValue, setCellValue, setCellParameters }) => {

    // Set the initial state of the cell
    // taking into account the user may switch between cell types in the UI
    const [myCellName, setMyCellName] = useState(cellName || "");
    const [myCellValue, setMyCellValue] = useState( typeof cellValue === "string" ? cellValue : "");
    const myId= uuidv4();

    // UI state
    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        // Clear the cell parameters as they are not used in this cell type
        setCellParameters && setCellParameters({});
    }, [setCellParameters]);

    useEffect(() => {
        const element = document.getElementById(`script-text-${myId}`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(() => {
        cellName !== myCellName && setCellName && setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        cellValue !== myCellValue && setCellValue && setCellValue(myCellValue);
    }
    , [myCellValue]);

    const handleNameChange = (event) => {
        setMyCellName(event.target.value);
    }

    const handleValueChange = (event) => {
        setMyCellValue(event.target.value);
    };

    const memoizedValue = React.useMemo(() => myCellValue, [myCellValue]);

    return (
        <Box id={`script-text-${myId}`}>
            <TextField label="cell name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                value={myCellName} onChange={handleNameChange}
            />
            <TextField label="cell value" variant="outlined" sx={{ mt: 2, width: "100%" }} multiline
                rows={6} value={memoizedValue} onChange={handleValueChange}
            />
        </Box>
    );
});

export default ScriptText;
