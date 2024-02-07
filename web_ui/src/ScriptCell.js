/*
Purpose:
    ScriptCell renders a cell in a script akin to a cell in a jupyter notebook.
Visualisation:
    The cell has a toolbar with:
        a dropdown menu to select the cell type
        a button to delete the cell
    The cell has a body which is the content of the cell
Function:
    Cell types are: Text (ScriptText component), List (ScriptList component), Prompt (ScriptPrompt component)
    When a cell type is selected, the corresponding component is rendered.
*/
import React, { useState, useEffect } from 'react';
import { Card, Box, FormControl, Select, InputLabel, Tooltip, IconButton, MenuItem } from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import ScriptText from './ScriptText';
import ScriptList from './ScriptList';
import ScriptPrompt from './ScriptPrompt';
import ScriptTemplate from './ScriptTemplate';
// import ScriptXYQ from './ScriptXYQ';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const ScriptCell = ({ id, cells, onDelete, onMoveCellUp, onMoveCellDown,
    cellType, setCellType,
    cellName, setCellName, cellValue, setCellValue, key, darkMode,
    modelSettings, serverUrl, token, setToken, markdownRenderingOn, system}) => {
    const [myId, setMyId] = useState(id);
    const [myCellType, setMyCellType] = useState(cellType);
    const [myCellName, setMyCellName] = useState(cellName);
    const [myCellValue, setMyCellValue] = useState(cellValue);

    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        setCellType(myCellType);
    }
    , [myCellType]);

    useEffect(() => {
        setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        setCellValue(myCellValue);
    }
    , [myCellValue]);

    const handleSelectCellType = (event) => {
        setMyCellType(event.target.value);
        setAnchorEl(null);
    };

    const handleDeleteCell = () => {
        onDelete(myId);
    };

    const renderCell = () => {
        switch (myCellType) {
            case "text":
                return <ScriptText
                    cellName={cellName} setCellName={setMyCellName}
                    cellValue={cellValue} setCellValue={setMyCellValue}
                />;
                case "template":
                    return <ScriptTemplate cells={cells}
                        valueLabel="Edit the template to generate a value"
                        cellName={cellName} setCellName={setMyCellName}
                        cellValue={cellValue} setCellValue={setMyCellValue}
                    />;
                case "list":
                return <ScriptList
                    cellName={cellName} setCellName={setMyCellName}
                    cellValue={cellValue} setCellValue={setMyCellValue}
                />;
            case "prompt":
                return <ScriptPrompt cells={cells}
                    cellName={cellName} setCellName={setMyCellName}
                    cellValue={cellValue} setCellValue={setMyCellValue}
                    modelSettings={modelSettings} serverUrl={serverUrl} token={token} setToken={setToken}
                    darkMode={darkMode} markdownRenderingOn={markdownRenderingOn} system={system}
                />;
            // case "xyq":
            //     return <ScriptXYQ cells={cells}
            //         cellName={cellName} setCellName={setMyCellName}
            //         cellValue={cellValue} setCellValue={setMyCellValue}
            //         modelSettings={modelSettings} serverUrl={serverUrl} token={token} setToken={setToken}
            //         darkMode={darkMode} system={system}
            //     />;
            default:
                return null;
        }
    };

    const moveCellUpControl = (index) =>
        <Tooltip title="Move cell up">
            <IconButton onClick={() => onMoveCellUp(index)}>
                <ArrowUpwardIcon />
            </IconButton>
        </Tooltip>

    const moveCellDownControl = (index) =>
        <Tooltip title="Move cell down">
            <IconButton onClick={() => onMoveCellDown(index)}>
                <ArrowDownwardIcon />
            </IconButton>
        </Tooltip>


    const toolbar =  
        <Box sx={{ width: "100%", paddingLeft: 0, paddingRight: 0, display: "flex",
         flexDirection: "row", alignItems: "center" }}>
            <FormControl sx={{ mt: 2, minWidth: 120 }} size="small">
                <InputLabel>Cell type</InputLabel>
                <Select
                    id={"script-cell-type-select"}
                    name={"Script cell type"}
                    labelId={"script-cell-type-label"}
                    value={myCellType}
                    label="Cell type"
                    onChange={handleSelectCellType}
                    >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="template">Template</MenuItem>
                            <MenuItem value="list">List</MenuItem>
                            <MenuItem value="prompt">Prompt</MenuItem>
                            {/* <MenuItem value="xyq">XYQ</MenuItem> */}
                </Select>
            </FormControl>
            <Box sx={{ display: "flex", flexDirection: "row", ml: "auto" }}>
                {onMoveCellUp ? moveCellUpControl(key) : null}
                {onMoveCellDown ? moveCellDownControl(key) : null}
                <Tooltip title="Delete cell">
                    <IconButton onClick={handleDeleteCell}>
                        <ClearIcon/>
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>


    return (
        <Card sx={{ 
            padding: 2, 
            width: "100%", 
            backgroundColor: darkMode ? blueGrey[800] : "lightblue",
        }}
    >
            {toolbar}
            {renderCell()}
        </Card>
    );
}

export default ScriptCell;
