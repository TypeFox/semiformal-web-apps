semiform
===

A semi-formal DSL for prompting LLMs.

### How does this work?
Current, the AST is serialized as JSON and sent to the assistant.
The system prompts explains the model's structure and semantics.

The LLM is instructed to generate two folders, `frontend` and `backend` (for the given `samples/blog-demo.ldsl`).

### Usage:

#### CLI:
Usage: `node bin/cli.js prompt [ldsl-path] -n [project-name] -l [llm-backend] -d [output-dir] -m [model-name]`
Arguments:
- `ldsl-path`: Path to the dsl file
- `project-name`: Name of your project, will be created under `output-dir`
- `llm-backend`: `openai` or `anthropic`
- `output-dir`: Directory to save the generated project
- `model-name`* (optional): Name of the model to use. Depends on the LLM backend.

#### Requirements:
1. Build the project: `npm run langium:generate && npm run build`
2. Have `OPENAI_API_KEY` exported or saved in `.env`.
3. Have `ANTHROPIC_API_KEY` exported or saved in `.env`.
4. (OpenAI Only) Decide if you want to reuse existing assistant or not:
    1. No: Then you do not need anything, the API will probably create a new assistant if you run with `-m functions`.
    2. Yes: Then you will need to get the assistant ID from [https://platform.openai.com/assistants/](https://platform.openai.com/assistants/) and export it into your env as `SEMIFORM_ASSISTANT_ID`.
    3. `Should I?` It is a good idea to create a new assistant if you want to try custom system prompts.

#### Example:
Let's compare the two LLM backends, for the same DSL file!


We will use the test case `samples/blog-demo.ldsl` and assume you have **both** keys exported, so all you need is
1. Make sure the folder `samples/outputs` exists
2. Run `node --env-file=.env bin/cli.js prompt samples/blog-demo.ldsl -n blog-1 -l openai -d samples/outputs`
4. Keep an eye on the console output
5. Have a look into `samples/outputs/blog-1`
6. Run `node --env-file=.env bin/cli.js prompt samples/blog-demo.ldsl -n blog-1 -l anthropic -d samples/outputs`


#### Overriding the model:

Models are vendor specific, below is a short list of models for you to pick one quickly:

| Vendor | Models | Description | Usable |
|--------|-------|-------------|--------|
| Anthropic | `claude-3-5-sonnet-latest` (-> `claude-3-5-sonnet-20241022`) | Latest and most capable Anthropic model | Yes |
| Anthropic | `claude-3-5-haiku-latest` (-> `claude-3-5-haiku-20241022`) | Latest and most capable Anthropic model | Yes |
| OpenAI | `gpt-4o` (-> `gpt-4o-2024-08-06`), `gpt-4o-2024-11-20`, `gpt-4o-2024-08-06` | OpenAI flagship model. `gpt-4o` is an alias | Yes |
| OpenAI | `chatgpt-4o-latest` | Latest version used in ChatGPT | No (incompatible with assistant API) |
| OpenAI | `gpt-4o-mini` (-> `gpt-4o-mini-2024-07-18`) | Smaller and faster and cheaper, for focussed tasks. | Yes |
| OpenAI | `o1` (-> `o1-2024-12-17`, `o1-mini` (-> `o1-mini-2024-09-12`)) | Reasoning models. | No (locked behind tier-3) |
| OpenAI | `o3-mini` (-> `o3-mini-2025-01-31`) | Smaller than `o1` and superior to `o1-mini`. High Intelligence. | No (locked behind tier-3) |

By default, if no model is specified, `gpt-4o` will be used for openai and `claude-3-5-sonnet-20241022` will be used for anthropic.

More models can be found here:
- OpenAI: [https://platform.openai.com/docs/models](https://platform.openai.com/docs/models)
- Anthropic: [https://docs.anthropic.com/en/docs/about-claude/models](https://docs.anthropic.com/en/docs/about-claude/models)

Few notes:
- (OpenAI) Some models are incompatible with the assistant API .
- (OpenAI) `o1` and `o3-mini` models are locked behind a `tier-3` usage. Meaning, the account underwhich the API key is used, must be tier 3. 

To check account tier, have a look at the limit section [https://platform.openai.com/settings/organization/limits](https://platform.openai.com/settings/organization/limits)



