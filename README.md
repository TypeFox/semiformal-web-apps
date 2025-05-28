semiform
===

A semi-formal DSL for prompting LLMs.


> **Note**
>
> If you are here for the full power of semiform, you may also want to read [./README.assistant.md](./README.assistant.md)
> This README is still a prerequisite to keep on reading!


### How does this work?
Current, the AST is serialized as JSON and sent to the assistant.
The system prompts explains the model's structure and semantics.

The LLM is instructed to generate two folders, `frontend` and `backend` (for the given `samples/blog-demo.swa`).

### Usage:

#### CLI:
Usage: `node bin/cli.js prompt [file-path] -n [project-name] -p [provider] -d [output-dir] -m [model-name] -t [max-tokens]`
Arguments:
- `file-path` (required): Path to the dsl file
- `project-name` (required): Name of your project, will be created under `output-dir`
- `provider`: `openai-assistant` or `openai`, `anthropic`, etc. Defaults to `anthropic`.
- `output-dir`: Directory to save the generated project. Defaults to `./generated`
- `model-name`: Name of the model to use. Depends on the provider. Defaults to preset values, check `src/llm-api/common/default-models.ts` for details.
- `max-tokens` (required if not using `gpt-4o` or `anthropic`): Maximum number of tokens to use. Model dependent, please checkout [./model-info.md](model-info.md) for more information. Some default values are preset for some models but not all.
- `--text`: A flag, if enabled, instead of serializing the DSL as a JSON, the DSL raw text file will be sent to the LLM for prompting. Useful for comparing `json` vs `text`. Default `false`



#### Requirements:
1. Install dependencies: `npm i`
2. Build the project: `npm run langium:generate && npm run build`
3. Create a `.env` file in the root of this project.
4. Have `[provider]_API_KEY` exported or saved in `.env`, where `provider` is the LLM provider you are using (e.g. `OPENAI`).
5. (OpenAI Only) If you want to reuse an assistant, you can paste its ID into your env as `SEMIFORM_ASSISTANT_ID`.

#### Notes on OpenAI providers:

This project uses vercel's `ai` package to communicate with various LLM providers.
Vercel's `ai` package is a wrapper and supports mostly common operations. 

OpenAI provides an assistant API, which is a more powerful API for interacting with models, which is not supported by vercel's `ai` package. Hence we have our own implementation for OpenAI's Assistant API.

When creating a project, the `-p` parameter accepts a `provider` string, which can be one of the following:
- `openai-assistant`: Use OpenAI's Assistant API
- `openai`: Use OpenAI's `gpt-4o` model
- `anthropic`: Use Anthropic's `claude-3-5-sonnet` model
- `mistral`: Use Mistral's `mistral-large-latest` model
- and more

`openai-assistant` is our own implementation for OpenAI's Assistant API. The rest are supported by vercel's `ai` package.


#### Example:
Let's compare the two LLM backends, for the same DSL file!

We will use the test case `samples/blog-demo.swa` and assume you have **both** keys exported, so all you need is
1. Make sure the folder `samples/outputs` exists
2. Run `node --env-file=.env bin/cli.js prompt samples/blog-demo.swa -n blog-by-openai -p openai-assistant -d samples/outputs`
4. Keep an eye on the console output
5. Have a look into `samples/outputs/blog-by-openai`
6. Run `node --env-file=.env bin/cli.js prompt samples/blog-demo.swa -n blog-by-anthropic -p anthropic -d samples/outputs -t 8192`
7. Have a look at both folders `samples/outputs/blog-by-openai` and `samples/outputs/blog-by-anthropic`.
8. The backend should be runnable with `docker compose up` and the frontend with `npm i && npm run start`.

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

By default, if no model is specified, `gpt-4-turbo` will be used for openai and `claude-3-5-sonnet-20241022` will be used for anthropic.

More models can be found here:
- OpenAI: [https://platform.openai.com/docs/models](https://platform.openai.com/docs/models)
- Anthropic: [https://docs.anthropic.com/en/docs/about-claude/models](https://docs.anthropic.com/en/docs/about-claude/models)

Few notes:
- (OpenAI) Some models are incompatible with the assistant API .
- (OpenAI) `o1` and `o3-mini` models are locked behind a `tier-3` usage. Meaning, the account underwhich the API key is used, must be tier 3. 

To check account tier, have a look at the limit section [https://platform.openai.com/settings/organization/limits](https://platform.openai.com/settings/organization/limits)

#### Telemetry:

This project uses `langfuse` (https://langfuse.com/) for telemetry (thanks to vercel's `ai` package).
To enable it you need a running instance of `langfuse` (just cloning the repo and running `docker compose up` to get started), and set the following environment variables:
- `LANGFUSE_PUBLIC_KEY`: Your Langfuse public key
- `LANGFUSE_SECRET_KEY`: Your Langfuse secret key
- `LANGFUSE_BASEURL`: Your Langfuse base URL (should be `http://localhost:3000` if you are running a local instance)

#### Further reading:
- Vercel's `ai` package: [https://github.com/vercel/ai](https://github.com/vercel/ai)
- `ai` Providers: [https://sdk.vercel.ai/providers/ai-sdk-providers](https://sdk.vercel.ai/providers/ai-sdk-providers)

