logging
​
fastmcp.client.logging
​
Functions
​
default_log_handler 

Copy
default_log_handler(message: LogMessage) -> None
Default handler that properly routes server log messages to appropriate log levels.
​
create_log_callback 

Copy
create_log_callback(handler: LogHandler | None = None) -> LoggingFnT