# Configuration Guide

## Custom settings

Custom settings can be used to customise specific parts of the application by editing the content of files in the `server/etc/custom_settings` directory.

**Example login custom settings:**

File: `server/etc/custom_settings/login.json`

```json
{
    "preLogin": {
        "message": "Welcome to Sidekick.\n\nAlways be careful to not enter personal or sensitive information into the chat."
    }
}
```

**Example chat custom settings:**

File: `server/etc/custom_settings/chat.json`

```json
{
    "userPromptReady": "Enter prompt... (Take care to not enter personal or sensitive information.)"
}
```

## Server API Configuration

The primary server API configuration file is a YAML file located at `server/settings.yml` and is loaded by the application at startup.

**Example configuration:**

```yaml
userdb_dir: data
logindb_dir: etc
feedbackdb_dir: etc
settings_dir: settings
logs_dir: etc/logs
openai_api_key_env_var: OPENAI_API_KEY
default_chat_name: New Chat
port:
  docker: 5004
  development: 5003
```

## Default settings for UI components

The default settings for the UI components are stored in a JSON file located at `server/settings_defaults`. When a new user is created, a new SQLite database is created for them in `userdb_dir` and the default settings are copied into it. Chats and Notes are also stored in the user's database.

If you want to change available personas or the default prompt fragments, you can edit the corresponding settings files, but will need to do this before creating a new user... or you can edit the SQLite database directly.

These settings will be editable via the UI in a future release.
A docker implementation is in process and will be available in a future release.
