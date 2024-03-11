# Sidekick overview

Sidekick provides a chat interface to OpenAI's GPT models along with pre-canned AI personas, a prompt fragment library, and prompt templates to help you get more out of the AI. It also provides a working environment where you can create notes by selecting the most interesting and useful parts of the chat to edit and organise into a more complete text aligned with what you want.

# Sidekick Tools

- **Sidekick AI Help:** This tool. An AI that helps you use the Sidekick app. Ask questions about the Sidekick app to get simple instructions on how and why to use app features. Ask more general questions and it will suggest approaches to using the app to answer those questions.
- **Chat:** Talk to OpenAI's GPT-3.5-turbo and GPT-4 models. Save prompts as templates, save chat messages to Notes, selectively delete AI responses that missed the point from the chat history to improve the AI's future responses.
- **Chat Explorer:** List historical chats. Click on a chat to open it.
- **Model Settings:** Model Settings include which AI model to use and values for various parameters that affect the way that model responds to your prompts.
- **AI Personas:** Select from a library of pre-canned AI personas to change the perspective from which the AI responds to your prompts. Favourite the personas you like, filter by name and keywords.
- **Prompt Engineer:** Create prompts by selecting from a library of prompt fragments and prompt templates.
- **Note:** Create and edit notes to gather your thoughts, plan your work, collate the best AI responses from your chats into something more meaninful.
- **Notes Explorer:** A filterable list of the notes you have created.
- **App Settings:** Change account settings.

## Sidekick AI Help

**What is Sidekick AI Help?** Sidekick AI Help is an AI that helps you understand how to use the Sidekick app. This is the tool you are using now. Ask questions about the Sidekick app and how to use it to get simple instructions on how to use app features. Ask more general questions and it will suggest approaches to using the app to answer those questions.

**How to access Sidekick AI Help:** Click on the Sidekick AI Help button, which is the ? icon in the Sidekick toolbar.

### Sidekick AI Help Features

- Read the manual, navigate between sections on how to use app features, creativity methods, and problem solving methods
- Ask questions about the Sidekick app and how to use it to get simple instructions on how to use app features
- Ask more general questions and it will suggest approaches to using the app to answer those questions

## Chat

**How to access Chat:** The Chat window opens by default. If you close it you can create a new chat by clicking on the Chat button, which is the speech bubble with a + icon in the Sidekick toolbar

### Chat Features

- Enter a prompt in the prompt box and press Enter, or click on the Send button in the Chat prompt Toolbar
- To ask the same question again / send the same prompt again: Click the "Ask again" button in the Chat prompt Toolbar
- To reload your last prompt for editing: Click the "Reload last prompt for editing" button in the Chat prompt Toolbar
- To clear the prompt box: When in the prompt box, press the Escape key
- To create a new chat: Click the New Chat icon in the Chat main Toolbar
- To turn code syntax highlighting on or off: Click the Code Highlighting icon in the Chat main Toolbar
- Right clicking on a message in the chat lets you:
  - Copy the message to the clipboard as text
  - Copy the message to the clipboard as HTML
  - Run Actions against the whole Chat
    - Continue
    - Summarise
    - Summarise key points as bullets
    - Provide more detail
    - Explain in simple terms
    - Explain in detail
    - Give the background and history
    - Predict future outcomes or scenarios this could lead to
    - Answer What are the implications of this?
    - Answer What questions does this give rise to?
    - Answer What are the pros and cons of this?
    - List related topics
    - List related trends
    - Answer How can this help me?
    - Answer How might this hinder me
  - Run Actions against the selected text
    - Define
    - Explain in simple terms
    - Explain in detail
    - Provide synonyms for
    - Provide antonyms for
    - Give examples of
    - Give counter-examples of
    - Give arguments for
    - Give counter-arugments for
    - Provide history for
    - List related topics to
    - List trends related to
    - Answer How can this help me?
    - Answer How might this hinder me?
  - Append the message to the prompt
  - Use the message as the prompt
  - Append the message to a note
  - Append all messages in the chat to a note
  - Delete a message
  - Delete all messages in the chat
- The chat history is saved in the Sidekick database
- Click the book icon to open the AI knowledge library and add notes you want the AI to use as context in this chat

### Chat Tips, Questions and Answers

- If you want a quicker chat response and your questions are not complex then try using the GPT-3.5-turbo model. If you want a more complex response then try using the GPT-4 model. You can change the model in the Model Settings window.
- Why delete messages from the chat? Curating the chat history by deleting individual messages that were not what you wanted can be a useful way to improve the AI's responses. The chat history is sent back to the AI each time you send a new prompt, so deleting messages that were not what you wanted can help the AI learn what you do want.
- Chats are automatically named. New empty chats are named "New Chat" until you interact with it to create some content. If this is their name when you enter a prompt, they will be automatically given a name based on the text in the prompt.
- Chat's can change course over time. Click the regenerate name button next to the chat name if you want to update the name to reflect the current content of the chat.

