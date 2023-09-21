# Local installation

## Prerequisites

- You will need your own OpenAI API key to use this application. You can get one [here](https://beta.openai.com/).
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

## Testing

1. Run `npm test`
2. Run `npm run test:watch` to run tests in watch mode

## Usage

1. Start the application by running `npm start`

## Troubleshooting

If you get an error, check out the [troubleshooting guide](docs/troubleshooting.md).
