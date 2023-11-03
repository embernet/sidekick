import axios from 'axios';

const NAMETOPIC_API = "/nametopic/v1";
const GENERATETEXT_API = "/generatetext/v1";

class AI {
    constructor(serverUrl, token, setToken, system) {
        this.serverUrl = serverUrl;
        this.token = token;
        this.setToken = setToken;
        this.system = system;
    }

    async nameTopic(text) {
        // Get GPT to name the topic based on the text
        let result = "";
        await axios.post(`${this.serverUrl}${NAMETOPIC_API}`, { "text": text }, {
            headers: {
                Authorization: 'Bearer ' + this.token
            }
        })
        .then((response) => {
            console.log(`${NAMETOPIC_API} response`, response);
            response.data.access_token && this.setToken(response.data.access_token);
            if (response.data.success) {
                console.log(`${NAMETOPIC_API} result:`, response.data.topic_name);
                result = response.data.topic_name;
            } else {
                this.system.error(`Error naming topic: ${response.data.error}`);
                result = "";
            }
        })
        .catch((error) => {
            console.log(error);
            this.system.error(`Error naming topic: ${error}`);
            result = "";
        });
        // remove surrounding quotes if they are there
        if ((result.startsWith('"') && result.endsWith('"'))
            || (result.startsWith("'") && result.endsWith("'"))) {
            result = result.slice(1, -1);
        }
        return result;
    }

    async generateText(context, request) {
        // generate text as specified in the request based on the context
        let result = "";
        await axios.post(`${this.serverUrl}${GENERATETEXT_API}`, { "context": context, "request": request }, {
            headers: {
                Authorization: 'Bearer ' + this.token
            }
        })
        .then((response) => {
            console.log(`${GENERATETEXT_API} response`, response);
            response.data.access_token && this.setToken(response.data.access_token);
            if (response.data.success) {
                console.log(`${GENERATETEXT_API} result:`, response.data.generated_text);
                result = response.data.generated_text;
            } else {
                this.system.error(`Error generating text: ${response.error}`);
                result = "";
            }
        })
        .catch((error) => {
            console.log(error);
            this.system.error(`Error generating text: ${error}`);
            result = "";
        });
        // remove surrounding quotes if they are there
        if ((result.startsWith('"') && result.endsWith('"'))
            || (result.startsWith("'") && result.endsWith("'"))) {
            result = result.slice(1, -1);
        }
        return result;
    }
}

export default AI;
