import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from "lodash";

import { Box, FormControl, Select, TextField, MenuItem } from '@mui/material';
import { memo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ScriptTemplate = memo(({ valueLabel, cells,
    cellValue, setCellValue,
    cellParameters, setCellParameters,
    cellName, setCellName=undefined // leave setCellName undefined to use as part of another cell
}) => {
    // Set the initial state of the cell
    // taking into account the user may switch between cell types in the UI
    const [myCellName, setMyCellName] = useState(cellName || "");
    const [myCellValue, setMyCellValue] = useState( typeof cellValue === "string" ? cellValue : "");
    // If the cellParameters are not set, use the cellValue as the template
    // This enables the user to switch between cell types and keep the same value
    const [template, setTemplate] = useState(cellParameters?.template || (typeof cellValue === "string" ? cellValue : ""));
    const myId= uuidv4();

    // UI state
    const [cellToAddToTemplate, setCellToAddToTemplate] = useState("");
    const [templateCursorPosition, setTemplateCursorPosition] = useState(0);

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`script-template-${myId}`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(() => {
        // regenerate the template if any of the cells change
        createValueFromTemplate();
    }, [cells]);

    useEffect(() => {
        cellName !== myCellName && setCellName && setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        cellValue !== myCellValue && setCellValue && setCellValue(myCellValue);
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

    const trackCursorInTemplate = (event) => {
        setTemplateCursorPosition(event.target.selectionStart);
    };

    const handleAddCellToPrompt = (name) => {
        const beforeCursor = template.slice(0, templateCursorPosition);
        const afterCursor = template.slice(templateCursorPosition);
        let beforeSpace = beforeCursor.endsWith(" ") || beforeCursor.endsWith("\n") ? "" : " ";
        let afterSpace = afterCursor.startsWith(" ") || afterCursor.startsWith("\n") ? "" : " ";
        const newTemplate = beforeCursor + beforeSpace + "{" + name + "}" + afterSpace + afterCursor;
        setTemplate(newTemplate);
        setTemplateCursorPosition(pos => pos + name.length + 2 + beforeSpace.length + afterSpace.length);
        setCellToAddToTemplate(""); // reset the select box
    };

    const toolbar =
        <Box sx={{ width: "100%", paddingLeft: 0, paddingRight: 0, display: "flex",
        flexDirection: "row", alignItems: "center" }}>
        <FormControl sx={{ mt: 2, width: "100%" }} size="small">
            <Select
                id={`script-template-cell-select-${myId}`}
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
        <Box id={`script-template-${myId}`}>
            {
                setCellName !== undefined && myCellName !== undefined &&
                <TextField label="cell name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                    value={myCellName} onChange={handleNameChange}
                />
            }
            {toolbar}
            <TextField label="template" variant="outlined" sx={{ mt: 2, width: "100%" }} multiline
                rows={6} value={template} onChange={handleTemplateChange} onClick={trackCursorInTemplate} onKeyUp={trackCursorInTemplate}
            />
            <TextField label={valueLabel} variant="outlined" sx={{ mt: 2, width: "100%" }} multiline
                rows={6} value={myCellValue} disabled
            />
        </Box>
    );
});

export default ScriptTemplate;
