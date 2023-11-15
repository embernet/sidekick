# Docker

## Building the docker images

Run `docker run -d -p 5001:5000 --name my-local-registry-on-5001 registry:2` to start a local registry if its not already running

Run `docker images` to see the images you have locally

```bash
cd server
docker build --tag sidekick-server .
docker tag sidekick-server:latest localhost:5001/sidekick-server:latest
docker push localhost:5001/sidekick-server:latest
```

Verify with `docker pull localhost:5001/sidekick-server:latest`

```bash
cd ../web_ui
docker build --tag sidekick-web-ui .
docker tag sidekick-web-ui:latest localhost:5001/sidekick-web-ui:latest
docker push localhost:5001/sidekick-web-ui:latest
cd ..
```

Run `docker images` again to see that the images have been pushed to the local registry

Run `docker-compose up` to start the containers

Open `http://localhost:5001/v2/_catalog` in your browser to see the contents of the local registry.

## Running the docker images

Run `docker-compose -f docker-compose-local.yaml up` to start the containers.

## Docker quick reference

- List running docker containers: `docker ps`
- List all docker containers: `docker ps -a`
- Stop a docker container: `docker stop <container name or id>`
- Inspect a containers restart policy: `docker inspect --format='{{ .HostConfig.RestartPolicy }}' <container name or id>`
- Change a containers restart policy to auto-restart: `docker update --restart=always <container name or id>`
- Change a containers restart policy to not auto-restart: `docker update --restart=no <container name or id>`
- Remove a docker container: `docker rm <container name or id>`