# Configuration Guide

## Server API Configuration

The primary server API configuration file is a YAML file located at `server_api/settings.yml` and is loaded by the application at startup.

**Example configuration:**

```yaml
docdb_dir: ../data
settings_dir: ../settings
openai_api_key_env_var: OPENAI_API_KEY
default_chat_name: New Chat
port:
  docker: 5004
  development: 5003
```
