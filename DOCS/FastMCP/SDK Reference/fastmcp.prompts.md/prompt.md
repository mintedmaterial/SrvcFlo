prompt
​
fastmcp.prompts.prompt
Base classes for FastMCP prompts.
​
Functions
​
Message 

Copy
Message(content: str | ContentBlock, role: Role | None = None, **kwargs: Any) -> PromptMessage
A user-friendly constructor for PromptMessage.
​
Classes
​
PromptArgument 
An argument that can be passed to a prompt.
​
Prompt 
A prompt template that can be rendered with parameters.
Methods:
​
enable 

Copy
enable(self) -> None
​
disable 

Copy
disable(self) -> None
​
to_mcp_prompt 

Copy
to_mcp_prompt(self, **overrides: Any) -> MCPPrompt
Convert the prompt to an MCP prompt.
​
from_function 

Copy
from_function(fn: Callable[..., PromptResult | Awaitable[PromptResult]], name: str | None = None, title: str | None = None, description: str | None = None, tags: set[str] | None = None, enabled: bool | None = None, meta: dict[str, Any] | None = None) -> FunctionPrompt
Create a Prompt from a function.
The function can return:
A string (converted to a message)
A Message object
A dict (converted to a message)
A sequence of any of the above
​
render 

Copy
render(self, arguments: dict[str, Any] | None = None) -> list[PromptMessage]
Render the prompt with arguments.
​
FunctionPrompt 
A prompt that is a function.
Methods:
​
from_function 

Copy
from_function(cls, fn: Callable[..., PromptResult | Awaitable[PromptResult]], name: str | None = None, title: str | None = None, description: str | None = None, tags: set[str] | None = None, enabled: bool | None = None, meta: dict[str, Any] | None = None) -> FunctionPrompt
Create a Prompt from a function.
The function can return:
A string (converted to a message)
A Message object
A dict (converted to a message)
A sequence of any of the above
​
render 

Copy
render(self, arguments: dict[str, Any] | None = None) -> list[PromptMessage]
Render the prompt with arguments.