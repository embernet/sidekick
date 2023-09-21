import React, { createContext, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

export const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const [system, setSystem] = useState({
    serverUp: { status: false, timestamp: Date.now() },
    setServerUp: (state) => {
      setSystem((prevSystem) => ({
        ...prevSystem,
        serverUp: { status: state, timestamp: Date.now() },
      }));
    },
    error: (message) => {
      toast.error(message);
    },
    info: (message) => {
      toast.info(message);
    },
    log: (message) => {
      axios.post('/log', { message }).catch((error) => {
        console.error(error);
      });
    },
  });

  return <SystemContext.Provider value={system}>{children}</SystemContext.Provider>;
};
