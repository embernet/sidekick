// SidekickClipboard
// This class is a wrapper around the Clipboard API that provides a way to copy and paste data to and from the clipboard.
// It also maintains an internal clipboard for Sidekick objects.
//
// When copying to the system clipboard to provide another representation,
// you can also provide a sideKickObject to provide an internal markdown represenattion, e.g.
// sidekickClipboard.write({
//     html: new ContentFormatter(menuMessageContext.message.content).asHtml(),
//     sidekickObject: { markdown: menuMessageContext.message.content },
// })
//
// When copying internal objects to be able to paste with semantic awareness,
// you can also add a text or html representation to go into the system clipboard

export default class SidekickClipboard {
    constructor() {
        // store the checksum of copy data to detect if the clipboard has been changed outside of the application
        this.clipboardChecksum = undefined;
        // store the sidekick object that was copied
        this.sidekickClipboardObject = undefined;
        // text clipoard content is stored in the clipboard itself
        // so if someone copies something there outside the application, we can detect it
        // and still paste that rather than only remembering things copied inside the application
    }

    // _calculateChecksum is a private method that calculates a checksum for the data
    // This is used to detect if the clipboard has been changed outside of the application
    _calculateChecksum = async (data) => {
        const encoder = new TextEncoder();
        const dataAsBuffer = encoder.encode(data);
        const hashAsBuffer = await window.crypto.subtle.digest('SHA-256', dataAsBuffer);
        const hashAsArray = Array.from(new Uint8Array(hashAsBuffer));
        const hashAsString = hashAsArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashAsString;
    };

    async writeText(text) {
        return new Promise((resolve, reject) => {
            navigator.clipboard.writeText(text).then(() => {
                this.localChecksum = this._calculateChecksum(text);
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    //TODO make this an sidekickClipboardItem object that is passed in rather than a dictionary
    write = async (sidekickClipboardItems) => {
        // sidekickClipboardItems is a dictionary of the data to be copied to the clipboard
        // Each item is a different representation of the same content
        // It must include:
        //   text
        // It may include:
        //   sidekickObject
        //   html
        return new Promise((resolve, reject) => {
            try {
                let item;
                if (sidekickClipboardItems?.html) {
                    const htmlBlob = new Blob([sidekickClipboardItems.html], { type: 'text/html' });
                    item = new ClipboardItem({ 'text/html': htmlBlob });
                } else if (sidekickClipboardItems?.text) {
                    const textBlob = new Blob([sidekickClipboardItems.text], { type: 'text/plain' });
                    item = new ClipboardItem({ 'text/plain': textBlob });
                }

                navigator.clipboard.write([item]).then(() => {
                    this._calculateChecksum(sidekickClipboardItems.text).then((checksum) => {
                        this.clipboardChecksum = checksum;
                        this.sidekickClipboardObject = sidekickClipboardItems?.sidekickObject;
                        resolve();
                    }
                    ).catch(err => {
                        reject(err);
                    });
                }
                ).catch(err => {
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        }
        );
    }

    // return the text from the system clipboard
    readText = async () => {
        return new Promise((resolve, reject) => {
            navigator.clipboard.readText().then(text => {
                resolve(text);
            }).catch(err => {
                reject(err);
            });
        });
    }

    read = async () => {
        return new Promise((resolve, reject) => {
            navigator.clipboard.readText().then(text => {
                this._calculateChecksum(text).then((systemClipboardChecksum) => {
                    if (systemClipboardChecksum !== this.clipboardChecksum) {
                        this.sidekickClipboardObject = undefined;
                        this.clipboardChecksum = undefined;
                    }
                    // the text representation is always stored in the system clipboard
                    // the sidekick object is returned if the checksums for the text representations match
                    resolve({text: text, sidekickObject: this.sidekickClipboardObject});
                }
                ).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
}