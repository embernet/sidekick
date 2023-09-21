import { marked } from 'marked';
import { useState } from 'react';

class ContentFormatter {
    constructor(content) {
        this.content = content;
      }

    copyAsHtml() {
        const plainTextContent = this.content;
        const htmlContent = marked(this.content);
        const dataTransfer = new DataTransfer();
        const textBlob = new Blob([htmlContent], { type: 'text/html' }); // Create a Blob object with the HTML content and media type
        const textFile = new File([textBlob], 'message.html', { type: 'text/html' }); // Create a File object from the Blob object
        dataTransfer.items.add(textFile); // Add the Blob object to the DataTransfer object
        const plainTextBlob = new Blob([plainTextContent], { type: 'text/plain' }); // Create a Blob object with the plain text content and media type
        const plainTextFile = new File([plainTextBlob], 'message.txt', { type: 'text/plain' }); // Create a File object from the Blob object
        dataTransfer.items.add(plainTextFile); // Add the plain text File object to the DataTransfer object
        navigator.clipboard.write([new ClipboardItem({ [textFile.type]: textFile })]); // Copy the DataTransfer object to the clipboard

    }
}

export default ContentFormatter;