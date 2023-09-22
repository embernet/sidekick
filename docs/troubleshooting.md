# Troubleshooting guide

## I'm getting an error when I try to run `npm start`

Try running `npm install` to reinstall the dependencies.

If that doesn't work, try deleting the `node_modules` directory and then reinstalling the dependencies:

```shell
rm -rf node_modules
npm install
```

## Processes

### I want to see which processes are running

Run `ps -ef | grep sidekick` if running locally.

## Other troubles

If you have other troubles (related to sidekick!), feel free to raise an issue and we can shoot them in here, or raise a PR if you have guidance you want to add in here.
