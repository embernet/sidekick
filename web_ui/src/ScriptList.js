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
import CloseIcon from '@mui/icons-material/Close';


const ScriptList = ({ cellName, setCellName,
    cellValue, setCellValue }) => {
    const [myCellName, setMyCellName] = useState(cellName);
    const [myCellValue, setMyCellValue] = useState(cellValue);
    const defaultListItem = { value: "" };
    const [myCellList, setMyCellList] = useState(cellValue?.cellList || []);

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
            { ...JSON.parse(JSON.stringify(defaultListItem)) },
            ...myCellList.slice(index + 1)
        ];
        setMyCellList(newCellList);
        // Don't setMyCellValue here, as it will be set in the useEffect when the new cell changes
    };

    const handleDeleteCell = (index) => {
        setMyCellList(prevCellList => {
            const newCellList = [
                ...prevCellList.slice(0, index),
                ...prevCellList.slice(index + 1)
            ];
            setMyCellValue(prevCellValue => ({ ...prevCellValue, cellList: newCellList }));
            return newCellList;
        });
    };


    const addListItemControl = (index) => 
        <Tooltip title="Add cell" key={ "add-list-item-control-" + index }>
            <IconButton onClick={() => handleAddCell(index)}>
                <AddIcon/>
            </IconButton>
        </Tooltip>
    ;

    const deleteListItemControl = (index) =>
        <Tooltip title="Delete cell" key={ "delete-cell-control-" + index }>
            <IconButton onClick={() => handleDeleteCell(index)}>
                <CloseIcon />
            </IconButton>
        </Tooltip>



    return (
        <Box>
            <TextField label="cell name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                value={myCellName} onChange={handleNameChange}
            />
            <List id="list">
                {addListItemControl(-1)}
                {
                    myCellList && myCellList.map((cell, index) => (
                        <ListItem key={index}>
                            <TextField variant="outlined" sx={{ width: "100%" }} multiline
                                maxRows={6} value={cell.value} onChange={(e) => { handleValueChange(e, index) } }
                            />
                            {addListItemControl(index)}
                            {deleteListItemControl(index)}
                        </ListItem>
                    ))
                }
            </List>
        </Box>
    );
}

export default ScriptList;
