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
    dateTimeString: () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const str = `${year}${month}${day}-${hours}${minutes}${seconds}`;
      return str;
    },
  });

  return <SystemContext.Provider value={system}>{children}</SystemContext.Provider>;
};
