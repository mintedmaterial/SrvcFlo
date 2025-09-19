mcp_config
​
fastmcp.mcp_config
Canonical MCP Configuration Format.
This module defines the standard configuration format for Model Context Protocol (MCP) servers. It provides a client-agnostic, extensible format that can be used across all MCP implementations.
The configuration format supports both stdio and remote (HTTP/SSE) transports, with comprehensive field definitions for server metadata, authentication, and execution parameters.
Example configuration:

Copy
{
    "mcpServers": {
        "my-server": {
            "command": "npx",
            "args": ["-y", "@my/mcp-server"],
            "env": {"API_KEY": "secret"},
            "timeout": 30000,
            "description": "My MCP server"
        }
    }
}
​
Functions
​
infer_transport_type_from_url 

Copy
infer_transport_type_from_url(url: str | AnyUrl) -> Literal['http', 'sse']
Infer the appropriate transport type from the given URL.
​
update_config_file 

Copy
update_config_file(file_path: Path, server_name: str, server_config: CanonicalMCPServerTypes) -> None
Update an MCP configuration file from a server object, preserving existing fields.
This is used for updating the mcpServer configurations of third-party tools so we do not worry about transforming server objects here.
​
Classes
​
StdioMCPServer 
MCP server configuration for stdio transport.
This is the canonical configuration format for MCP servers using stdio transport.
Methods:
​
to_transport 

Copy
to_transport(self) -> StdioTransport
​
TransformingStdioMCPServer 
A Stdio server with tool transforms.
​
RemoteMCPServer 
MCP server configuration for HTTP/SSE transport.
This is the canonical configuration format for MCP servers using remote transports.
Methods:
​
to_transport 

Copy
to_transport(self) -> StreamableHttpTransport | SSETransport
​
TransformingRemoteMCPServer 
A Remote server with tool transforms.
​
MCPConfig 
A configuration object for MCP Servers that conforms to the canonical MCP configuration format while adding additional fields for enabling FastMCP-specific features like tool transformations and filtering by tags.
For an MCPConfig that is strictly canonical, see the CanonicalMCPConfig class.
Methods:
​
wrap_servers_at_root 

Copy
wrap_servers_at_root(cls, values: dict[str, Any]) -> dict[str, Any]
If there’s no mcpServers key but there are server configs at root, wrap them.
​
add_server 

Copy
add_server(self, name: str, server: MCPServerTypes) -> None
Add or update a server in the configuration.
​
from_dict 

Copy
from_dict(cls, config: dict[str, Any]) -> Self
Parse MCP configuration from dictionary format.
​
to_dict 

Copy
to_dict(self) -> dict[str, Any]
Convert MCPConfig to dictionary format, preserving all fields.
​
write_to_file 

Copy
write_to_file(self, file_path: Path) -> None
Write configuration to JSON file.
​
from_file 

Copy
from_file(cls, file_path: Path) -> Self
Load configuration from JSON file.
​
CanonicalMCPConfig 
Canonical MCP configuration format.
This defines the standard configuration format for Model Context Protocol servers. The format is designed to be client-agnostic and extensible for future use cases.
Methods:
​
add_server 

Copy
add_server(self, name: str, server: CanonicalMCPServerTypes) -> None
Add or update a server in the configuration.