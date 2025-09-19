oauth
​
fastmcp.client.auth.oauth
​
Functions
​
default_cache_dir 

Copy
default_cache_dir() -> Path
​
check_if_auth_required 

Copy
check_if_auth_required(mcp_url: str, httpx_kwargs: dict[str, Any] | None = None) -> bool
Check if the MCP endpoint requires authentication by making a test request.
Returns:
True if auth appears to be required, False otherwise
​
Classes
​
StoredToken 
Token storage format with absolute expiry time.
​
FileTokenStorage 
File-based token storage implementation for OAuth credentials and tokens. Implements the mcp.client.auth.TokenStorage protocol.
Each instance is tied to a specific server URL for proper token isolation.
Methods:
​
get_base_url 

Copy
get_base_url(url: str) -> str
Extract the base URL (scheme + host) from a URL.
​
get_cache_key 

Copy
get_cache_key(self) -> str
Generate a safe filesystem key from the server’s base URL.
​
get_tokens 

Copy
get_tokens(self) -> OAuthToken | None
Load tokens from file storage.
​
set_tokens 

Copy
set_tokens(self, tokens: OAuthToken) -> None
Save tokens to file storage.
​
get_client_info 

Copy
get_client_info(self) -> OAuthClientInformationFull | None
Load client information from file storage.
​
set_client_info 

Copy
set_client_info(self, client_info: OAuthClientInformationFull) -> None
Save client information to file storage.
​
clear 

Copy
clear(self) -> None
Clear all cached data for this server.
​
clear_all 

Copy
clear_all(cls, cache_dir: Path | None = None) -> None
Clear all cached data for all servers.
​
OAuth 
OAuth client provider for MCP servers with browser-based authentication.
This class provides OAuth authentication for FastMCP clients by opening a browser for user authorization and running a local callback server.
Methods:
​
redirect_handler 

Copy
redirect_handler(self, authorization_url: str) -> None
Open browser for authorization.
​
callback_handler 

Copy
callback_handler(self) -> tuple[str, str | None]
Handle OAuth callback and return (auth_code, state).