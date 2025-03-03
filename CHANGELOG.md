Changelog 
===

This changelog capture the state of the project across multiple tags for the purpose of reproducibility.

### Versioning Scheme
Since this project is in early development, a date-based versioning scheme is used.
Follows loosely ubuntu versioning scheme: `YY.MM.patch`.
Patches are incremental Ids that resets every month.

### 25.3.1:
- Added new CLI flag to `--text` to prompt the DSL as raw text instead of `json`. Use this if you want to compare the impact for the DSL format. (Default is JSON unless the flag is specified)
- `NOTES.md` is now hard-coded to be saved in the base folder (LLM is not always consistent with the output folder of notes file)
- Allow the schema of tool call to be a `string`, because it sometimes returns a valid JSON .. except as a `string`. If that is the case, further validation is applied for consistency.
- Added cursor rules to test the agent (step 3 of our initial plan).

### 25.2.3:
- Integrated vercel `ai` sdk allowing us to prompt various providers
- Renamed our custom implementation of `openai` to `openai-assistant`. Now, `openai` uses vercel `@ai-sdk/openai` provider, while `openai-assistant` uses our own implementation for OpenAI's Assistant API.
- Added support for `langfuse` telemetry

### 25.2.2:
- Added support for anthropic
- Removed single prompt mode and multi-prompt mode
- Added model-name option to prompt command, to allow for testing various models

Anthropic uses 2 system prompts, one for the backend and one for the frontend.

Since Anthropic is stateless, we have to manually keep track of the conversation, i.e
sending the entire conversation history with each request.
That's expensive, coming up with intermediate solution might be a better approach.
Right now, the `frontend` and `backend` codebases are generated in separate runs, but one request 
each.

### 25.2.1:
Support for OpenAI API support
Multiple modes:
1. Single prompt: All files are generated in the a single prompt
2. Multi-prompt: Backend is prompted first, followed by a second prompt for the frontend
3. Function-prompting: Uses `function-calling` to properly structure the response. Best so far.
