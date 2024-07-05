import axios from 'axios'

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { debounce } from "lodash";
import { useTheme } from '@mui/material/styles';

import { TextField, Autocomplete, Box, InputAdornment, Tooltip, IconButton} from '@mui/material';
import { memo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SystemContext } from './SystemContext';

import HelpOutlineIcon from '@mui/icons-material/Help';

// The string indicating we want to use the default language of the model
// is exported so that other components can check if the language is the default
// and in that scenario avoid adding a prompt for the AI to respond in a specific language
export const MODEL_DEFAULT_LANGUAGE = "Model default language";

const LanguageSelector = memo(({ languageSettings, language, setLanguage }) => {
    const system = useContext(SystemContext);
    const theme = useTheme();
    const [languagesArray, setLanguagesArray] = useState([]);
    const [isHovered, setIsHovered] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const myId= uuidv4();

    const [width, setWidth] = useState(0);
    const handleResize = useCallback(
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById(`language-selector-${myId}`);
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    useEffect(() => {
        if (languageSettings && languageSettings?.languages) {
            let l = Object.entries(languageSettings.languages)
                .filter(([languageName, languageSetting]) => languageSetting?.show)
                .map(([languageName, languageSetting]) => languageName);
            l.unshift(MODEL_DEFAULT_LANGUAGE);
            setLanguagesArray(l);
            if (!languageSettings.default) {
                setLanguage(MODEL_DEFAULT_LANGUAGE);
            } else if (languageSettings && languageSettings?.default) {
                // Only set the language if it was not set or changed to avoid mutually recursive endless loop with App.[language]
                if (language === undefined || language !== languageSettings.default) {
                    setLanguage(languageSettings.default);
                }
            } else {
                setLanguage(""); // Set to model default language
            }
        }
    }, [languageSettings]);

    useEffect(() => {
        setInputValue(language);
    }, [language]);

    const handleInputChange = (event, newInputValue, reason) => {
        // Update local state only, do not call setLanguage until they have finished editing
        if (reason === 'input') {
            setInputValue(newInputValue);
        }
    };
    
    const handleBlur = () => {
        // Call setLanguage only if the input value is different from the current language
        // and not empty, indicating the user has finished typing and clicked away
        if (!inputValue) {
            setLanguage(MODEL_DEFAULT_LANGUAGE);
        } else if (inputValue && inputValue !== language) {
            setLanguage(inputValue);
        }
    };

    const handleLanguageChange = (event, newValue) => {
        setLanguage(newValue);
        event.target.blur();
    }

    return (
        languagesArray && language !== undefined &&
        <Box id={`language-selector-${myId}`} style={{ display: "flex", flexDirection: "row" }}>
            <Autocomplete
                id={`language-selector-${myId}`}
                sx={{ width: '240px', minHeight: 'auto', maxHeight: "80px", }}
                variant = 'outlined'
                options={languagesArray}
                getOptionLabel={(option) => option}
                value={language}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onInputChange={handleInputChange}
                onChange={handleLanguageChange}
                onBlur={handleBlur}
                freeSolo
                renderInput={(params) => 
                    <TextField {...params} 
                        sx={{
                            '& .MuiInputBase-input': {
                            color: theme.palette.primary.main, // Set text color to theme's primary color
                            },
                        }}
                        label= {language ? "" : "Set Language"}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {params.InputProps.endAdornment}
                                    {isHovered &&
                                        <InputAdornment position="end">
                                            <Tooltip title={`Set the language the AI should respond in by selecting one from the list or typing it in. Select '${MODEL_DEFAULT_LANGUAGE}' to not specify a language and let the model decide.`}>
                                                <IconButton>
                                                    <HelpOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    }
                                </>
                            ),
                        }}
                    />
                }
            />
        </Box>
    );
}
);

export default LanguageSelector;