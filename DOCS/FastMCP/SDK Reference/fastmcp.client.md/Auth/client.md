client
​
fastmcp.client.client
​
Classes
​
ClientSessionState 
Holds all session-related state for a Client instance.
This allows clean separation of configuration (which is copied) from session state (which should be fresh for each new client instance).
​
Client 
MCP client that delegates connection management to a Transport instance.
The Client class is responsible for MCP protocol logic, while the Transport handles connection establishment and management. Client provides methods for working with resources, prompts, tools and other MCP capabilities.
This client supports reentrant context managers (multiple concurrent async with client: blocks) using reference counting and background session management. This allows efficient session reuse in any scenario with nested or concurrent client usage.
MCP SDK 1.10 introduced automatic list_tools() calls during call_tool() execution. This created a race condition where events could be reset while other tasks were waiting on them, causing deadlocks. The issue was exposed in proxy scenarios but affects any reentrant usage.
The solution uses reference counting to track active context managers, a background task to manage the session lifecycle, events to coordinate between tasks, and ensures all session state changes happen within a lock. Events are only created when needed, never reset outside locks.
This design prevents race conditions where tasks wait on events that get replaced by other tasks, ensuring reliable coordination in concurrent scenarios.
Args:
transport: Connection source specification, which can be:
ClientTransport: Direct transport instance
FastMCP: In-process FastMCP server
AnyUrl or str: URL to connect to
Path: File path for local socket
MCPConfig: MCP server configuration
dict: Transport configuration
roots: Optional RootsList or RootsHandler for filesystem access
sampling_handler: Optional handler for sampling requests
log_handler: Optional handler for log messages
message_handler: Optional handler for protocol messages
progress_handler: Optional handler for progress notifications
timeout: Optional timeout for requests (seconds or timedelta)
init_timeout: Optional timeout for initial connection (seconds or timedelta). Set to 0 to disable. If None, uses the value in the FastMCP global settings.
Examples:

Copy
# Connect to FastMCP server
client = Client("http://localhost:8080")

async with client:
    # List available resources
    resources = await client.list_resources()

    # Call a tool
    result = await client.call_tool("my_tool", {"param": "value"})
Methods:
​
session 

Copy
session(self) -> ClientSession
Get the current active session. Raises RuntimeError if not connected.
​
initialize_result 

Copy
initialize_result(self) -> mcp.types.InitializeResult
Get the result of the initialization request.
​
set_roots 

Copy
set_roots(self, roots: RootsList | RootsHandler) -> None
Set the roots for the client. This does not automatically call send_roots_list_changed.
​
set_sampling_callback 

Copy
set_sampling_callback(self, sampling_callback: ClientSamplingHandler) -> None
Set the sampling callback for the client.
​
set_elicitation_callback 

Copy
set_elicitation_callback(self, elicitation_callback: ElicitationHandler) -> None
Set the elicitation callback for the client.
​
is_connected 

Copy
is_connected(self) -> bool
Check if the client is currently connected.
​
new 

Copy
new(self) -> Client[ClientTransportT]
Create a new client instance with the same configuration but fresh session state.
This creates a new client with the same transport, handlers, and configuration, but with no active session. Useful for creating independent sessions that don’t share state with the original client.
Returns:
A new Client instance with the same configuration but disconnected state.
​
close 

Copy
close(self)
​
ping 

Copy
ping(self) -> bool
Send a ping request.
​
cancel 

Copy
cancel(self, request_id: str | int, reason: str | None = None) -> None
Send a cancellation notification for an in-progress request.
​
progress 

Copy
progress(self, progress_token: str | int, progress: float, total: float | None = None, message: str | None = None) -> None
Send a progress notification.
​
set_logging_level 

Copy
set_logging_level(self, level: mcp.types.LoggingLevel) -> None
Send a logging/setLevel request.
​
send_roots_list_changed 

Copy
send_roots_list_changed(self) -> None
Send a roots/list_changed notification.
​
list_resources_mcp 

Copy
list_resources_mcp(self) -> mcp.types.ListResourcesResult
Send a resources/list request and return the complete MCP protocol result.
Returns:
mcp.types.ListResourcesResult: The complete response object from the protocol, containing the list of resources and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
list_resources 

Copy
list_resources(self) -> list[mcp.types.Resource]
Retrieve a list of resources available on the server.
Returns:
list[mcp.types.Resource]: A list of Resource objects.
Raises:
RuntimeError: If called while the client is not connected.
​
list_resource_templates_mcp 

Copy
list_resource_templates_mcp(self) -> mcp.types.ListResourceTemplatesResult
Send a resources/listResourceTemplates request and return the complete MCP protocol result.
Returns:
mcp.types.ListResourceTemplatesResult: The complete response object from the protocol, containing the list of resource templates and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
list_resource_templates 

Copy
list_resource_templates(self) -> list[mcp.types.ResourceTemplate]
Retrieve a list of resource templates available on the server.
Returns:
list[mcp.types.ResourceTemplate]: A list of ResourceTemplate objects.
Raises:
RuntimeError: If called while the client is not connected.
​
read_resource_mcp 

