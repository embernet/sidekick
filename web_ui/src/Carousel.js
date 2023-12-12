// Carousel component
// Props:
// imageFolderName: string, e.g. './images/'
// filenamePrefix: string, e.g. 'logo'
// filenameExtension: string, e.g. '.png'
// altText: string, e.g. 'Sidekick logo'
// transitions: integer, number of random images to pick to cycle through, e.g. 5
// cycleTime: integer, milliseconds between transitions, e.g. 250

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

const Carousel = ({imageFolderName, filenamePrefix, filenameExtension, altText, 
    transitions, cycleTime, imageHeight='100%', imageWidth='auto'}) => {
    const images = [];
    const [imageIndex, setImageIndex] = useState(7);
    const [isCycling, setIsCycling] = useState(true);
    const [randomImages, setRandomImages] = useState([]);

    transitions = parseInt(transitions);
    cycleTime = parseInt(cycleTime);

    const imageContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: imageHeight,
        overflow: 'hidden',
    };

    const imageStyle = {
        width: imageWidth,
        height: imageHeight,
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '50%',
        backgroundColor: 'transparent',
    };

    for (let i = 0; i <= 24; i++) {
        const logo = require(`${imageFolderName}${filenamePrefix}${i}${filenameExtension}`);
        images.push(logo);
    }

    const handleImageClick = () => {
        setImageIndex(7);
        setIsCycling(true);
    };

    useEffect(() => {
        let interval = null;
        
        if (isCycling) {
            const n = images.length - 1;
            setRandomImages(images.sort(() => 0.5 - Math.random()).slice(0, transitions));
            const end = transitions -1;
            setImageIndex(0);
        interval = setInterval(() => {
            setImageIndex((index) => {
                if (index < transitions - 1) {
                    return (index + 1) % n;
                } else {
                    setIsCycling(false);
                    return end;
                }
            });
        }, cycleTime);
        }
        return () => clearInterval(interval); 
    }, [isCycling]);

    return (
        <Box style={imageContainerStyle}>
        <img
            src={randomImages[imageIndex]}
            alt={altText}
            style={{ ...imageStyle, zIndex: 2 }}
            onClick={handleImageClick}
        />
        </Box>
    );
};

export default Carousel;
