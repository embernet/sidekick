# Contents

- [Sidekick overview](#sidekick-overview)
- [Sidekick Tools](#sidekick-tools)
- [What can I use Sidekick for?](#what-can-i-use-sidekick-for)
- [Prompt Engineering Playbook](#prompt-engineering-playbook)
- [Understanding Generative AI](#understanding-generative-ai)
- [Responsible use](#responsible-use)


# Sidekick overview

Sidekick provides a chat interface to OpenAI's GPT models along with pre-canned AI personas and a prompt fragment library to help you get more out of the AI and a working environment where you can create notes by selecting the most interesting and useful parts of the chat to edit and organise into a more complete text aligned with what you want.

# Sidekick Tools

Sidekick has the following Tools:

- **[Sidekick AI Help](#sidekick-ai-help):** This tool. An AI that helps you use the Sidekick app. Ask questions about the Sidekick app to get simple instructions on how and why to use app features. Ask more general questions and it will suggest approaches to using the app to answer those questions.
- **[Chat](#chat):** A window that lets you talk to OpenAI's GPT-3.5-turbo and GPT-4 models, curate the message content, resubmit prompts, and copy responses of interest to notes.
- **[Chat Explorer](#chat-explorer):** A filterable list of chats you have created.
- **[Model Settings](#model-settings):** A window that lets you change the model settings for the AI to customise its behaviour.
- **[AI Personas](#ai-personas):** Select from a library of pre-canned AI personas to change the perspective from which the AI responds to your prompts.
- **[Prompt Composer](#prompt-composer):** Create prompts by selecting from a library of prompt fragments.
- **[Note](#note):** Create and edit notes to gather your thoughts, plan your work, collate the best AI responses from your chats into something more meaninful.
- **[Notes Explorer](#notes-explorer):** A filterable list of the notes you have created.
- **[App Settings](#app-settings):** Change general app and account settings.

Each of these is described in more detail below.

## Sidekick AI Help

**What is Sidekick AI Help?** Sidekick AI Help is an AI that helps you understand how to use the Sidekick app. This is the tool you are using now. Ask questions about the Sidekick app and how to use it to get simple instructions on how to use app features. Ask more general questions and it will suggest approaches to using the app to answer those questions.

**How to access Sidekick AI Help:** Click on the Sidekick AI Help button, which is the ? icon in the Sidekick toolbar.

### Sidekick AI Help Features

- Read the manual, navigate between sections on how to use app features, creativity methods, problem solving methods, and more
- Ask questions about the Sidekick app and how to use it to get simple instructions on how to use app features
- Ask more general questions and it will suggest approaches to using the app to answer those questions
- Right click on a message in the chat to:
  - Copy the message to the clipboard as text
  - Copy all messages to the clipboard as text
  - Copy the message to the clipboard as HTML
  - Copy all messages to the clipboard as HTML
  - Delete a message
  - Delete all messages

Return to [Sidekick Tools](#sidekick-tools)

## Chat

**What is Chat?** Chat is a window that lets you talk to OpenAI's GPT-3.5-turbo and GPT-4 models. Each time you enter a prompt, the entire chat history is sent to the AI along with the prompt. The AI then responds to the prompt based on the chat history and the prompt.

**How to access Chat:** The Chat window opens by default. If you close it you can create a new chat by clicking on the Chat button, which is the speech bubble with a + icon in the Sidekick toolbar

### Chat Features

- To talk to OpenAI's GPT-3.5-turb and GPT-4 models, enter a prompt in the prompt box and press Enter, or click on the Send button in the Chat prompt Toolbar
- To ask the same question again / send the same prompt again: Click the "Ask again" button in the Chat prompt Toolbar
- To reload your last prompt for editing: Click the "Reload last prompt for editing" button in the Chat prompt Toolbar
- To clear the prompt box: When in the prompt box, press the Escape key
- To create a new chat: Click the New Chat icon in the Chat main Toolbar
- To turn code syntax highlighting on or off: Click the Code Highlighting icon in the Chat main Toolbar
- Right clicking on a message in the chat lets you:
  - Copy the message to the clipboard as text
  - Copy the message to the clipboard as HTML
  - Append the message to the prompt
  - Use the message as the prompt
  - Append the message to a note
  - Append all messages in the chat to a note
  - Delete a message
  - Delete all messages in the chat
- The chat history is saved in the Sidekick database

### Chat Tips, Questions and Answers

- If you want a quicker chat response and your questions are not complex then try using the GPT-3.5-turbo model. If you want a more complex response then try using the GPT-4 model. You can change the model in the Model Settings window.
- Why delete messages from the chat? Curating the chat history by deleting individual messages that were not what you wanted can be a useful way to improve the AI's responses. The chat history is sent back to the AI each time you send a new prompt, so deleting messages that were not what you wanted can help the AI learn what you do want.
- Chats are automatically named. New empty chats are named "New Chat" until you interact with it to create some content. If this is their name when you enter a prompt, they will be automatically given a name based on the text in the prompt.
- Chat's can change course over time. Click the regenerate name button next to the chat name if you want to update the name to reflect the current content of the chat.

Return to [Sidekick Tools](#sidekick-tools)

## Chat Explorer

**What is Chat Explorer?** Chat Explorer is a window that lets you explore the chat history. Click on a chat to open it.

**How to access Chat Explorer:** The chat explorer is open by default. If you close it you can click on the Chat Explorer button, which is the double chat bubble icon in the Sidekick toolbar.

### Chat Explorer Features

- Lists the chats you have created
- Filter chats by name
- Click on a chat to open it
- Bulk delete chats by filtering and clicking the trashcan button next to the filter text

Return to [Sidekick Tools](#sidekick-tools)

## Model Settings

**What are Model Settings?** Model Settings include which AI model to use and values for various parameters that affect the way that model responds to your prompts.

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

Return to [Sidekick Tools](#sidekick-tools)

## AI Personas

**What are AI Personas?** AI Personas are pre-canned roles that you can use to change the perspective from which the AI responds to your prompts.

**How to access AI Personas:** Click on the AI Personas button, which is the person icon in the Sidekick toolbar, or click on the persona name in the Chat window secondary toolbar just above where you enter your prompt.

**Why use AI Personas?** Using AI Personas can help you get more out of the AI by changing the perspective from which the AI responds to your prompts to better suit your situation or frame of mind.

### AI Personas Features

- Select from a library of pre-canned AI personas; the Personas window lists the persona's name and description
- Click on the Show/Hide details button in the toolbar to show or hide the the system prompts that tell the AI how to play the role of each persona
- Filter the list of personas by name, keywords in their profile, and favourite status
- Favourite personas you use often by clicking on the heart icon next to the persona name
- You can search for personas that are specialise in a particular topic or that have a particular priorities. E.g. try searching for expert, generalist, creative, logical, CXO.
- Change the AI Persona to use in subsequent prompts to the AI in the Chat window by clicking on the persona name in the Personas window
- Right click on a persona in the Personas window to:
  - "Ask again with this persona" - This will send the last prompt to the AI again using the selected persona. In this way, you can easily get multiple perspectives on the same question.
  - "Set as default persona" - This will set the selected persona as the default persona to use in subsequent prompts to the AI in the Chat window. This will be remembered across sessions.

### AI Personas Tips, Questions and Answers:

- How do I favourite an AI Persona? Click on the heart icon next to the persona name.
- How do I unfavourite an AI Persona? Click on the heart icon next to the persona name.
- How do I change the AI Persona? Click on the persona name in the Personas window.
- How do I search for an AI Persona? Enter a search term in the filter box in the Personas window. You can search by name, keywords in the persona profile. You can filter the list of personas by favourite by clicking the heart next to the filter box in the Personas window.

Return to [Sidekick Tools](#sidekick-tools)

## Prompt Composer

**What is the Prompt Composer?** The Prompt Composer is a tool that lets you create prompts by selecting from a library of prompt fragments.

**How to access the Prompt Composer:** Click on the Prompt Composer button, which is the spanner icon in the Sidekick toolbar.

**Why use Prompt Composer?** The Prompt Composer lets you create prompts by selecting from a library of prompt fragments. The library is broken down into categories of intent, detail, voice, perspective, and format. You will get responses from the AI that are better suited to your needs if you provide prompts that are well crafted. You can include criteria in your prompt about what you want to know, what format you want it in, how much detail, whether you want explanations or examples, and more. Think of the prompt composer as containing a checklist of things to consider when crafting your prompt.

### Prompt Composer Features

- Click on the category name to expand or collapse the category of prompt fragment.
- Click on the prompt fragment to add it to the prompt.
- Click on the Show/Hide button in the toolbar to expand or collapse the categories of prompt fragments.

Return to [Sidekick Tools](#sidekick-tools)

## Note

**What is the Note tool?** The Note tool lets you create and edit notes, collect the best parts of your chats, and use Generative AI to help you with your thinking and writing.

**How to access the Note tool:** Click on the Note button, which is the text icon in the Sidekick toolbar.

**Why use the Note tool?** The Note tool lets you create and edit notes, collect the best parts of your chats, and use Generative AI to help you with your thinking and writing.

### Note Features

- Create and edit notes
- Collect the best parts of your chats by right clicking on a message in the chat and selecting "Append message to note"
- Copy your entire chat to a note by right clicking on a message in the chat and selecting "Append all to note"
- Right click on a note in the Notes window to:
  - "Copy" - Copy the note to the clipboard as text
  - "Copy as HTML" - Copy the note to the clipboard as HTML
  - "Append to chat input" - Append the note to the prompt in the Chat window
  - "Use as chat input" - Use the note as the prompt in the Chat window
- The primary toolbar at the top of the note provides the following functions:
  - "New Note" - Create a new note
  - "Delete Note" - Delete the current note
- The secondary toolbar at the bottom of the note provides the following functions:
  - "Download Note" - Download the current note as a text file
  - "Upload Note" - Upload a text file as a new note

### Note Tips, Questions and Answers

- How do I create a new note? Click the "New Note" button in the Note main Toolbar.
- How do I delete a note? Click the "Delete Note" button in the Note main Toolbar.
- How do I download a note? Click the "Download Note" button in the Note secondary Toolbar.
- How do I upload a note? Click the "Upload Note" button in the Note secondary Toolbar.
- How do I copy a note to the clipboard? Right click on the note in the Notes window and select "Copy".
- How do I copy a Chat response into my note? Right click on a message in the chat and select "Append message to note".

Return to [Sidekick Tools](#sidekick-tools)

## Notes Explorer

**What is the Notes Explorer?** The Notes Explorer is a window that lets you explore the notes you have created. Click on a note to open it.

**How to access the Notes Explorer**: Click on the Notes Explorer button, which is the folder icon in the Sidekick toolbar.

**Why use Notes Explorer?** You can end up with a lot of notes over time, and the Notes Explorer lets you filter the list of notes by name.

### Notes Explorer Features

- Lists the notes you have created
- Filter notes by name
- Click on a note to open it
- Bulk delete notes by filtering and clicking the trashcan button next to the filter text

Return to [Sidekick Tools](#sidekick-tools)

## App Settings

**What are App Settings?** App Settings include your userid, password, and other settings related to your userid.

**How to access App Settings:** Click on the App Settings button, which is the cog icon in the Sidekick toolbar.

### App Settings Features

- Change your password
- Delete your account

Return to [Sidekick Tools](#sidekick-tools)

# What can I use Sidekick for?

- **Creativity**: Sidekick can help you be more creative by helping you explore ideas, and by helping you get more out of the AI by using the persona that is best suited to your purpose.
- Brainstorming: Use the Chat tool to ask the AI to come up with different ideas for a problem you are working on. Use the personas to come up with ideas from different perspectives and to list pros and cons from those perspectives. Use the Note tool to collect the best ideas from the Chat.
- **Thinking**: Use the Chat tool to ask the AI to help you think through a problem you are working on. Ask the AI to break a problem down into its parts, create a list of the steps involved in a process, come up with a strategy to achieve a goal, or to help you understand a concept.
- **Learning**: Use the Chat tool to ask the AI to help you learn about a topic you are interested in. Ask the AI to explain a concept, provide history, or relevance of different ideas to something you are working on. Ask for a list of resources to learn more about a topic.
- **Problem solving**: Use the Chat tool to ask the AI to help you solve a problem you are working on. Ask the AI to help you understand the problem, break it down into its parts, come up with a strategy to solve it, or to help you understand how to work around a problem or come at it from a different direction.
- **Knowledge-building**: Use the Note tool to collect the best parts of the Chats, and to edit and organise them into a more complete text aligned with what you want.
- **Software Engineering**: Software engineering includes requirements analysis, system design, programming, testing, and operations. Use the Chat tool to provide code snippets, explain concepts, and provide examples, design patterns, recommend libraries and languages to use to perform specific tasks. Use the Note tool to collect the parts most relevant to you so you can create your own play book of how to code more effectively.

[Back to top](#sidekick-manual-top)

# Prompt Engineering Playbook

Prompt engineering refers to the practice of designing and structuring inputs or "prompts" to get the best or most appropriate and useful output from the AI. It's a powerful technique to make the most of the wealth of information embedded in AI models. Here are some examples:

1. **Continue**: If the answer you got was too short or was cut off before it completed because it was bigger than the buffer the AI has to create a response in then just prompt 'continue' to get more.

2. **Define the Answer Format**: You can instruct the model about the format you want the answer in. E.g., "In bullet points, list the steps for a software risk assessment."

3. **Step-by-step Requests**: Ask the model to think step-by-step or reason through a problem. E.g., "Describe, step-by-step, how to implement multi-factor authentication."

4. **Pros and Cons**: This can be useful to see different sides of an argument or to ensure a thorough approach to a problem. E.g., "What are the pros and cons of using an object store versus a file system?"

5. **Perspectives**: Understand how people in different roles or with different risk postures could see a situation. E.g., "What makes a good business case from the perspective of the CEO, COO, CTO, CFO, Head of risk, Head of business development?"

6. **Elaborate**: Following a response that is a good start, ask for elaboration, providing examples in your prompt to drive and shape the type and amount of content you want back, E.g., "Elaborate on what makes a good business case by providing each role title without the summary paragraph along with ten bullets for the top things that role would want to see in a business case

7. **Use Explicit Requests**: If you want the model to generate a list, poem, or any specific type of text, it's best to specify that in your prompt. E.g., "Generate a list of cybersecurity best practices."

8. **Provide Example output**: Providing examples can help the model but could also constrain it so use with caution. For example: If you want the output in a certain format, and its not a well defined format like a bullet list, or CSV, then as well as describing the format provide examples. You can also provide examples of the kind of ideas you want if you are asking more open questions to help with creativity to explain what you mean, but this can have the side effect of missing out on angles you hadn't thought of. In this case, you can also just ask without providing an example, and then ask again with examples to get the best of both.

9. **Creativity Control**: Control the creativity level of the AI by instructing it to be more conservative or more innovative. E.g., "Give me a conservative estimate of implementing AI in customer service" versus "Suggest some innovative uses of AI in customer service."

10. **Contextual Information**: Providing additional context can help guide the model's response. E.g., "Considering the current advancements in quantum computing, what are the potential security risks?"

11. **Specify the Detail Level**: You can instruct the model to provide a high-level summary or a detailed explanation. E.g., "Give me a high-level overview of GDPR" versus "Provide a detailed explanation of GDPR."

12. **Role-play Scenarios**: You can use prompts that put the model in a specific role. E.g., "Pretend you are an IT helpdesk assistant and guide me through resetting my password."

13. **Direct Questions**: These work well if you need specific information. E.g., "What is the difference between SQL and NoSQL databases?"

14. **Temporal Instructions**: You can guide the model to answer based on a specific time. E.g., "What were the leading cybersecurity threats in 2022?"

15. **Location-based Instructions**: Similar to temporal instructions, you can ask location-specific questions. E.g., "What are the data protection regulations in the European Union?"

16. **Idea Generation**: Ask the model to brainstorm ideas. E.g., "What are some innovative ways to improve customer experience in banking?"

17. **Iterative Conversations**: Don't limit yourself to a single question. Feel free to have a back-and-forth with the model to refine your output.

18. **Multiple Angles**: For complex problems, consider asking the same question from different angles to ensure a comprehensive, unbiased answer. How can I improve the performance of this? What would I be trading off if I did that?

19. **Hypothetical Scenarios**: Use hypothetical scenarios for strategic thinking or creative problem solving. E.g., "Imagine we could fully automate our customer service with AI. What would be the implications?"

20. **Prompt Politeness**: Make your prompts polite to get more formal responses. E.g., "Could you kindly provide a brief on current fintech trends?"

21. **Document Edits**: Ask the model to proofread or edit a document. E.g., "Please proofread the following paragraph for grammatical errors."

22. **Analogies**: Use analogies to explain complex ideas. E.g., "Explain cloud computing to a five-year-old."

23. **Emulate Styles**: You can ask the model to emulate a certain writing style. E.g., "Write a summary of the latest AI advancements in the style of a New York Times article."

24. **Factual vs. Opinion-Based Responses**: Specify if you want a factual response or an opinion. E.g., "What are the facts about quantum computing?" versus "What's your opinion on the future of quantum computing?" Remember, though, that GPT's "opinions" are simulated and based on patterns it learned during training.

[Back to top](#sidekick-manual-top)

# Understanding Generative AI

## What is a Generative AI ChatBot?

Generative AI models use machine learning techniques to provide human-like text based on the input (prompt) they receive. Generative AIs can answer questions, write essays, summarize texts, translate languages, and even generate ideas. Google Research released the Transformer model that is the basis of many modern Generative AI tools. GPT-4 is a cutting-edge language model developed by OpenAI based on Transformers. ChatGPT is a wrapper for GPT-4 that lets you talk to it in a chat window. Sidekick uses the OpenAI API to access GPT-3.5-turbo and GPT-4.

## How models are trained

They all work in a similar way, but there are differences. Some of them are based on the same underlying model that was trained from natural language texts available on the Internet and elsewhere. Players like Google and OpenAI have trained their own models, but a large amount of the training data will be the same. Having said this, it is the work that goes into curating and quality controlling the training data, and any additional fine tuning, Reward Learning from Human Feedback (RLHF), or variants of that process to align the model with the kinds of outputs we want (remove hate speech, explain answers, provide evidence for perspectives, etc.) that impacts the quality of that output.

GPT-4 is a variant of a Transformer, which is a type of model architecture used in natural language processing. It uses a method called unsupervised learning, where it's initially trained on a large amount of text data and learns patterns from this data.

Large Language Model (LLM) = compressed meaning
The weights in the connections between the neurons in the neural net effectively become a compressed form of the 'knowledge' or 'meaning' in the text that was provided during training. This is an important point - the model is not just a representation of the text. It is, in a very real sense, an 'understanding' of the text. The model codifies what words make sense together, understands grammar, meaning - similarity in meaning between words, and nuances of meaning difference and when they would be used. This is what is learnt.

When given a prompt or input, it predicts the next token (word part) that should logically follow, based on what it has learned. It's important to break words down into tokens as there is meaning in the parts and without recognising these as different parts that meaning would be lost.

For example:

- **Handling compound words**: Consider the German word "Schadenfreude," which is often used in English to denote pleasure derived from another person's misfortune. (credit to Christoph Bergemann (Head of Research) for this example word here and his use of it in a recent managers call when reflecting on our performance relative to our competitors). The German language is famous for its long compound words. The word is a compound of "Schaden" (harm) and "Freude" (joy). A language model needs to understand both of these components to fully grasp the word's meaning. Breaking it down into tokens helps achieve that. Some people may have studied latin and may see the same patterns in the English language - knowing the roots and endings of words can help with understanding their meaning, or finding a word with the right nuance of meaning to communicate to others.

- **Understanding contractions**: In English, we often use contractions like "it's," which stands for "it is," or "I'm," which stands for "I am." By breaking these contractions into their component tokens, the model can better understand their meaning. For example, tokenising "it's" into "it" and "is" helps the model recognise the presence of a subject and a verb, which is crucial for understanding sentence structure.

- **Dealing with affixes**: Words can have prefixes or suffixes that change their meanings. Consider the word "unhappiness." By breaking it into the tokens "un," "happi," and "ness," the model can understand that the word denotes the state ("ness") of not ("un") being happy ("happi"). This granular understanding helps the model make more accurate predictions about word usage and meaning.

## ChatBots, models, and autoregression

These models are called autoregressive language models because they generate one token at a time, which means that each token output is based not only on the prompt that was input, or the history of the conversation in the chat, but on each token subsequently output by the model. ChatBots are wrappers for the model. The model does not change, does not remember your conversation, does not learn. The Chatbot wrapper keeps track of the conversation and whenever you add a new prompt that ChatBot provides all or some of the conversation history plus your prompt to the model and gets... wait for it... a token (about half a word). It then adds that on to the conversation history and calls the model again, and again, and again, until it gets what is termed a stop token from the model indicating the response is complete. These models are hence incredibly computationally expensive to run. The longer your prompt, and the longer its response, the more computation is needed.

## "175 billion parameter model"

The underlying model created for GPT-3 back in 2021 is a neural net architecture with many layers of many neurons and connections between the neurons in the layers. Each of the neurons may be connected to many other neurons. Each connection has a weight assigned that indicates the extent to which the neuron it is feeding its output to will pay attention to it versus the other neurons that are also feeding their output there. These weights are called the parameters of the model. GPT-3 has 175 billion parameters. OpenAI has not publicly said how many parameters are in the GPT-4 model but they have said that the main work done to improve the quality of output was on the data engineering side - improving the quality of the training input data and of the way model questions and answers were fed in to provide examples to align the model to generate the kinds of responses they wanted.

## Model Execution

Every time you ask a question, a farm of computers with GPUs converts that text into tokens by splitting the words up into semantically significant sub-parts and feeds them into one end of this neural net, then the sums and multiplications begin as all that data flows through the network with all of those neurons having a 'think' about what to do with the part of your prompt they were given before passing it on to the next. 175 billion weights across the network being used to massage your input prompt into something close to the entirety of human knowledge represented by those weights, so it can spit out an answer and give you a recipe for duck ragu and select an appropriate wine to go with it. (Prompt and response for that here: Duck ragu recipe and wine pairing)

[Back to top](#sidekick-manual-top)

# Responsible Use

## With great power comes great responsibility

Harnessing the power of Generative AI necessitates thoughtful prompting and responsible usage; it provides vast potential but ultimately, it's the user's responsibility to guide its applications and ensure the validity and appropriateness of its output in specific contexts.

## Tapping into the power of Generative AI conversational chatbots

Generative AI models and chatbots are ground-breaking tools in the realm of AI, offering a wealth of potential for diverse applications across various sectors. As an advanced language model, it's capable of generating human-like text responses, which can range from answering queries and writing essays or code to brainstorming ideas, designing or refactoring code, summarising notes, and more.

However, it's important to understand that while powerful, such models are not a magic bullet. Its performance and the value it provides depend significantly on how effectively you communicate your requirements to it. This means crafting your prompts carefully and thoughtfully to elicit the most useful and relevant responses. For example, remembering that you work in a certain context that you have come to take for granted in terms of how we work or the constraints or enablers that are surrounding you - and recapping what is unique about your situation and why you are asking a ChatBot for help will inform a better prompt. Include appropriate context in your prompt to improve the relevance of the response. Don't share anything sensitive.

## Using Generative AI to augment your skills and judgement

It's essential to remember that any ChatBot is ultimately an AI, relying on patterns and information it has learnt. It doesn't possess human judgement or understanding of specific contexts that you may operate in. Therefore, the answers or recommendations it generates should not be taken at face value or assumed to be absolutely correct, best practice, or necessarily suitable for your particular situation.

Of course, people also rely on patters of information they have learnt, and we all have biases. The difference is that we are self-aware, and should strive to have awareness of our biases. We can take steps to mitigate them biases and knowledge and experience gaps we have. Using AI Chatbots is one of many ways to do that. We can also use our judgement to decide whether to follow the advice of a ChatBot or not. 

In essence, AI Chatbots provide a broad canvas of possibilities inspired by the world's knowledge; It's up to you to interpret, apply, and quality assure these in your context. Its responses should be seen as prompts for you - a springboard that can inspire you, stimulate your thinking, and guide you on the best course of action based on your expert judgement and understanding of your unique circumstances.

Embracing this approach not only empowers you to get the most out of Generative AI, but it also fosters a more ethical, responsible, and effective use of this transformative AI technology.

## Conclusions

Remember, GenAI doesn't replace human skills and judgement, but it can serve as a powerful assistant that can enhance our capabilities, speed up processes, and provide valuable insights. While AI can provide valuable input quickly, you remain responsible for your own work and actions, whichever tools you use to help you.

[Back to top](#sidekick-manual-top)
