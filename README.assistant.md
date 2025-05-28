## Semiform Cursor Assistant

This repo provides a basic example on how to use cursor agent to write semiform for you!

Here is a step by step guide on how to achieve that:

1. Get this repo if you didn't already
2. We will be using `claude 3.7` because it's just better, so make sure you have your env setup.
3. Fire up cursor and select the following folder:  `samples/cursor-assistant` (part of this repo).
4. This folder contains cursor rule `semiform-rules.mdc` located in `.cursor/rules/`, I suggest you read it a bit
5. Press `Cmd + Shift + L` to load Cursor's Chat tab, and describe your request to the agent.
6. The agent should generate a `.swa` file.
7. Tweak the file if needed, or even better, request changes from the agent.
8. Run it! I recommend saving the output in a sub folder of cursor-assistant, so you can easily prompt it to fix mistakes if present.

Here is how to run the calculator example:
```
node --env-file=.env bin/cli.js prompt samples/cursor-assistant/calculator.swa -n calculator-app-3 -p anthropic -d samples/cursor-assistant/code -t 64000 -m claude-3-7-sonnet-20250219
```