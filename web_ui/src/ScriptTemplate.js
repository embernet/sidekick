import React, { useState, useEffect } from 'react';
import { Box, FormControl, Select, TextField, MenuItem } from '@mui/material';

const ScriptTemplate = ({ valueLabel, cells,
    cellValue, setCellValue,
    cellParameters, setCellParameters,
    cellName, setCellName=undefined // leave setCellName undefined to use as part of another cell
}) => {
    const [myCellName, setMyCellName] = useState(cellName || "");
    const [myCellValue, setMyCellValue] = useState(cellValue || "");
    const [template, setTemplate] = useState(cellParameters?.template || "");
    const [cellToAddToTemplate, setCellToAddToTemplate] = useState("");

    useEffect(() => {
        // regenerate the template if any of the cells change
        createValueFromTemplate();
    }, [cells]);

    useEffect(() => {
        setCellName && setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        setCellValue && setCellValue(myCellValue);
    }
    , [myCellValue]);

    useEffect(() => {
        cellName && setMyCellName(cellName);
    }, [cellName]);

    const createValueFromTemplate = () => {
        // replace all the {.*} in the template with the values of the cells with those names
        let newCellValue = template;
        cells.forEach((cell) => {
            switch (cell.type.toLowerCase()) {
                case "text":
                case "template":
                    newCellValue = newCellValue.replace(new RegExp("\\{" + cell.name + "\\}", "gi"), cell.value);
                    break;
                case "list":
                    if (cell.value && cell.value?.cellList && cell.value.cellList?.length > 0) {
                        newCellValue = newCellValue.replace(new RegExp("\\{" + cell.name + "\\}", "gi"), "{" + 
                            cell.value.cellList.map(element => {
                                return element.value;
                            }) + "}");
                    } else {
                        newCellValue = newCellValue.replace(new RegExp("\\{" + cell.name + "\\}", "gi"),
                            "WARNING: {"+cell.name+"} IS AN EMPTY LIST");
                    }
                    break;
                case "prompt":
                    newCellValue = newCellValue.replace(new RegExp("\\{" + cell.name + "\\}", "gi"), cell.value.response);
                    break;
                default:
                    break;
            }
        }
        );
        setMyCellValue(newCellValue);
    }

    useEffect(() => {
        setCellParameters && setCellParameters({ ...cellParameters, template: template });
        createValueFromTemplate();
    }
    , [template]);


    const handleNameChange = (event) => {
        setMyCellName(event.target.value);
    }

    const handleTemplateChange = (event) => {
        setTemplate(event.target.value);
    };

    const handleAddCellToPrompt = (name) => {
        setTemplate(template + "{" + name + "}");
        setCellToAddToTemplate(""); // reset the select box
    };

    const toolbar =
        <Box sx={{ width: "100%", paddingLeft: 0, paddingRight: 0, display: "flex",
        flexDirection: "row", alignItems: "center" }}>
        <FormControl sx={{ mt: 2, width: "100%" }} size="small">
            <Select
                value={cellToAddToTemplate}
                displayEmpty
                onChange={(event) => { handleAddCellToPrompt(event.target.value); }}
                >
                    <MenuItem disabled value="">
                        <em>Select cell to add to template...</em>
                    </MenuItem>
                    {
                        cells && cells.map(
                            (cell, index) => {
                                if (cell.name === myCellName || cell.name === "") {
                                    return null;
                                }
                                return <MenuItem key={cell.name} value={cell.name}>{cell.name}</MenuItem>
                            }
                        )
                    }
            </Select>
        </FormControl>
    </Box>;

    return (
        <Box>
            {
                setCellName !== undefined && myCellName !== undefined &&
                <TextField label="cell name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                    value={myCellName} onChange={handleNameChange}
                />
            }
            {toolbar}
            <TextField label="template" variant="outlined" sx={{ mt: 2, width: "100%" }} multiline
                rows={6} value={template} onChange={handleTemplateChange}
            />
            <TextField label={valueLabel} variant="outlined" sx={{ mt: 2, width: "100%" }} multiline
                rows={6} value={myCellValue} disabled
            />
        </Box>
    );
};

export default ScriptTemplate;
