# Test if the API key is set and give an error if not
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY is not set"
  # provide example of how to set the key
  echo "Please set the OPENAI_API_KEY environment variable to your OpenAI API key, e.g."
  echo "export OPENAI_API_KEY='sk-1234567890abcdef1234567890abcdef'"
  echo "You can create or find your key at https://platform.openai.com/account/api-keys"
  echo "You can add this line to a .env file or in your ~/.bashrc or ~/.bash_profile to set it automatically"
  echo "Then run 'source .env' or  'source ~/.bashrc' or 'source ~/.bash_profile' to apply the changes"
else
  curl https://api.openai.com/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": "Say this is a test!"}],
      "temperature": 0.7
    }'
fi
