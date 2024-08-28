import { useState, useEffect } from 'react';
import { Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Switch, FormControlLabel, TextField, Typography, Tooltip } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

const ShareButton = ({ id, name, visibility, setVisibility, shareData, setShareData, setShareStatusChanged }) => {
    const [isShared, setIsShared] = useState(visibility === 'shared');
    const [open, setOpen] = useState(false);

    const [formVisibility, setFormVisibility] = useState(visibility);
    const [formDescription, setFormDescription] = useState(shareData?.description || "");
    const [localShareData, setLocalShareData] = useState(shareData);

    useEffect(() => {
        setIsShared(visibility === 'shared');
        setFormVisibility(visibility);
        setFormDescription(shareData?.description || "");
        setLocalShareData(shareData);
    }, [visibility, shareData]);
    
    const handleVisibilityChange = (event) => {
        setIsShared(event.target.checked);
        setFormVisibility(event.target.checked ? 'shared' : 'private');
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleOk = () => {
        const updatedShareData = { ...localShareData, description: formDescription };
        setLocalShareData(updatedShareData);
        setShareData(updatedShareData); 
        setVisibility(formVisibility);
        setShareStatusChanged(Date.now());
        setOpen(false);
    };

    return (
        <Box>
            <Tooltip 
                title={visibility === 'shared' ?
                    "This item is shared, click to update sharing settings" :
                    "Click to share this item"
                }>
                <span>
                    <IconButton edge="start"
                        color="inherit"
                        onClick={() => setOpen(x=>!x)}>
                        {visibility === 'shared' ? <ShareIcon sx={{ color: "purple" }} /> : <ShareOutlinedIcon />}
                    </IconButton>
                </span>
            </Tooltip>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Share {name}</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={<Switch checked={isShared} onChange={handleVisibilityChange} />}
                        label="Shared"
                    />
                    {!isShared ? (
                        <Typography variant="body1">
                            Set this to shared to enable others to see it and clone it.
                        </Typography>
                    ) : (
                        <>
                            <Typography variant="body2" gutterBottom>
                                Provide a short description of what you are sharing and why and how it could be useful to others.
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                variant="outlined"
                                inputProps={{ maxLength: 400 }}
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {formVisibility !== visibility || formDescription !== shareData?.description ? (
                        <>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleOk}>OK</Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>Close</Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShareButton;