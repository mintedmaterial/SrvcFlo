settings
​
fastmcp.settings
​
Classes
​
ExtendedEnvSettingsSource 
A special EnvSettingsSource that allows for multiple env var prefixes to be used.
Raises a deprecation warning if the old FASTMCP_SERVER_ prefix is used.
Methods:
​
get_field_value 

Copy
get_field_value(self, field: FieldInfo, field_name: str) -> tuple[Any, str, bool]
​
ExtendedSettingsConfigDict 
​
ExperimentalSettings 
​
Settings 
FastMCP settings.
Methods:
​
get_setting 

Copy
get_setting(self, attr: str) -> Any
Get a setting. If the setting contains one or more __, it will be treated as a nested setting.
​
set_setting 

Copy
set_setting(self, attr: str, value: Any) -> None
Set a setting. If the setting contains one or more __, it will be treated as a nested setting.
​
settings_customise_sources 

Copy
settings_customise_sources(cls, settings_cls: type[BaseSettings], init_settings: PydanticBaseSettingsSource, env_settings: PydanticBaseSettingsSource, dotenv_settings: PydanticBaseSettingsSource, file_secret_settings: PydanticBaseSettingsSource) -> tuple[PydanticBaseSettingsSource, ...]
​
settings 

Copy
settings(self) -> Self
This property is for backwards compatibility with FastMCP < 2.8.0, which accessed fastmcp.settings.settings
​
normalize_log_level 

Copy
normalize_log_level(cls, v)