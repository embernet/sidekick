// NativeTextEditor.js
// NativeTextEditor provides a higher performance alternative to the React TextField component.
// It uses a div with a reference to the DOM element instead of TextField's stateful component.
// For large text content, TextField lag in rendering individual key strokes is unacceptable
// NativeTextEditor is a simple editable div with its own event handling.
// It can support much larger input sizes without introducing unacceptable lag to the UX.

export default class NativeTextEditorEventHandlers {
    constructor({sidekickClipboard, hotkeyHandlers}) {
        this.sidekickClipboard = sidekickClipboard;
        this.hotkeyHandlers = hotkeyHandlers;
        this.markdownHotkeys = {
            'b': { insertBeforeSelection: '**', insertAfterSelection: '**' }, // bold
            'i': { insertBeforeSelection: '_', insertAfterSelection: '_' },  // italic
            'u': { insertBeforeSelection: '', insertAfterSelection: '' }, // underline not supported in markdown, but disable the browser's default behavior
            'k': { insertBeforeSelection: '[', insertAfterSelection: '](url)' }, // link
            'k1': { insertBeforeSelection: '[pagename](', insertAfterSelection: ')' }, // link
        };
    }
    
    onPaste = async (event) => {
        event.preventDefault();
        const clipboard = await this.sidekickClipboard.read();
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;
        selection.deleteFromDocument();
        const range = selection.getRangeAt(0);
        if (clipboard?.sidekickObject?.markdown) {
            range.insertNode(document.createTextNode(clipboard.sidekickObject.markdown));
        } else {
            range.insertNode(document.createTextNode(clipboard?.text || ""));
        }
        range.collapse(false);
    }

    handleMarkdownHotkeys = (event) => {
        try {
            const markdown = this.markdownHotkeys[event.key];
            if (markdown)
            {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();

                // Create two text nodes for before and after the selected text
                const markdownBefore = markdown.insertBeforeSelection;
                const markdownAfter = markdown.insertAfterSelection;
            
                // Delete the selected text (if any)
                range.deleteContents();

                if (event.key === 'k') {
                    if (selectedText.toLowerCase().startsWith('http')) {
                        const beforeNode = document.createTextNode(this.markdownHotkeys['k1'].insertBeforeSelection);
                        const afterNode = document.createTextNode(this.markdownHotkeys['k1'].insertAfterSelection);
                        range.insertNode(afterNode);
                        range.insertNode(document.createTextNode(selectedText));
                        range.insertNode(beforeNode);
                        range.setStart(beforeNode, 1);
                        range.setEnd(beforeNode, beforeNode.length - 3 + 1);
                    } else {
                        const newNode = document.createTextNode(markdownBefore + selectedText + markdownAfter);
                        range.insertNode(newNode);
                        range.setStart(newNode, markdownBefore.length + selectedText.length + 2);
                        range.setEnd(newNode, markdownBefore.length + selectedText.length + markdownAfter.length - 1);
                    }

                } else {
                    // Check the surrounding text to see if the markdown is already in place
                    // and hence we need to remove it or not and hence we need to add it
                    const beforeRange = document.createRange();
                    beforeRange.setStart(range.startContainer, 0);
                    beforeRange.setEnd(range.startContainer, range.startOffset);
                    const beforeText = beforeRange.toString().slice(-markdownBefore.length);

                    const afterRange = document.createRange();
                    afterRange.setStart(range.endContainer, range.endOffset);
                    afterRange.setEnd(range.endContainer, range.endContainer.length);
                    const afterText = afterRange.toString().substring(0, markdownAfter.length);

                    if (beforeText === markdownBefore && afterText === markdownAfter) {
                        // If the beforeNode, afterNode, and startOfLine text is already present, remove it
                        const totalRange = document.createRange();
                        totalRange.setStart(range.startContainer, range.startOffset - markdownBefore.length);
                        totalRange.setEnd(range.endContainer, range.endOffset + markdownAfter.length);
                        totalRange.deleteContents();
                        const newNode = document.createTextNode(selectedText);
                        totalRange.insertNode(newNode);
                        // re-select the text
                        // Create a new range to select the text in the new node
                        const newRange = document.createRange();
                        newRange.setStart(newNode, 0);
                        newRange.setEnd(newNode, newNode.nodeValue.length);

                        // Set the selection to the new range
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    } else {
                        // Add the markdown syntax
                        const newText = markdownBefore.toString() + selectedText + markdownAfter.toString();
                        range.deleteContents();
                        const newNode = document.createTextNode(newText);
                        range.insertNode(newNode);

                        // Update the range to point to the new text node
                        range.setStart(newNode, 0);
                        range.setEnd(newNode, newNode.length);

                        // Select the text that was previously selected or place the cursor between the markdown syntax
                        if (selectedText === '') {
                            range.setStart(newNode, markdownBefore.length);
                            range.setEnd(newNode, markdownBefore.length);
                        } else {
                            range.setStart(newNode, markdownBefore.length);
                            range.setEnd(newNode, markdownBefore.length + selectedText.length);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error handling markdown hotkey', error);
        }
    }

    onKeyDown = (event) => {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 's') {
                event.preventDefault();
                if (this.hotkeyHandlers?.save) {
                    this.hotkeyHandlers.save();
                }
            } else if ((event.ctrlKey || event.metaKey) && event.key in this.markdownHotkeys)
            {
                event.preventDefault();            
                this.handleMarkdownHotkeys(event);
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
        borderRadius: "4px",
        fontSize: "1rem",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    }
}
