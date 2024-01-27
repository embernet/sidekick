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
import { TextField, Box, List, ListItem, Tooltip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { grey } from '@mui/material/colors';


const ScriptList = ({ id,
    cellName, setCellName,
    cellValue, setCellValue }) => {
    const [myCellName, setMyCellName] = useState(cellName);
    const [myCellValue, setMyCellValue] = useState(cellValue);
    const defaultListItem = { id: Date.now(), value: "" };
    const [myCellList, setMyCellList] = useState(cellValue?.cellList || []);
    console.log("myCellList", myCellList);

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
    };

    const handleValueChange = (event, index) => {
        setMyCellList(prevCellList => {
            const newCellList = prevCellList.map((item, i) => {
            // return a references to  existing items that are not the one we want to change
            if (i !== index) return item;
                // return a copy of target list item with the value changed
                return { ...item, value: event.target.value };
            });
            setMyCellValue(prevCellValue => ({ ...prevCellValue, cellList: newCellList }));
            return newCellList;
        });
    };

    const handleAddCell = (index) => {
        let newCellList = [
            ...myCellList.slice(0, index + 1),
            { ...JSON.parse(JSON.stringify(defaultListItem)), id: Date.now() },
            ...myCellList.slice(index + 1)
        ];
        setMyCellList(newCellList);
    };

    const addListItemControl = (index) => 
        <Tooltip title="Add cell">
            <IconButton onClick={() => handleAddCell(index)}>
                <AddIcon/>
            </IconButton>
        </Tooltip>
    ;


    return (
        <Box>
            <TextField label="name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                value={myCellName} onChange={handleNameChange}
            />
            <List id="list">
                {addListItemControl(-1)}
                {
                    myCellList && myCellList.map((cell, index) => (
                        <Box>
                            <ListItem key={cell.id}>
                                <TextField variant="outlined" sx={{ width: "100%" }} multiline
                                    rowsMax={6} value={cell.value} onChange={(e) => { handleValueChange(e, index) } }
                                />
                                {addListItemControl(index)}
                            </ListItem>
                        </Box>
                    ))
                }
            </List>
        </Box>
    );
}

export default ScriptList;
