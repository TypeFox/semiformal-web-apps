semiform
===

A semi-formal DSL for prompting LLMs.

### Usage:

#### CLI:
Usage: `node bin/cli.js prompt [ldsl-path] -n [project-name] -m [prompt-method] -d [output-dir]`
Arguments:
- `ldsl-path`: Path to the dsl file
- `project-name`: Name of your project, will be created under `output-dir`
- `prompt-method`: `single` generates everything in a single request, `multi` splits frontend and backend, `functions`: Uses OpenAI `assistant functions` features. `single` and `multi` are merely built as part of iterative testing. `functions` is recommended.


#### Requirements:
1. Have `OPENAI_API_KEY` exported or saved in `.env`.
2. Decided if you want to reuse existing assistant:
    1. No: Then you do not need anything, but you will create a new assistant if you run with `-m functions`.
    2. Yes: Then you will need to get the assistant ID from [https://platform.openai.com/assistants/](https://platform.openai.com/assistants/) and export it into your env as `SEMIFORM_ASSISTANT_ID`.
    3. `Should I?` It is a good idea if you want to try custom prompts.

#### Example:
We will use the test case `samples/test1.ldsdl`, so all you need is
1. Make sure the folder `samples/outputs` exists
2. Run `node --env-file=.env bin/cli.js prompt samples/blog-demo.ldsl -n blog-1 -m functions -d samples/outputs`
4. Keep an eye on the console output
5. Have a look into `samples/outputs/blog-1`
