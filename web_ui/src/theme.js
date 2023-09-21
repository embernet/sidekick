import { createTheme } from '@mui/material/styles';
import { styled } from '@mui/system';
import { Toolbar } from '@mui/material';

export const theme = createTheme({
    palette: {
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
    backgroundColor: theme.palette.secondary.main,
    gap: 2,
    }));
