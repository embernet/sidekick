# Local installation

## Prerequisites

- You will need your own OpenAI API key to use this application.
  - You can get one [here](https://beta.openai.com/).
  - This will enable Sidekick to use the OpenAI API to generate responses to your prompts.
- You will need to create your own JWT_SECRET.
  - This should be a randome alphanumeric string of at leat 32 characters
  - This is for encrypting JSON Web Tokens used to secure the server REST end-points

Create a .env file in the server directory to store the keys

```
OPENAI_API_KEY=<Your-OpenAI-API-Key>
JWT_SECRET=<Your-JWT-SECRET>
```

## Installation

### Clone this repository

Using git:
```shell
git clone git@github.com:embernet/sidekick.git
```

Or if you are using GitHub CLI:
```shell
gh repo clone embernet/sidekick
```

### Build the server

```shell
cd server
make 
```

If you don't have make or other dependencies like pipenv or want to do it manually:

```shell
sudo apt install python3-pip
pip3 install --user pipenv
pipenv install
```

This will install all the required python libraries, which are listed in the Pipfile.

### Building the web_ui

```shell
cd web_ui
npm install
```

This will install all the required node libraries, which are listed in the package.json.

### Running the application in development mode

From the sidekick root directory, `make run-locally`
This will run the server and web_ui in the background, with their console output being displayed in that terminal window, and open the web UI in your browser.

or:

**In terminal 1:**

```shell
cd server
make run-dev-locally
```

or

```shell
cd server
pipenv run python sidekick_server.py
```

**In terminal 2:**

```shell
cd web-ui
make run-dev-locally
```

or

```shell
cd web-ui
npm start
```

In this case, the server and web_ui will run in the foreground in separate terminal windows, and you will need to keep the terminal windows open while you are using the application.

### Running the application in production mode

**In terminal 1:**

For production, we use gunicorn instead of flask's built-in server, to get better performance and scalability.

```shell
cd server
make run-prod-locally
```

or

```shell
cd server
pipenv run gunicorn -w 4 -b 0.0.0.0:5003 sidekick_server:app
```

-w 4 means run 4 worker processes
-b binds the server to that network interface and port

**In terminal 2:**

Instead of the npm webserver we use the npx serve webserver, which is more suitable for production.

```shell
cd web-ui
make run-prod-locally
```

or

```shell
cd web-ui
npm run build
npx serve -s build
```

### Stop the application locally

If you are running the web_ui client and sidekick_server services in the foreground in their own terminal windows, you can stop them by pressing `Ctrl-C` in each of the terminal windows.

If you ran them in the background using `make run-locally`, you can stop them by running `ps -ef | grep sidekick` and killing the two main sidekick processes wil `kill <PID>`.

### Troubleshooting

If you get an error, check out the [troubleshooting guide](docs/troubleshooting.md).
