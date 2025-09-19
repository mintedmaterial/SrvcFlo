progress
​
fastmcp.client.progress
​
Functions
​
default_progress_handler 

Copy
default_progress_handler(progress: float, total: float | None, message: str | None) -> None
Default handler for progress notifications.
Logs progress updates at debug level, properly handling missing total or message values.
Args:
progress: Current progress value
total: Optional total expected value
message: Optional status message