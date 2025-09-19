shared
​
fastmcp.cli.install.shared
Shared utilities for install commands.
​
Functions
​
parse_env_var 

Copy
parse_env_var(env_var: str) -> tuple[str, str]
Parse environment variable string in format KEY=VALUE.
​
process_common_args 

Copy
process_common_args(server_spec: str, server_name: str | None, with_packages: list[str] | None, env_vars: list[str] | None, env_file: Path | None) -> tuple[Path, str | None, str, list[str], dict[str, str] | None]
Process common arguments shared by all install commands.
Handles both fastmcp.json config files and traditional file.py:object syntax.