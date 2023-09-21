// This file is used by the web_ui to determine the server url to use when making requests.
// This is copied over ServerUrlThunk.js during the build process for the docker image.
export const runtimeEnvironment = {
    sidekickMode: "docker",
    serverHost: "http://localhost",
    serverPort: "8081"
}