## Chat Explorer

**How to access Chat Explorer:** The chat explorer is open by default. If you close it you can click on the Chat Explorer button, which is the double chat bubble icon in the Sidekick toolbar.

### Chat Explorer Features

- Lists the chats you have created
- Filter chats by name
- Click on a chat to open it
- Bulk delete chats by filtering and clicking the trashcan button next to the filter text

## Scripts Explorer

**What is Scripts Explorer?** Scripts Explorer is a window that lets you explore the scripts you have created. Click on a script to open it.

**How to access Scripts Explorer:** Click on the Scripts Explorer button, which is in the Sidekick toolbar next to the play button.

### Scripts Explorer Features

- Lists the scripts you have created
- Filter scripts by name
- Sort scripts by name, date created, or date last modified
- Click on a script to open it
- Bulk delete scripts by filtering and clicking the trashcan button next to the filter text

Return to [Sidekick Tools](#sidekick-tools)

## Script

**What is Sidekick Script?** The Script window lets you create scripts by adding text cells of different types including text, lists, and templates to parameterise prompts for querying the AI.

**How to create a script:** Click on the Script button, which is the play button icon in the Sidekick toolbar.

### Script Features

- Create cells of different types including text, lists, and templates to parameterise prompts for querying the AI
- Click the + icon to add a cell

#### Script Cell Features

- Click the X icon on a cell to delete it
- Click the up and down arrows to move a cell up or down
- Pick the cell type from the dropdown list
- Enter a name for the cell in the name box. The name can be used in the template and prompt cells to refer to a cell's value

#### Script Cell Types

- **Text** - A cell that contains text
- **List** - A cell that contains a list of items; click + to add an item, X to delete an item
- **Template** - Templates are used to parameterise prompts for querying the AI. The template can contain references to other cells by name. You can enter these between curley brackets {cell name} or use the 'Select cell to add to template...' dropdown to pick from the list of available cells in that script. The references are replaced with the cell's value.
- **Prompt** - A cell that contains a prompt for querying the AI. The Prompt cell contains an embedded Template cell so you can construct the prompt with references to other cells. You see a preview of the generated template. Once you are happy with the prompt, click the Send button to send the prompt to the AI.

## Model Settings

**How to access Model Settings:** Click on the Model Settings button, whcih is the graphic equalizer icon in the Sidekick toolbar.

**Why use Model Settings?** These settings can change the speed of response, the creativity or conservatism of the response, how likely the model is to repeat itself or try harder to come up with a different or more original response.

### Model Settings Features

- Turn streaming of the chat response on or off by clicking the Streaming toggle button
- Select the model to use from the Model dropdown list
- Adjust the temperature by using the temperature slider
- Adjust the top_p by using the top_p slider
- Adjust the frequency_penalty by using the frequency_penalty slider
- Select the top k value from the Top K dropdown list

### Model Settings Tips, Questions and Answers

- **What is Temperature?** Temperature is a model setting that takes a value between 0 and 2 inclusive. 0 is the most consistent 'best' prediction. Up to 0.9 allows more creativity and variability. Above 1, the model is more 'creative' but can hallucinate more and make spelling and grammar mistakes.
- **What is top_p?** Top_p is a model setting that takes a value between 0 and 1 inclusive and provides an alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.
- **What is presence_penalty?** Presence_penalty is a model setting that takes a value between -2 and 2 inclusive. Positive values penalise new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
- **What is frequency_penalty?** Frequency_penalty is a model setting that takes a value between -2 and 2 inclusive. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.

## AI Personas

**What are AI Personas?** AI Personas are pre-canned roles that you can use to change the perspective from which the AI responds to your prompts.

**How to access AI Personas:** Click on the AI Personas button, which is the person icon in the Sidekick toolbar, or click on the persona name in the Chat window secondary toolbar just above where you enter your prompt.

**Why use AI Personas?** Using AI Personas can help you get more out of the AI by changing the perspective from which the AI responds to your prompts to better suit your situation or frame of mind.

### AI Personas Features

Choose from an AI persona library listed in the Personas window. Use the Show/Hide details button to display or conceal system prompts guiding the AI's role-play. Filter personas using name, profile keywords, and favorite status. Favorite frequently used personas by clicking the heart icon. Search for specialized personas by topic or priorities like 'expert,' 'generalist,' 'creative,' 'logical,' 'CXO.' Change the AI Persona in the Chat window by clicking the persona's name. Right-click a persona to resend the last prompt using that persona or set it as the default for future sessions.

### AI Personas Tips, Questions and Answers:

To favorite or unfavorite an AI Persona, click the heart icon next to the persona's name. Change the AI Persona by clicking its name in the Personas window. Search for a persona using name or profile keywords in the filter box, and filter favorites by clicking the heart next to the box.

## Prompt Engineer

**What is Prompt Engineer?** Prompt Engineer is a tool that lets you create prompts by selecting from a library of prompt fragments.

**How to access Prompt Engineer:** Click on the Prompt Engineer button, which is the spanner icon in the Sidekick toolbar.

**Why use Prompt Engineer?** Prompt Engineer lets you create prompts by selecting from a library of prompt fragments. The library is broken down into categories of intent, detail, voice, perspective, and format. You will get responses from the AI that are better suited to your needs if you provide prompts that are well crafted. You can include criteria in your prompt about what you want to know, what format you want it in, how much detail, whether you want explanations or examples, and more. Think of the Prompt Engineer as containing a checklist of things to consider when crafting your prompt.

### Prompt Engineer Features

- Click on the category name to expand or collapse the category of prompt fragment.
- Click on the prompt fragment to add it to the prompt.

## Note

**What is the Note tool?** The Note tool lets you create and edit notes, collect the best parts of your chats, and use Generative AI to help you with your thinking and writing.

**How to access the Note tool:** Click on the Note button, which is the text icon in the Sidekick toolbar.

**Why use the Note tool?** The Note tool lets you create and edit notes, collect the best parts of your chats, and use Generative AI to help you with your thinking and writing.

### Note Features

- Create and edit notes
- Collect the best parts of your chats by right clicking on a message in the chat and selecting "Append message to note"
- Copy your entire chat to a note by right clicking on a message in the chat and selecting "Append all to note"
- Right click on a note in the Notes window to copy the note to the clipboard, or use in chat input
- The primary toolbar at the top of the note provides the following functions:
  - "New Note" 
  - "Delete Note" 
  - "Add note to knowledge library" - these notes can be loaded as knowledge into chats
- The secondary toolbar at the bottom of the note provides the following functions:
  - "Download Note" 
  - "Upload Note" 

### Note Tips, Questions and Answers

- How do I create a new note? Click the "New Note" button in the Note main Toolbar.
- How do I delete a note? Click the "Delete Note" button in the Note main Toolbar.
- How do I download a note? Click the "Download Note" button in the Note secondary Toolbar.
- How do I upload a note? Click the "Upload Note" button in the Note secondary Toolbar.
- How do I copy a note to the clipboard? Right click on the note in the Notes window and select "Copy".
- How do I copy a Chat response into my note? Right click on a message in the chat and select "Append message to note".

## Notes Explorer

**What is the Notes Explorer?** The Notes Explorer is a window that lets you explore the notes you have created. Click on a note to open it.

**How to access the Notes Explorer**: Click on the Notes Explorer button, which is the folder icon in the Sidekick toolbar.

**Why use Notes Explorer?** You can end up with a lot of notes over time, and the Notes Explorer lets you filter the list of notes by name.

### Notes Explorer Features

- Lists the notes you have created
- Filter notes by name
- Click on a note to open it
- Bulk delete notes by filtering and clicking the trashcan button next to the filter text

## App Settings

**What are App Settings?** App Settings include your userid, password, and other settings related to your userid.

**How to access App Settings:** Click on the App Settings button, which is the cog icon in the Sidekick toolbar.

### App Settings Features

- Change your password
- Delete your account

# What can I use Sidekick for?

- **Creativity**: Sidekick can help you be more creative by helping you explore ideas, and by helping you get more out of the AI by using the persona that is best suited to your purpose.
- Brainstorming: Use the Chat tool to ask the AI to come up with different ideas for a problem you are working on. Use the personas to come up with ideas from different perspectives and to list pros and cons from those perspectives. Use the Note tool to collect the best ideas from the Chat.
- **Thinking**: Use the Chat tool to ask the AI to help you think through a problem you are working on. Ask the AI to break a problem down into its parts, create a list of the steps involved in a process, come up with a strategy to achieve a goal, or to help you understand a concept.
- **Learning**: Use the Chat tool to ask the AI to help you learn about a topic you are interested in. Ask the AI to explain a concept, provide history, or relevance of different ideas to something you are working on. Ask for a list of resources to learn more about a topic.
- **Problem solving**: Use the Chat tool to ask the AI to help you solve a problem you are working on. Ask the AI to help you understand the problem, break it down into its parts, come up with a strategy to solve it, or to help you understand how to work around a problem or come at it from a different direction.
- **Knowledge-building**: Use the Note tool to collect the best parts of the Chats, and to edit and organise them into a more complete text aligned with what you want.
- **Software Engineering**: Software engineering includes requirements analysis, system design, programming, testing, and operations. Use the Chat tool to provide code snippets, explain concepts, and provide examples, design patterns, recommend libraries and languages to use to perform specific tasks. Use the Note tool to collect the parts most relevant to you so you can create your own play book of how to code more effectively.

