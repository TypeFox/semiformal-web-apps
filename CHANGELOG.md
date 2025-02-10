Changelog 
===

This changelog capture the state of the project across multiple tags for the purpose of reproducibility.

### Versioning Scheme
Since this project is in early development, a date-based versioning scheme is used.
Follows loosely ubuntu versioning scheme: `YY.MM.patch`.
Patches are incremental Ids that resets every month.

### 25.2.1:
Support for OpenAI API support
Multiple modes:
1. Single prompt: All files are generated in the a single prompt
2. Multi-prompt: Backend is prompted first, followed by a second prompt for the frontend
3. Function-prompting: Uses `function-calling` to properly structure the response. Best so far.
