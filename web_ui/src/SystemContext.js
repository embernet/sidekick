import React, { createContext, useState } from 'react';
import axios from 'axios';

export const SystemContext = createContext();

export const SystemProvider = ({ serverUrl, setStatusUpdates, setModalDialogInfo, user, children }) => {

  const _dateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const str = `${year}${month}${day}-${hours}${minutes}${seconds}`;
    return str;
  };

  const _userDateTimeString = () => {
    const now = new Date();
    const dateTimeString = `${_dayOfWeek()} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return dateTimeString;
  };

  const _userTimeString = () => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return timeString;
  }

  const _dayOfWeek = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    return daysOfWeek[now.getDay()];
  }

  const [system, setSystem] = useState({
    serverUp: false,
    serverPinged: false,
    checkServerUp: () => {
      const pingUrl = `${serverUrl}/ping`;
      axios.get(pingUrl).then(response => {
        system.debug("Successfully contacted server.", response, pingUrl);
        setSystem((prevSystem) => ({
          ...prevSystem,
          serverUp: true,
          serverPinged: true,
        }));
      }).catch(error => {
          system.error("System Error contacting server.", error, pingUrl);
          setSystem((prevSystem) => ({
            ...prevSystem,
            serverUp: false,
            serverPinged: true,
          }));
        });
    },
    setServerUp: (state) => {
      setSystem((prevSystem) => ({
        ...prevSystem,
        serverUp: state,
        serverPinged: true,
      }));
    },
    error: (message, error=undefined, context=undefined) => {
      // message and context are strings, error is an object
      const errorStack = error && error.stack ? "\nStack: " + error.stack : "";
      const errorMessage = error && typeof error.toString === 'function' ? error.toString() : JSON.stringify(error);
      let displayMessage = `${message}${context ? "\nContext: " 
        + context : ""}${errorMessage ? "\nError: " + errorMessage : ""}${errorStack ? errorStack : ""}`;

      setModalDialogInfo({ title: "Error", message: displayMessage });
      setStatusUpdates(prevStatusUpdates => [...prevStatusUpdates, 
        { message: message, type: 'error', error: errorMessage, stack: errorStack, timestamp: _dateTimeString() }]);
        console.error(`[Error] ${message}`, `Context: ${context || 'N/A'}`, `Error Details: ${displayMessage}`, `Timestamp: ${_dateTimeString()}`);
    },
    announce: (title, message) => {
      setModalDialogInfo({ title: title, message: message });
    },
    warning: (message, context="") => {
      setModalDialogInfo({ title: "Warning", message: message });
      console.log(message, context);
    },
    info: (message, context="") => {
      setStatusUpdates(prevStatusUpdates => [...prevStatusUpdates, { message: message, type: 'info', timestamp: _dateTimeString() }]);
      console.log(message, context);
    },
    debug: (message, data=undefined, context="") => {
      // message and context are strings, data is an object
      console.debug(message, context, data ? data : "");
    },
    log: (message, context="") => {
      axios.post('/log', { message }).catch((error) => {
        console.error(error);
      });
    },
    dateTimeString: _dateTimeString,
    userDateTimeString: _userDateTimeString,
    userTimeString: _userTimeString,
    dayOfWeek: _dayOfWeek,
    user: user,
  });

  return <SystemContext.Provider value={system}>{children}</SystemContext.Provider>;
};