Copy
read_resource_mcp(self, uri: AnyUrl | str) -> mcp.types.ReadResourceResult
Send a resources/read request and return the complete MCP protocol result.
Args:
uri: The URI of the resource to read. Can be a string or an AnyUrl object.
Returns:
mcp.types.ReadResourceResult: The complete response object from the protocol, containing the resource contents and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
read_resource 

Copy
read_resource(self, uri: AnyUrl | str) -> list[mcp.types.TextResourceContents | mcp.types.BlobResourceContents]
Read the contents of a resource or resolved template.
Args:
uri: The URI of the resource to read. Can be a string or an AnyUrl object.
Returns:
list[mcp.types.TextResourceContents | mcp.types.BlobResourceContents]: A list of content objects, typically containing either text or binary data.
Raises:
RuntimeError: If called while the client is not connected.
​
list_prompts_mcp 

Copy
list_prompts_mcp(self) -> mcp.types.ListPromptsResult
Send a prompts/list request and return the complete MCP protocol result.
Returns:
mcp.types.ListPromptsResult: The complete response object from the protocol, containing the list of prompts and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
list_prompts 

Copy
list_prompts(self) -> list[mcp.types.Prompt]
Retrieve a list of prompts available on the server.
Returns:
list[mcp.types.Prompt]: A list of Prompt objects.
Raises:
RuntimeError: If called while the client is not connected.
​
get_prompt_mcp 

Copy
get_prompt_mcp(self, name: str, arguments: dict[str, Any] | None = None) -> mcp.types.GetPromptResult
Send a prompts/get request and return the complete MCP protocol result.
Args:
name: The name of the prompt to retrieve.
arguments: Arguments to pass to the prompt. Defaults to None.
Returns:
mcp.types.GetPromptResult: The complete response object from the protocol, containing the prompt messages and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
get_prompt 

Copy
get_prompt(self, name: str, arguments: dict[str, Any] | None = None) -> mcp.types.GetPromptResult
Retrieve a rendered prompt message list from the server.
Args:
name: The name of the prompt to retrieve.
arguments: Arguments to pass to the prompt. Defaults to None.
Returns:
mcp.types.GetPromptResult: The complete response object from the protocol, containing the prompt messages and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
complete_mcp 

Copy
complete_mcp(self, ref: mcp.types.ResourceReference | mcp.types.PromptReference, argument: dict[str, str]) -> mcp.types.CompleteResult
Send a completion request and return the complete MCP protocol result.
Args:
ref: The reference to complete.
argument: Arguments to pass to the completion request.
Returns:
mcp.types.CompleteResult: The complete response object from the protocol, containing the completion and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
complete 

Copy
complete(self, ref: mcp.types.ResourceReference | mcp.types.PromptReference, argument: dict[str, str]) -> mcp.types.Completion
Send a completion request to the server.
Args:
ref: The reference to complete.
argument: Arguments to pass to the completion request.
Returns:
mcp.types.Completion: The completion object.
Raises:
RuntimeError: If called while the client is not connected.
​
list_tools_mcp 

Copy
list_tools_mcp(self) -> mcp.types.ListToolsResult
Send a tools/list request and return the complete MCP protocol result.
Returns:
mcp.types.ListToolsResult: The complete response object from the protocol, containing the list of tools and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
list_tools 

Copy
list_tools(self) -> list[mcp.types.Tool]
Retrieve a list of tools available on the server.
Returns:
list[mcp.types.Tool]: A list of Tool objects.
Raises:
RuntimeError: If called while the client is not connected.
​
call_tool_mcp 

Copy
call_tool_mcp(self, name: str, arguments: dict[str, Any], progress_handler: ProgressHandler | None = None, timeout: datetime.timedelta | float | int | None = None) -> mcp.types.CallToolResult
Send a tools/call request and return the complete MCP protocol result.
This method returns the raw CallToolResult object, which includes an isError flag and other metadata. It does not raise an exception if the tool call results in an error.
Args:
name: The name of the tool to call.
arguments: Arguments to pass to the tool.
timeout: The timeout for the tool call. Defaults to None.
progress_handler: The progress handler to use for the tool call. Defaults to None.
Returns:
mcp.types.CallToolResult: The complete response object from the protocol, containing the tool result and any additional metadata.
Raises:
RuntimeError: If called while the client is not connected.
​
call_tool 

Copy
call_tool(self, name: str, arguments: dict[str, Any] | None = None, timeout: datetime.timedelta | float | int | None = None, progress_handler: ProgressHandler | None = None, raise_on_error: bool = True) -> CallToolResult
Call a tool on the server.
Unlike call_tool_mcp, this method raises a ToolError if the tool call results in an error.
Args:
name: The name of the tool to call.
arguments: Arguments to pass to the tool. Defaults to None.
timeout: The timeout for the tool call. Defaults to None.
progress_handler: The progress handler to use for the tool call. Defaults to None.
​
Returns:
The content returned by the tool. If the tool returns structured outputs, they are returned as a dataclass (if an output schema is available) or a dictionary; otherwise, a list of content blocks is returned. Note: to receive both structured and unstructured outputs, use call_tool_mcp instead and access the raw result object.
Raises:
ToolError: If the tool call results in an error.
RuntimeError: If called while the client is not connected.
​
generate_name 

Copy
generate_name(cls, name: str | None = None) -> str
​
CallToolResult 