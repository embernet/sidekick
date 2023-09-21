# DevOps

## Overview

This project is a React Material UI web application with a Python Flask back end that uses the OpenAI API to enable chat with Large Language Models (LLMs) gpt3.5-turbo and gpt-4.

- The application is designed to be run in a Docker container, but can also be run locally.
- Running as docker containers is intended to be the primary way to run the application.
- Running locally is intended to be used for development and testing.
- The application is split into a multiple components, which can run on separate machines or on the same machine.
- Commands are from the project root directory unless otherwise stated.

## Working with the Docker images

The Docker images are built using the `Makefile` in the project root directory.

### Rebuild the server docker image

`make server build`

### Rebuild the web UI docker image

`make web-ui build`

### Rebuild the server and web UI docker images

`make build`

### Start the application in docker containers

`docker-compose up`

### Stop the application

`docker-compose down`

### See which docker containers are running

`docker ps`

### See which docker images are installed

`docker images`

### See the logs from the docker containers

`docker-compose logs sidekick-server`

`docker-compose logs sidekick-web-ui`

### See the logs from the docker containers in real time

`docker-compose logs -f sidekick-server`

## Working with the local deployment

### Start the application locally for production

From the sidekick root directory, `make run-locally`
This will run the server and web_ui in the background, with their console output being displayed in that terminal window, and open the web UI in your browser.

or:

In terminal 1:

```shell
cd server
make run-dev-locally
```

```shell
cd server
pipenv run python sidekick_server.py
```

In terminal 2:

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

### Start the application locally for development

From the sidekick root directory, `make run-locally`
This will run the server and web_ui in the background, with their console output being displayed in that terminal window, and open the web UI in your browser.

or:

In terminal 1:

```shell
cd server
pipenv run python sidekick_server.py
```

In terminal 2:

```shell
cd web-ui
npm start
```

In this case, the server and web_ui will run in the foreground in separate terminal windows, and you will need to keep the terminal windows open while you are using the application.

### Stop the application locally

If you are running the web_ui client and sidekick_server services in the foreground in their own terminal windows, you can stop them by pressing `Ctrl-C` in each of the terminal windows.

If you ran them in the background using `make run-locally`, you can stop them by running `ps -ef | grep sidekick` and killing the two main sidekick processes wil `kill <PID>`.

## Working with the application deployment

### Change the hostname or ports the application runs on

The sidekick-server and web-ui services run on different ports depending on whether the application is running locally or in a docker container. This enables you to run a dev/test and prod instance of the application on the same machine.

> [!NOTE]
> The default for running locally is 5003 for the server and 8080 for the web UI.
> The default for running in a docker container is 5004 for the server and 8081 for the web UI.

Currently the app supports running in two environments, docker container and locally, and the hostnames and ports are hard coded in several files. To change the ports the sidekick-server and sidekick-web-ui run on you will need to edit a the following files:

- `docker-compose.yml`
- `server/settings.yaml`
- `web-ui/Dockerfile`
- `web-ui/App.js`
- `server/ServerUrlThunk.js`
- `server/ServerUrlThunkForDocker.js`

