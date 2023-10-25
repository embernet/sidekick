# Release Notes

## v0.0.8

Functional changes:

1. Note Writer now streams its response so you can see it being generated in real time and you can stop it at any time by clicking the stop button.
2. Added App menu to top left of App Toolbar
3. Added Note context menu to append selected text to chat input.
4. Renamed the "None" persona to "No Persona" and made this the default persona for a new user. This makes the default response that of the model with no system prompt.
5. Added a "Concise" Persona

Code improvements:
1. Server now uses SQLAlchemy to access the database rather than raw SQL. This makes the code more readable and maintainable and makes it easier to support multiple databases. The default setup is SQLite, and you can configure it to use PostgreSQL.

Bug fixes:

1. Prompt Engineer window now fits in the vertical height of the App in the same way the other tool windows do. Previously it was slightly bigger resulting in a scrollbar appearing at the right of the App.
2. Fixed bug in ResizeObserver where for some UI interactions an "ResizeObserver loop completed with undelivered notifications." error was being thrown.
3. Improved how Chat and Note prompt windows are sized when the browser window is small.

## v0.0.7

Functional changes:

1. The prompt at the bottom of the Note is now a GenAI Note Writer. You can tell it what you want to add to your note. It will use the existing note content as context and generate additional text based on the request in your prompt that it will append to the note.
2. Pressing return in the login and create user screens now moves the cursor to the password field if you were in the userid field and submits the form if you are in the passord field.

## v0.0.6

Functional changes:

1. Added a prompt templates tool with a selection of pre-canned templates
2. Notes can now render a preview of markdown and code
3. Chats now render markdown as well as code and markdown interspersed with code
4. Chat can now save prompts as templates
5. Now uses a single SQLite database for all users, chats, notes, settings, and feedback rather than one data database per user plus a login and feedback database. This simplifies the deployment and configuration of the app, and makes it easier to share chats, prompts, and notes with other users.
6. Chat secondary toolbar now has a button to save the current prompt as a template
7. Added custom_settings for the App to set the instance name, and usage, which are displayed next to the version in the App bar; instanceName is intended to be used to distinguish between different instances of the app, e.g. Dev, Test, Prod. usage is intended to be used to distinguish between how that instance could or should be used, e.g. could state private/public, security classification, geographical region, team, divsion, etc. Both settings are just display strings for information purposes only.
8. Renamed the Prompt Composer tool to Prompt Engineer to refelect the standard terminolgy used in the AI industry.
9. Chat and Note context menus now have a copy highlighted text option when text is selected
10. Other minor UI improvements

Code improvements:

1. Sidekick AI help now uses tabs instead of accordian for the separate sections for a clearer UI
2. Refactored markdown and syntax rendering into a new SidekickMarkdown component
3. Code syntax highlighting now defaults to ```code where the language is not specified
4. Carousel component and Login updated to ensure login and create account headings are visible irrespective of browser window size and zoom state


## v0.0.5

UI changes: side panel swapping and pinning, custom messages for login and chat, stop streaming button, improved manual.

Functional changes:

1. Chat now has a stop button that will stop streaming of the chat response to the chat window, enabling the prompt text area so another prompt can be entered
2. Opening a side panel now closes other side panels that are open unless they are pinned. This allows you to choose your working style, saves screen space and keeps the UI tidy by default, whilst allowing pinning as many of the controls to be open for easy access as you want.
3. Updated manual with more comprehensive reference of Sidekick features and controls.
4. Chat information about personal, temperature / creativity, and model moved out of the secondary toolbar into a display-only footer.
5. Added personas for CFO, CIO, CINO, Board member, and None (blank system prompt), improved the existing persona system-Prompts, added a description and tags per persona. Personas tool now shows the shorter description (what the persona does) by default, and the longer system_prompt (how the AI should respond for that persona) when you hover over the persona or click on the expand button in the toolbar.
6. Added custom settings for specifying text to display on the login screen and as the chat prompt ready placeholder. See [Configuration Guide](configuration.md) for more information.
7. Chat's can change course; the Chat name now has a button to regenerate it based on the full chat content
8. Notes can change course; the Note name now has a button to regenerate it based on the full note content
9. Sidekick manual more content complete, added prompt engineering playbook, and sections on understanding Generative AI and responsible usel; rendered as markdown with hyperlink navigation
10. Chat prompt area now limits its height to 40% of the window and adds a scrollbar if the prompt doesn't fit

Code improvements:

1. Removed gpt-3.5-16k model, which is no longer supported.
2. Focus is now set to the prompt text area when the chat response completes
3. Fixed bug where sometimes "append message to note" was not working
4. Chat, append message to note, now creates a new note to append the message to if one was not open
5. New chats are only saved when they have content, and the new chat button is disabled when the chat is a new (empty) chat; this avoids new empty chats being created each time the app is opened
6. Export note to file now removes special characters not permitted in filenames
7. Logout does a page reload to ensure all state is cleared and ensure any updates to the app are applied
8. Notes are now saved when the name or content lose focus, previously notes were saved as the content was edited
9. Added debounced ResizeObserver to Chat and Note components to prevent React Resize Observer loop limit exceeded error when the browser window is resized

## v0.0.4

Functional changes:

1. Sidekick Manual added, click the ? icon on the toolbar
2. Sidekick AI Help added, ask questions of the manual rather than reading it!
3. Chats are automatically named. New empty chats are named "New Chat". If this is their name when you enter a prompt, they will be automatically given a name based on the text in the prompt.
4. Notes are automatically named. New empty notes are named "New Note". If the note has that name when you have entered text into it and hit return or have copied text from the chat into the note then the note will be give a name automatically based on that text.
5. Travel Agent persona added
6. Settings cog top right now opens the App settings window
7. Change password option added to App settings window
8. Delete account option added to App settings window

Code improvements:

1. Add persona button removed as this was not implemented yet; it will be added in a future release

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
