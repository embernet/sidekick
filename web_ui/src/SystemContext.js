import React, { createContext, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

export const SystemContext = createContext();

export const SystemProvider = ({ serverUrl, children }) => {
  const [system, setSystem] = useState({
    serverUp: false,
    checkServerUp: () => {
      axios.get(`${serverUrl}/ping`).then(response => {
        console.log("Ping response: ", response);
        setSystem((prevSystem) => ({
          ...prevSystem,
          serverUp: true,
        }));
      }).catch(error => {
          console.error(error);
          setSystem((prevSystem) => ({
            ...prevSystem,
            serverUp: false,
          }));
        });    
    },
    setServerUp: (state) => {
      setSystem((prevSystem) => ({
        ...prevSystem,
        serverUp: state,
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
