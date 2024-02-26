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
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from "lodash";
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
    cellName, setCellName, cellParameters, setCellParameters, cellValue, setCellValue, cellKey, darkMode,
    modelSettings, persona, serverUrl, token, setToken, markdownRenderingOn, system}) => {
    const [myId, setMyId] = useState(id);
    const [myCellType, setMyCellType] = useState(cellType);
    const [myCellName, setMyCellName] = useState(cellName);
    const [myCellParameters, setMyCellParameters] = useState(cellParameters);
    const [myCellValue, setMyCellValue] = useState(cellValue);

    const [anchorEl, setAnchorEl] = useState(null);

    const [width, setWidth] = useState(0);

    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`script-cell-${myId}`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(() => {
        setCellType(myCellType);
    }
    , [myCellType]);

    useEffect(() => {
        cellName !== myCellName && setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        setCellParameters(myCellParameters);
    }
    , [myCellParameters]);

    useEffect(() => {
        cellValue !== myCellValue && setCellValue(myCellValue);
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
                        valueLabel={"Edit the template to generate a value"}
                        cellName={cellName} setCellName={setMyCellName}
                        cellParameters={cellParameters} setCellParameters={setMyCellParameters}
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
                    cellParameters={cellParameters} setCellParameters={setMyCellParameters}
                    cellValue={cellValue} setCellValue={setMyCellValue}
                    modelSettings={modelSettings} persona={persona}
                    serverUrl={serverUrl} token={token} setToken={setToken}
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
                    id={`script-cell-type-select-${myId}`}
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
                {onMoveCellUp ? moveCellUpControl(cellKey) : null}
                {onMoveCellDown ? moveCellDownControl(cellKey) : null}
                <Tooltip title="Delete cell">
                    <IconButton onClick={handleDeleteCell}>
                        <ClearIcon/>
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>


    return (
        <Card id={"script-cell-" + myId} sx={{ 
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
