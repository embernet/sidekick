// NativeTextEditor.js
// NativeTextEditor provides a higher performance alternative to the React TextField component.
// It uses a div with a reference to the DOM element instead of TextField's stateful component.
// For large text content, TextField lag in rendering individual key strokes is unacceptable
// NativeTextEditor is a simple editable div with its own event handling.
// It can support much larger input sizes without introducing unacceptable lag to the UX.

import { grey } from '@mui/material/colors';

export default class NativeTextEditorEventHandlers {
    constructor({hotkeyHandlers, darkMode}) {
        this.hotkeyHandlers = hotkeyHandlers;
        this.darkMode = darkMode;
    }
    
    onPaste = (event) => {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;
        selection.deleteFromDocument();
        const range = selection.getRangeAt(0);
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
    }

    onKeyDown = (event) => {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 's') {
                event.preventDefault();
                if (this.hotkeyHandlers?.save) {
                    this.hotkeyHandlers.save();
                }
            } else if (
                event.key !== 'c' && 
                event.key !== 'v' && 
                event.key !== 'x' &&
                event.key !== 'z' &&
                event.key !== 'y' &&
                event.key !== 'f' &&
                event.key !== 'g' &&
                event.key !== 'a')
            {
                // for now, throw away attempts at using hotkeys for formatting
                // if we don't do this, the defult div behaviour
                // is to do thinks like bold selected text when ctrl+b is pressed
                // This is a markdown editor, so we don't want that
                // we can add event.key === 'b' text later to do things like that
                event.preventDefault();
            }
        } 
        if (event.key === 'Tab') {
            event.preventDefault();
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const tabNode = document.createTextNode('\t');
            range.insertNode(tabNode);
            range.collapse(false);
        }
    }

    style = {
        overflow: "auto",
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        outline: 'none',
        resize: 'none',
        width: '100%',
        height: '100%',
        padding: '0',
        margin: '0',
        lineHeight: '1.5em',
        border: this.darkMode ? "1px solid rgba(200, 200, 200, 0.23)" : "1px solid rgba(0, 0, 0, 0.23)",
        backgroundColor: this.darkMode ? grey[900] : grey[100],
        borderRadius: "4px",
        fontSize: "1rem",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        color: this.darkMode ? "rgba(255, 255, 255, 0.87)" : "rgba(0, 0, 0, 0.87)",
    }
}
