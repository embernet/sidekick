# Troubleshooting guide

## I'm getting an error when I try to run `npm start`

Make sure you are in the root directory of the project and run `source setup.sh` to install the dependencies.

Try running `npm install` to reinstall the dependencies.

If that doesn't work, try deleting the `node_modules` directory and then reinstalling the dependencies:

```shell
rm -rf node_modules
npm install
```

## Docker

### I want to start the application

From the sidekick folder run `docker-compose up`

## Processes

### I want to see which processes are running

Run `ps -ef | grep sidekick` if running locally.
Run `docker ps` if running in a docker container.

