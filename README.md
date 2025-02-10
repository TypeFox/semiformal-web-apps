semiform
===

A semi-formal DSL for prompting LLMs.

### How does this work?
Current, the AST is serialized as JSON and sent to the assistant.
The system prompts explains the model's structure and semantics.

In general (and depending on the LLM's mood), it should generate two folders, `frontend` and `backend` (for the given `samples/blog-demo.ldsl`).

### Usage:

#### CLI:
Usage: `node bin/cli.js prompt [ldsl-path] -n [project-name] -l [llm-backend] -d [output-dir]`
Arguments:
- `ldsl-path`: Path to the dsl file
- `project-name`: Name of your project, will be created under `output-dir`
- `llm-backend`: `openai` or `anthropic`
- `output-dir`: Directory to save the generated project


#### Requirements:
1. Build the project: `npm run langium:generate && npm run build`
2. Have `OPENAI_API_KEY` exported or saved in `.env`.
3. Have `ANTHROPIC_API_KEY` exported or saved in `.env`.
4. (OpenAI Only) Decided if you want to reuse existing assistant:
    1. No: Then you do not need anything, the API will probably create a new assistant if you run with `-m functions`.
    2. Yes: Then you will need to get the assistant ID from [https://platform.openai.com/assistants/](https://platform.openai.com/assistants/) and export it into your env as `SEMIFORM_ASSISTANT_ID`.
    3. `Should I?` It is a good idea to create a new assistant if you want to try custom system prompts.

#### Example:
We will use the test case `samples/test1.ldsdl`, so all you need is
1. Make sure the folder `samples/outputs` exists
2. Run `node --env-file=.env bin/cli.js prompt samples/blog-demo.ldsl -n blog-1 -l openai -d samples/outputs`
4. Keep an eye on the console output
5. Have a look into `samples/outputs/blog-1`
