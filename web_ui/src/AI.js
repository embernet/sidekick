import axios from 'axios';

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
        await axios.post(`${this.serverUrl}/nametopic`, { "text": text }, {
            headers: {
                Authorization: 'Bearer ' + this.token
            }
        })
        .then((response) => {
            console.log("/nametopic response", response);
            response.data.access_token && this.setToken(response.data.access_token);
            if (response.data.success) {
                console.log("nameTopc result:", response.data.topic_name);
                result = response.data.topic_name;
            } else {
                this.system.error(`Error naming topic: ${response.error}`);
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
}

export default AI;
