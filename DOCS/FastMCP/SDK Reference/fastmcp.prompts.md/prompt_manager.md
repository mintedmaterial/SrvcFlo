prompt_manager
​
fastmcp.prompts.prompt_manager
​
Classes
​
PromptManager 
Manages FastMCP prompts.
Methods:
​
mount 

Copy
mount(self, server: MountedServer) -> None
Adds a mounted server as a source for prompts.
​
has_prompt 

Copy
has_prompt(self, key: str) -> bool
Check if a prompt exists.
​
get_prompt 

Copy
get_prompt(self, key: str) -> Prompt
Get prompt by key.
​
get_prompts 

Copy
get_prompts(self) -> dict[str, Prompt]
Gets the complete, unfiltered inventory of all prompts.
​
list_prompts 

Copy
list_prompts(self) -> list[Prompt]
Lists all prompts, applying protocol filtering.
​
add_prompt_from_fn 

Copy
add_prompt_from_fn(self, fn: Callable[..., PromptResult | Awaitable[PromptResult]], name: str | None = None, description: str | None = None, tags: set[str] | None = None) -> FunctionPrompt
Create a prompt from a function.
​
add_prompt 

Copy
add_prompt(self, prompt: Prompt) -> Prompt
Add a prompt to the manager.
​
render_prompt 

Copy
render_prompt(self, name: str, arguments: dict[str, Any] | None = None) -> GetPromptResult
Internal API for servers: Finds and renders a prompt, respecting the filtered protocol path.