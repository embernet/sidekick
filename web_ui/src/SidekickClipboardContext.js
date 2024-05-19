import React from 'react';
import SidekickClipboard from './SidekickClipboard';

// Create a singleton instance of SidekickClipboard
export const sidekickClipboard = new SidekickClipboard();
// Create a context to make this accessible to all components
export const SidekickClipboardContext = React.createContext(sidekickClipboard);
