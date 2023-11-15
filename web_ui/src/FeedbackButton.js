import React, { useEffect, useState, useContext } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import axios from 'axios';
import { styled } from '@mui/system';
import { ClassNames } from "@emotion/react";
import { Toolbar, Button, TextField, Typography, IconButton, Tooltip } from '@mui/material';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

import { SystemContext } from './SystemContext';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    gap: 2,
  }));

const FeedbackButton = ({icon, serverUrl, token, setToken}) => {
  const system = useContext(SystemContext);
  const [showModal, setShowModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(()=>{
    resetForm();
  }, [showModal]);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  function handleFeedbackTypeChange(event) {
    setFeedbackType(event.target.value);
  }

  function handleFeedbackTextChange(event) {
    setFeedbackText(event.target.value);
  }

  function handleModalClose() {
    setShowModal(false);
  }

  function handleModalOpen() {
    setShowModal(true);
  }

  function resetForm() {
    setFeedbackText('');
    setFeedbackType('comment');
  }

  function handleFeedbackSubmit() {
    let url = `${serverUrl}/feedback`;
    const request = {
        type: feedbackType,
        text: feedbackText
    }
    axios.post(url, request, {
        headers: {
            Authorization: 'Bearer ' + token
          }
    })
    .then(response => {
        console.log('Feedback submitted successfully');
        response.data.access_token && setToken(response.data.access_token);
        system.info('Feedback sent. Thank you for the feedback!');
        setShowModal(false);
    })
    .catch(error => {
      system.error(`System Error submitting feedback.`, error, url + " POST");
    });
  }

  return (
    <Box>
        <Tooltip title="Provide feedback">
            <IconButton onClick={handleModalOpen}>{icon}</IconButton>
        </Tooltip>
        {showModal && (
            <Modal
            open={showModal}
            onClose={handleModalClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="modal-content">
                    <StyledToolbar className={ClassNames.toolbar}>
                        {icon}
                        <Typography>Feedback</Typography>
                    </StyledToolbar>
                    <Box sx={{ mt: 2, width: "100%"}}>
                        <FormControl sx={{width: "100%"}}>
                            <FormLabel id="feedback-type" sx={{ width: "100%"}}>Feedback type</FormLabel>
                            <RadioGroup
                                sx={{ mb: 4 }}
                                row
                                aria-labelledby="feedback-type"
                                name="radio-feedback-type"
                                value={feedbackType}
                                onChange={handleFeedbackTypeChange}
                            >
                                <FormControlLabel value="comment" control={<Radio />} label="Comment" />
                                <FormControlLabel value="suggestion" control={<Radio />} label="Feature suggestion" />
                                <FormControlLabel value="bug" control={<Radio />} label="Bug report" />
                            </RadioGroup>
                            <TextField
                            sx={{ width: "100%", mb: 4 }}
                            id="feedback-text"
                            label="Feedback"
                            variant="outlined"
                            value={feedbackText}
                            onChange={handleFeedbackTextChange}
                            multiline
                            rows={8}
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button type="button" onClick={handleFeedbackSubmit} sx={{ mr: 1 }}>OK</Button>
                                <Button type="button" onClick={handleModalClose}>Cancel</Button>
                            </Box>
                        </FormControl>
                    </Box>
                </Box>
            </Modal>
        )}
    </Box>
  );
};

export default FeedbackButton;
