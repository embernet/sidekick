import { debounce } from "lodash";
import { useEffect, useState, useCallback } from 'react';
import { Card, Paper, Box, IconButton, Tooltip,
    Typography, TextField, Autocomplete, Slider, Switch, Stack } from '@mui/material';
import { ClassNames } from "@emotion/react";
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import HelpIcon from '@mui/icons-material/Help';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

import { StyledToolbar } from './theme';


const ModelSettings = ({setModelSettings, setFocusOnPrompt, 
    modelSettingsOpen, setModelSettingsOpen, windowPinnedOpen, setWindowPinnedOpen,
    temperatureText, setTemperatureText, settingsManager,
    chatStreamingOn, setChatStreamingOn}) => {

    const [mySettingsManager, setMySettingsManager] = useState(settingsManager);
    const [modelSettingsOptions, setModelSettingsOptions] = useState({});
    const [sliders, setSliders] = useState({});
    const [modelSettingsOptionsLoaded, setModelSettingsOptionsLoaded] = useState(false);
    const [loadingModelSettingsOptionsMessage, setLoadingModelSettingsOptionsMessage] = useState("Loading model settings options...");
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [modelOptions, setModelOptions] = useState(null);
    const [temperature, setTemperature] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [top_p, setTop_p] = useState(null);
    const [presence_penalty, setpresence_penalty] = useState(null);
    const [frequency_penalty, setfrequency_penalty] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const [settingsChanged, setSettingsChanged] = useState(false);
    const [settingsDifferentToFactoryDefaults, setSettingsDifferentToFactoryDefaults] = useState(false);

    const [width, setWidth] = useState(0);
    const handleResize = useCallback( 
        // Slow down resize events to avoid excessive re-rendering and avoid ResizeObserver loop limit exceeded error
        debounce((entries) => {
            entries && entries.length > 0 && setWidth(entries[0].contentRect.width);
        }, 100),
        []
    );

    useEffect(() => {
        const element = document.getElementById("model-settings-panel");
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length > 0 && entries[0].target === element) {
              handleResize();
            }
        });
        element && observer.observe(element);
        return () => observer.disconnect();
    }, [handleResize]);

    const setModelSettingsOptionsFromData = (data) => {
        setModelSettingsOptions(data.model_settings);
        setSliders(data.sliders);
        const provider = data.model_settings.userDefault ? data.model_settings.userDefault : data.model_settings.default;
        setSelectedProvider(provider);
        setSelectedModel(data.model_settings.providers[provider].userDefault ? data.model_settings.providers[provider].userDefault : data.model_settings.providers[provider].default);
        setModelOptions(Object.keys(data.model_settings.providers[data.model_settings.userDefault ? data.model_settings.userDefault : data.model_settings.default].models));
        setTemperature(data.sliders.temperature.userDefault ? data.sliders.temperature.userDefault : data.sliders.temperature.default);
        setTop_p(data.sliders.top_p.userDefault ? data.sliders.top_p.userDefault : data.sliders.top_p.default);
        setpresence_penalty(data.sliders.presence_penalty.userDefault ? data.sliders.presence_penalty.userDefault : data.sliders.presence_penalty.default);
        setfrequency_penalty(data.sliders.frequency_penalty.userDefault ? data.sliders.frequency_penalty.userDefault : data.sliders.frequency_penalty.default);
        setModelSettingsOptionsLoaded(true);
    }

    useEffect(()=>{
        mySettingsManager.loadSettings("model_settings",
            (data) => {
                setModelSettingsOptionsFromData(data);
            },
            (error) => {
                console.log("get prompt_parts:", error);
                setLoadingModelSettingsOptionsMessage("Error loading model settings options: " + error);
            }
        )
    }, []);

    useEffect(() => {
        setSettingsChanged(true);
        setSettingsChanged(
            (selectedProvider !== modelSettingsOptions?.userDefault) ||
            (selectedModel !== modelSettingsOptions.providers[selectedProvider]?.userDefault) ||
            (temperature !== sliders.temperature?.userDefault) ||
            (top_p !== sliders.top_p?.userDefault) ||
            (presence_penalty !== sliders.presence_penalty?.userDefault) ||
            (frequency_penalty !== sliders.frequency_penalty?.userDefault)
        );
        setSettingsDifferentToFactoryDefaults(
            (selectedProvider !== modelSettingsOptions.default) ||
            (selectedModel !== modelSettingsOptions.providers[selectedProvider].default) ||
            (temperature !== sliders.temperature.default) ||
            (top_p !== sliders.top_p.default) ||
            (presence_penalty !== sliders.presence_penalty.default) ||
            (frequency_penalty !== sliders.frequency_penalty.default)
        );
    }, [selectedProvider, selectedModel, temperature, top_p, presence_penalty, frequency_penalty]);

    const saveUserDefaults = () => {
        // Save current settings as user defaults
        let m = modelSettingsOptions;
        m.userDefault = selectedProvider;
        m.providers[selectedProvider].userDefault = selectedModel;
        let s = sliders;
        s.temperature.userDefault = temperature;
        s.top_p.userDefault = top_p;
        s.presence_penalty.userDefault = presence_penalty;
        s.frequency_penalty.userDefault = frequency_penalty;

        const settings = {
            "model_settings": m,
            "sliders": s
        }
        console.log("ModelSettings.saveUserDefaults:", settings);
        mySettingsManager.setAll(settings);
        setSettingsChanged(false);
    };

    const restoreSystemDefaultSettings = () => {
        let m = modelSettingsOptions;
        m.userDefault = null;
        m.providers[selectedProvider].userDefault = null;
        let s = sliders;
        s.temperature.userDefault = null;
        s.top_p.userDefault = null;
        s.presence_penalty.userDefault = null;
        s.frequency_penalty.userDefault = null;

        const settingsData = {
            "model_settings": m,
            "sliders": s
        }
        console.log("ModelSettings.restoreSystemDefaults:", settingsData);
        setModelSettingsOptionsFromData(settingsData);
        mySettingsManager.setAll(settingsData);
        setSettingsChanged(false);
    };

    const handleProviderChange = (event, value) => {
        if (value === null) {
            return;
        }
        setSelectedProvider(value);
        setModelOptions(Object.keys(modelSettingsOptions.providers[value].models));
        setSelectedModel(modelSettingsOptions.providers[value].default);
    };

    const handleModelChange = (event, value) => {
        if (value === null) {
            return;
        }
        setSelectedModel(value);
    };

    const handleTemperatureChange = (event, value) => {
        setTemperature(value);
    };

    const handleTop_pChange = (event, value) => {
        setTop_p(value);
    };

    const handlepresence_penaltyChange = (event, value) => {
        setpresence_penalty(value);
    };

    const handlefrequency_penaltyChange = (event, value) => {
        setfrequency_penalty(value);
    };

    const handleToggleHelp = () => {
        let newState = !showHelp;
        setShowHelp(newState);
        setFocusOnPrompt(true)
    };

    const handleToggleModelSettings = () => {
        let newState = !modelSettingsOpen;
        setModelSettingsOpen(newState);
        localStorage.setItem('modelSettingsOpenDefault', newState);
        setFocusOnPrompt(true)
    };

    const shareModelSettings = () => {
        let newModelSettings = {
            "provider": selectedProvider,
            "request": {
                "model": selectedModel,
                "temperature": temperature,
                "top_p": top_p,
                "presence_penalty": presence_penalty,
                "frequency_penalty": frequency_penalty,
            }
        }
        console.log(newModelSettings);
        setModelSettings(newModelSettings);
    };

    const getTemperatureText = (temperature) => {
        if (temperature < 0.3) {
            return 'Consistent';
        } else if (temperature < 0.6) {
            return 'Balanced';
        } else if (temperature <= 1.0) {
            return 'Creative';
        } else {
            return 'Volatile';
        }
    };

    useEffect(() => {
        if (modelSettingsOptionsLoaded) {
            shareModelSettings();
            setTemperatureText(getTemperatureText(temperature));
            setFocusOnPrompt(true);
        }
    }, [selectedProvider, selectedModel, temperature, top_p, presence_penalty, frequency_penalty]);

    const loadingRender =
        <Card
            sx={{ display:"flex", flexDirection:"column", padding:"6px", margin:"6px", 
            flex:1, minWidth: "380px", maxWidth: "450px" }}>
            <Typography>{loadingModelSettingsOptionsMessage}</Typography>
        </Card>;

    const loadedRender = modelSettingsOptionsLoaded && 
        <Box sx = {{ display: "flex", flexDirection:"column", overflow:"auto", flex: 1 }}>
            <Typography variant="caption" sx={{ mt: 1 }}>Change models and settings to change behaviour and capability to suite your needs.</Typography>
            {Object.keys(modelSettingsOptions.providers).length === 1 ? (
                <TextField
                    id="single-provider"
                    label="Provider"
                    autoComplete='off'
                    value={Object.keys(modelSettingsOptions.providers)[0]}
                    InputProps={{ readOnly: true }}
                    sx={{ mt: 2, mb: 3 }}
                />
                ) : (
                    <Autocomplete
                    disablePortal
                    id="provider"
                    options={Object.keys(modelSettingsOptions.providers)}
                    defaultValue={modelSettingsOptions.default}
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    sx={{ mt: 2, mb: 3 }}
                    freeSolo={false}
                    renderInput={(params) => <TextField {...params} label="Provider" />}
                />
            )}
            <Autocomplete
                disablePortal
                id="model"
                options={modelOptions}
                defaultValue={modelSettingsOptions.providers[selectedProvider].default}
                value={selectedModel}
                onChange={handleModelChange}
                sx={{ mt: 2, mb: 3 }}
                renderInput={(params) => <TextField {...params} label="Model" />}
            />

            {/* This option to turn off streaming was only added for testing
                in some environments where streaming was blocked. It is not
                a good user experience and hence is not exposed to the user.
            <Paper sx={{ margin: 1, padding : "6px 20px" }}>
            <Box sx={{ display: 'flex', flexDirection: "column" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h7">Streaming:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Switch
                        checked={chatStreamingOn}
                        onChange={() => setChatStreamingOn(!chatStreamingOn)}
                        name="chatStreamingOn"
                        inputProps={{ 'aria-label': 'toggle chat streaming' }}
                        />
                        <Typography>{chatStreamingOn ? "On" : "Off"}</Typography>
                    </Box>
                </Stack>
                { showHelp ? <Typography variant="caption">
                    When streaming is on, the response is displayed to the user as it is generated. When off, the response is displayed only after the model has finished generating the response. Streaming can be blocked by some network and security setups, so turn this off if you are having problems.
                </Typography> : null }
            </Box>
            </Paper> */}

            <Paper sx={{ margin: 1, padding : "6px 20px" }}>
                <Typography variant="h7">temperature {temperature} ({temperatureText})</Typography>
                <Slider
                    sx={{ mt: 2, mb: 3 }}
                    aria-label={sliders.temperature.caption}
                    label={sliders.temperature.caption}
                    value={temperature}
                    onChange={handleTemperatureChange}
                    onChangeCommitted={() => {setFocusOnPrompt(true)}}
                    getAriaValueText={() => { return temperature }}
                    valueLabelDisplay="auto"
                    step={sliders.temperature.step}
                    marks={sliders.temperature.marks}
                    min={sliders.temperature.min}
                    max={sliders.temperature.max}
                    defaultValue={sliders.temperature.default}
                    />
                { showHelp ? <Typography variant="caption">{sliders.temperature.caption}</Typography> : null }
            </Paper>
            <Paper sx={{ margin: 1, padding : "6px 20px" }}>
                <Typography variant="h7">top_p {top_p}</Typography>
                <Slider
                    sx={{ mt: 2, mb: 3 }}
                    aria-label={sliders.top_p.caption}
                    label={sliders.top_p.caption}
                    value={top_p}
                    onChange={handleTop_pChange}
                    onChangeCommitted={() => {setFocusOnPrompt(true)}}
                    getAriaValueText={() => { return top_p }}
                    valueLabelDisplay="auto"
                    step={sliders.top_p.step}
                    marks={sliders.top_p.marks}
                    min={sliders.top_p.min}
                    max={sliders.top_p.max}
                    defaultValue={sliders.top_p.default}
                    />
                { showHelp ? <Typography variant="caption">{sliders.top_p.caption}</Typography> : null }
            </Paper>
            <Paper sx={{ margin: 1, padding : "6px 20px" }}>
                <Typography variant="h7">presence_penalty {presence_penalty}</Typography>
                <Slider
                    sx={{ mt: 2, mb: 3 }}
                    aria-label={sliders.presence_penalty.caption}
                    label={sliders.presence_penalty.caption}
                    value={presence_penalty}
                    onChange={handlepresence_penaltyChange}
                    onChangeCommitted={() => {setFocusOnPrompt(true)}}
                    getAriaValueText={() => { return presence_penalty }}
                    valueLabelDisplay="auto"
                    step={sliders.presence_penalty.step}
                    marks={sliders.presence_penalty.marks}
                    min={sliders.presence_penalty.min}
                    max={sliders.presence_penalty.max}
                    defaultValue={sliders.presence_penalty.default}
                />
                { showHelp ?<Typography variant="caption">{sliders.presence_penalty.caption}</Typography> : null }
            </Paper>
            <Paper sx={{ margin: 1, padding : "6px 20px" }}>
                <Typography variant="h7">frequency_penalty {frequency_penalty}</Typography>
                <Slider
                    sx={{ mt: 2, mb: 3 }}
                    aria-label={sliders.frequency_penalty.caption}
                    label={sliders.frequency_penalty.caption}
                    value={frequency_penalty}
                    onChange={handlefrequency_penaltyChange}
                    onChangeCommitted={() => {setFocusOnPrompt(true)}}
                    getAriaValueText={() => { return frequency_penalty }}
                    valueLabelDisplay="auto"
                    step={sliders.frequency_penalty.step}
                    marks={sliders.frequency_penalty.marks}
                    min={sliders.frequency_penalty.min}
                    max={sliders.frequency_penalty.max}
                    defaultValue={sliders.frequency_penalty.default}
                    />
                {showHelp ? <Typography variant="caption">{sliders.frequency_penalty.caption}</Typography> : null }
            </Paper>
        </Box>

    const render =
        <Card id="model-settings-panel" sx={{ display:"flex", flexDirection:"column", padding:"6px", margin:"6px", flex:1, minWidth:"380px", maxWidth: "450px" }}>
            <StyledToolbar className={ClassNames.toolbar} sx={{ gap: 1 }}>
                <TuneIcon/>
                <Typography sx={{mr:2}}>Settings</Typography>
                <Tooltip title={ "Save settings as user defaults" }>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label="Save settings as user defaults"
                            disabled={!settingsChanged} onClick={saveUserDefaults}>
                            <SaveIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={ "Restore system default settings" }>
                    <span>
                        <IconButton edge="start" color="inherit" aria-label="Restore system default settings"
                            disabled={!settingsDifferentToFactoryDefaults}
                            onClick={restoreSystemDefaultSettings}>
                            <SettingsBackupRestoreIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Box ml="auto">
                    <Tooltip title={showHelp ? "Hide help" : "Show help"}>
                        <IconButton onClick={handleToggleHelp}>
                            <HelpIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={windowPinnedOpen ? "Unpin window" : "Pin window open"}>
                        <IconButton onClick={() => { setWindowPinnedOpen(state => !state); }}>
                            {windowPinnedOpen ? <PushPinIcon /> : <PushPinOutlinedIcon/>}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Close window">
                        <IconButton onClick={handleToggleModelSettings}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Box>    
            </StyledToolbar>
            {modelSettingsOptionsLoaded ? loadedRender : loadingRender}
        </Card>

    return ( modelSettingsOpen ? render : null )

  }

  export default ModelSettings;