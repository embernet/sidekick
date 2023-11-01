import axios from "axios";

class SettingsManager {
  constructor(dbUrl, token, setToken) {
    this.restUrl = dbUrl;
    this.token = token;
    this.setToken = setToken;
    this.settings = {};
  }

  loadSettings = (key, responseProcessor, errorProcessor) => {
    this.key = key;
    this.settings = {};

    axios.get(`${this.restUrl}/settings/${this.key}`, {
      headers: {
          Authorization: 'Bearer ' + this.token
        }
  })
      .then( response => {
        console.log(`settings/${this.key} response`, response);
        response.data.access_token && this.setToken(response.data.access_token);
        responseProcessor(response.data);
      }).catch( error => {
        const myError = new Error(`SettingsManager.loadSettings(${this.key}): ${error?.message}; ${error.response?.data}`, error)
        console.error(error);
        if (errorProcessor) {
          errorProcessor(myError);
        } else {
          throw myError;
        }
    });
  };


  get = (property) => {
    return this.settings[property];
  };

  set = (property, value) => {
    try {
      const updatedSettings = { ...this.settings, [property]: value };
      this.settings = updatedSettings;
      this.save();
    } catch (error) {
      console.error(error);
    }
  };

  setAll = (settings) => {
    try {
      this.settings = settings;
      this.save();
    } catch (error) {
      console.error(error);
    }
  }

  getAll = () => {
    return this.settings;
  }

  delete = (property) => {
    try {
      const updatedSettings = { ...this.settings };
      delete updatedSettings[property];
      this.settings = updatedSettings;
      this.save();
    } catch (error) {
      console.error(error);
    }
  }

  deleteAll = () => {
    try {
      this.settings = {};
      this.save();
    } catch (error) {
      console.error(error);
    }
  }

  save = () => {
    axios.put(`${this.restUrl}/settings/${this.key}`, this.settings, {
      headers: {
          Authorization: 'Bearer ' + this.token
        }
    }).then(response => {
        console.log("settings save response", response);
        response.data.access_token && this.setToken(response.data.access_token);
    }).catch(error => {
        console.error("settings save error", error);
    });
  }
} 

export default SettingsManager;
