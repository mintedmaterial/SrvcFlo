messages
​
fastmcp.client.messages
​
Classes
​
MessageHandler 
This class is used to handle MCP messages sent to the client. It is used to handle all messages, requests, notifications, and exceptions. Users can override any of the hooks
Methods:
​
dispatch 

Copy
dispatch(self, message: Message) -> None
​
on_message 

Copy
on_message(self, message: Message) -> None
​
on_request 

Copy
on_request(self, message: RequestResponder[mcp.types.ServerRequest, mcp.types.ClientResult]) -> None
​
on_ping 

Copy
on_ping(self, message: mcp.types.PingRequest) -> None
​
on_list_roots 

Copy
on_list_roots(self, message: mcp.types.ListRootsRequest) -> None
​
on_create_message 

Copy
on_create_message(self, message: mcp.types.CreateMessageRequest) -> None
​
on_notification 

Copy
on_notification(self, message: mcp.types.ServerNotification) -> None
​
on_exception 

Copy
on_exception(self, message: Exception) -> None
​
on_progress 

Copy
on_progress(self, message: mcp.types.ProgressNotification) -> None
​
on_logging_message 

Copy
on_logging_message(self, message: mcp.types.LoggingMessageNotification) -> None
​
on_tool_list_changed 

Copy
on_tool_list_changed(self, message: mcp.types.ToolListChangedNotification) -> None
​
on_resource_list_changed 

Copy
on_resource_list_changed(self, message: mcp.types.ResourceListChangedNotification) -> None
​
on_prompt_list_changed 

Copy
on_prompt_list_changed(self, message: mcp.types.PromptListChangedNotification) -> None
​
on_resource_updated 

Copy
on_resource_updated(self, message: mcp.types.ResourceUpdatedNotification) -> None
​
on_cancelled 

Copy
on_cancelled(self, message: mcp.types.CancelledNotification) -> None