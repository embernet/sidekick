import { marked } from 'marked';

class ContentFormatter {
    constructor(text) {
        this.text = text;
      }

    asHtml() {
        const htmlContent = marked(this.text);
        return htmlContent;
    }
}

export default ContentFormatter;