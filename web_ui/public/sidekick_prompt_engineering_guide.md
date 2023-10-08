# Contents

- [Contents](#contents)
  - [Prompt Engineering Guide](#prompt-engineering-guide)
    - [Quick Tips](#quick-tips)
    - [Library of prompt engineering patterns](#library-of-prompt-engineering-patterns)
  - [Generative AI](#generative-ai)
    - [What is Generative AI?](#what-is-generative-ai)
    - [How models are trained](#how-models-are-trained)
  - [ChatBots, models, and autoregression](#chatbots-models-and-autoregression)
  - ["175 billion parameter model"](#175-billion-parameter-model)
  - [Model Execution](#model-execution)

## Prompt Engineering Guide

Prompt engineering refers to the practice of designing and structuring inputs or "prompts" to get the best or most appropriate and useful output from the AI. It's a powerful technique to make the most of the wealth of information embedded in AI models.

### Quick Tips

- **Start with a clear goal**: What do you want to achieve? What is the question you want to answer? What is the problem you want to solve? What is the task you want to complete? What is the information you want to find? What is the idea you want to generate? What is the document you want to create? What is the story you want to tell? What is the conversation you want to have? What is the persona you want to create? What is the persona you want to talk to? What is the persona you want to talk as? What is
- Ask precise, direct questions; ensure your request is specific and unambiguous
- Use industry-specific terms and domain specific language to get more relevant results
- Define the topic or area of interest, regine this in the dialogue
- Avoid open-ended questions and vague or general terminology
- Delete parts of the chat that are not relevant to avoid misleading the AI (the whole chat is fed into the model each time you ask a question)

[Back to top](#sidekick-prompt-engineering-guide-top)

### Library of prompt engineering patterns

1. **Continue**: If the answer you got was too short or was cut off before it completed because it was bigger than the buffer the AI has to create a response in then just prompt 'continue' to get more.

2. **Define the Answer Format**: You can instruct the model about the format you want the answer in. E.g., "In bullet points, list the steps for a software risk assessment."
3. **Ask for the output as markdown**: You can instruct the model to output the answer in markdown format. E.g.,
   1. Provide the output as a narrative
   2. Provide the output as a dialogue between relevant protagonists
   3. Provide the output as markdown bullets
   4. Provide the output as a markdown document with headings, subheadings and text or bullets in each section as is most appropriate
   5. Provide the output in CSV format
   6. Provide the output in JSON format
   7. Provide the output as a Mermaid flowchart diagram
   8. Provide the output as a Mermaid sequence diagram
   9. Provide the output as a Mermaid class diagram
   10. Provide the output as a Mermaid state diagram
   11. Provide the output as a Mermaid Gantt chart diagram
   12. Provide the output as a Mermaid pie chart diagram
   13. Provide the output as a Mermaid user journey diagram
   14. Provide the output as a Mermaid entity relationship diagram

4. **Step-by-step Requests**: Ask the model to think step-by-step or reason through a problem. E.g., "Describe, step-by-step, how to implement multi-factor authentication."

5. **Pros and Cons**: This can be useful to see different sides of an argument or to ensure a thorough approach to a problem. E.g., "What are the pros and cons of using an object store versus a file system?"

6. **Perspectives**: Understand how people in different roles or with different risk postures could see a situation. E.g., "What makes a good business case from the perspective of the CEO, COO, CTO, CFO, Head of risk, Head of business development?"

7. **Elaborate**: Following a response that is a good start, ask for elaboration, providing examples in your prompt to drive and shape the type and amount of content you want back, E.g., "Elaborate on what makes a good business case by providing each role title without the summary paragraph along with ten bullets for the top things that role would want to see in a business case

8. **Use Explicit Requests**: If you want the model to generate a list, poem, or any specific type of text, it's best to specify that in your prompt. E.g., "Generate a list of cybersecurity best practices."

9. **Provide Example output**: Providing examples can help the model but could also constrain it so use with caution. For example: If you want the output in a certain format, and its not a well defined format like a bullet list, or CSV, then as well as describing the format provide examples. You can also provide examples of the kind of ideas you want if you are asking more open questions to help with creativity to explain what you mean, but this can have the side effect of missing out on angles you hadn't thought of. In this case, you can also just ask without providing an example, and then ask again with examples to get the best of both.

10. **Creativity Control**: Control the creativity level of the AI by instructing it to be more conservative or more innovative. E.g., "Give me a conservative estimate of implementing AI in customer service" versus "Suggest some innovative uses of AI in customer service."

11. **Contextual Information**: Providing additional context can help guide the model's response. E.g., "Considering the current advancements in quantum computing, what are the potential security risks?"

12. **Specify the Detail Level**: You can instruct the model to provide a high-level summary or a detailed explanation. E.g., "Give me a high-level overview of GDPR" versus "Provide a detailed explanation of GDPR."

13. **Role-play Scenarios**: You can use prompts that put the model in a specific role. E.g., "Pretend you are an IT helpdesk assistant and guide me through resetting my password."

14. **Direct Questions**: These work well if you need specific information. E.g., "What is the difference between SQL and NoSQL databases?"

15. **Temporal Instructions**: You can guide the model to answer based on a specific time. E.g., "What were the leading cybersecurity threats in 2022? What do you predict they will be five years from now?"

16. **Location-based Instructions**: Similar to temporal instructions, you can ask location-specific questions. E.g., "What are the data protection regulations in the European Union?"

17. **Idea Generation**: Ask the model to brainstorm ideas. E.g., "What are some innovative ways to improve customer experience in user interface design using Generative AI?"

18. **Iterative Conversations**: Don't limit yourself to a single question. Feel free to have a back-and-forth with the model to refine your output.

19. **Multiple Angles**: For complex problems, consider asking the same question from different angles to ensure a comprehensive, unbiased answer. How can I improve the performance of this? What would I be trading off if I did that?

20. **Hypothetical Scenarios**: Use hypothetical scenarios for strategic thinking or creative problem solving. E.g., "Imagine we could fully automate our customer service with AI. What would be the implications?"

21. **Prompt Politeness**: Make your prompts polite to get more formal responses. E.g., "Could you kindly provide a brief on current fintech trends?"

22. **Document Edits**: Ask the model to proofread or edit a document. E.g., "Please proofread the following paragraph for grammatical errors."

23. **Analogies**: Use analogies to explain complex ideas. E.g., "Explain cloud computing to a five-year-old."

24. **Emulate Styles**: You can ask the model to emulate a certain writing style. E.g., "Write a summary of the latest AI advancements in the style of a New York Times article."

25. **Factual vs. Opinion-Based Responses**: Specify if you want a factual response or an opinion. E.g., "What are the facts about quantum computing?" versus "What's your opinion on the future of quantum computing?" Remember, though, that GPT's "opinions" are simulated and based on patterns it learned during training.

[Back to top](#sidekick-prompt-engineering-guide-top)

## Generative AI

Understanding how Generative AI works can help you get the most out of it. This section provides a brief overview of Generative AI.

### What is Generative AI?

Generative AI models use machine learning techniques to provide human-like text based on the input (prompt) they receive. Generative AIs can answer questions, write essays, summarize texts, translate languages, and even generate ideas. Google Research released the Transformer model that is the basis of many modern Generative AI tools. GPT-4 is a cutting-edge language model developed by OpenAI based on Transformers. ChatGPT is a wrapper for GPT-4 that lets you talk to it in a chat window. Sidekick uses the OpenAI API to access GPT-3.5-turbo and GPT-4.

### How models are trained

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

[Back to top](#sidekick-prompt-engineering-guide-top)