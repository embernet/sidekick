// This file is used by the web_ui to determine the server url to use when making requests.
// This is the default file used by the web_ui when running locally.
// It is overwritten by ServerUrlThunkForDocker.js during the build process for the docker image.
export const runtimeEnvironment = {
    sidekickMode: "local",
    serverHost: "http://localhost",
    serverPort: "5003"
};

