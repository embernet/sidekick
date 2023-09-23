# Release Notes

## v0.0.3

Functional changes:

1. Default persona is now 'Answerer'
2. Shift-return supported in prompt editor to add a new line without sending the prompt
3. Chat and Notes explorers now highlight the open item

Code improvements:

1. Corrected a race condition between the streaming completion and updating the chat window that intermittently caused some deltas of the response to be dropped
2. Removed redundant feedback button wrapper that was giving a warning
3. project `make run-dev-locally` now no longer does a production build, which is unneccessary and takes longer
4. server `make run-dev-locally` and `make run-prod-locally` now also do init to ensure any new library dependencies are installed
5. Fixed bug where if the chat window is closed and a chat is clicked on in the chat explorer, a new chat is created instead of the existing chat being opened
6. Chat window now resets itself when closed to avoid opening the last chat when the window is reopened from the app toolbar New chat button; now a new chat is created

## v0.0.2

1. Option to toggle streaming of the chat response on or off added to ModelSettings window. If you have an environment you have deployed this in where it looks like the network setup or security perimeter could be getting in the way, this might solve your issue.

## v0.0.1

1. README.md now has more informative text and images
2. Default open windows are now Chat and Chats Explorer
3. When streaming, the following controls are now disabled: Chat - send, ask again, and reload last prompt for editing; Persona - Ask again from this persona
4. Server access tokens set to not expire, previously they expired after an hour
5. Chat context menu now includes 'Copy all as text' and 'Copy all as html'
6. Added release notes
7. Updated roadmap with more interactive AI features

## v0.0.0

1. Chat with an AI
2. The chat is streamed to you in realtime as the AI responds
3. Code blocks are syntax highlighted
4. Copy individual chat messages to your clipboard
5. Select the persona of the AI from a library of personas
6. Set a default persona
7. Mark personas as favorites
8. Filter personas by name and favourite status
9. Compose your prompt from a library of fragments
10. Create and edit notes
11. Each user has a database to store their chats, notes, and app settings
12. Explorer views to list and filter chats and notes
13. Augment notes with the best parts from your chats
14. Export notes to a text file
15. Import notes from a text file
16. Chat with your notes, e.g.
    1. Ask questions about your notes
    2. Ask for a summary of your notes
    3. Ask for a summary of your notes from a specific perspective
17. Add a chat to a note
18. Run web_ui and server locally or on server(s) in dev or prod modes
