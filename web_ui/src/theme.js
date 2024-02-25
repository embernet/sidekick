import { createTheme } from '@mui/material/styles';
import { styled } from '@mui/system';
import { Toolbar, Box, List } from '@mui/material';

import { blue, grey } from '@mui/material/colors';

export const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#2AA4F3',
      },
      secondary: {
        main: '#86DAF7',
      },
      error: {
        main: '#red',
      },
      background: {
        default: '#fff',
      },
    },
  });

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? blue[900] : theme.palette.primary.main,
}));

export const SecondaryToolbar = styled(Toolbar)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? grey[900] : grey[300],
}));

export const StyledBox = styled(Box)(({ theme }) => ({
    overflow: 'auto',
    flex: 1,
    minHeight: '300px',
    '&::-webkit-scrollbar': {
      width: '0.4em',
    },
    '&::-webkit-scrollbar-track': {
      boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
      outline: '1px solid slategrey',
    },
}));

export const StyledList = styled(List)(({ theme }) => ({
  overflow: 'auto',
  flex: 1,
  minHeight: '300px',
  '&::-webkit-scrollbar': {
    width: '0.4em',
  },
  '&::-webkit-scrollbar-track': {
    boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    outline: '1px solid slategrey',
  },
}));
