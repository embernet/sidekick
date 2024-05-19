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
    write = async ({text, sidekickObject}) => {
        return new Promise((resolve, reject) => {
            try {
                navigator.clipboard.writeText(text).then(() => {
                    this._calculateChecksum(text).then((checksum) => {
                        this.clipboardChecksum = checksum;
                        this.sidekickClipboardObject = sidekickObject;
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
                    console.log("fubar", "Checksums", systemClipboardChecksum, this.clipboardChecksum, this.sidekickClipboardObject, text)
                    if (systemClipboardChecksum !== this.clipboardChecksum) {
                        console.log("fubar", "Clipboard has changed outside of the application")
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