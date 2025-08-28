# Facebook MCP Server Integration

This document provides comprehensive documentation for the Facebook Model Context Protocol (MCP) server integration in the myserviceprovider-app.

## Overview

The Facebook MCP server provides a standardized interface for AI agents to interact with Facebook's Graph API. It enables agents to perform various operations on Facebook pages, including:

- Retrieving page information
- Posting content (text, images, videos)
- Reading and responding to comments
- Managing page insights and analytics
- Scheduling posts

The integration follows the Model Context Protocol, allowing AI agents to seamlessly use Facebook functionality through a consistent interface.

## Architecture

The Facebook MCP integration consists of several components:

1. **Frontend Components**:
   - Facebook login button for authentication
   - Token storage mechanism
   - UI components for displaying Facebook data

2. **Backend Components**:
   - Facebook MCP server (Python-based)
   - Facebook API wrapper
   - Token management system
   - Facebook agent class

3. **Integration Flow**:
   ```
   User → Facebook Login → Token Storage → MCP Server → Facebook Graph API
   ```

## Setup and Configuration

### Prerequisites

- Facebook Developer Account
- Registered Facebook App with appropriate permissions
- Python 3.8+ environment
- Node.js environment for the frontend

### Environment Variables

The Facebook MCP server can be configured using environment variables:

```
FACEBOOK_ACCESS_TOKEN - Facebook access token for authentication
FACEBOOK_PAGE_ID - ID of the Facebook page to manage (optional, defaults to "me")
```

These can be set in your .env file or directly in your environment.

### Token Storage

Tokens can be provided in two ways:

1. **Environment Variables**: Set the `FACEBOOK_ACCESS_TOKEN` and optionally `FACEBOOK_PAGE_ID` in your environment.
2. **Frontend Login**: Users can log in through the Facebook login button, which will store the token for the MCP server to use.

The system prioritizes environment variables over frontend-provided tokens.

## Available Tools

The Facebook MCP server provides the following tools:

### Page Management

- `get_page_info`: Retrieve basic information about a Facebook page
- `get_page_posts`: Get recent posts from a page
- `create_post`: Create a new post on a page
- `schedule_post`: Schedule a post for future publication

### Content Management

- `upload_photo`: Upload a photo to a Facebook page
- `upload_video`: Upload a video to a Facebook page
- `create_album`: Create a new photo album

### Engagement

- `get_comments`: Retrieve comments on a post
- `reply_to_comment`: Reply to a specific comment
- `like_comment`: Like a comment

### Analytics

- `get_page_insights`: Retrieve analytics data for a page
- `get_post_insights`: Get performance metrics for a specific post

## Usage Examples

### Basic Usage in Python

```python
from Agents.facebook_agent import FacebookAgent

async def example_usage():
    # Initialize the Facebook agent
    async with FacebookAgent() as agent:
        # Get page information
        page_info = await agent.get_page_info()
        print(f"Page name: {page_info['name']}")
        
        # Create a post
        post_result = await agent.create_post(
            message="Hello from the Facebook MCP integration!"
        )
        print(f"Post ID: {post_result['id']}")
```

### Integration with AI Agents

```python
from Agents.playground import get_agent

async def agent_example():
    # Get an agent with Facebook capabilities
    agent = get_agent(tools=["facebook"])
    
    # Use the agent to interact with Facebook
    response = await agent.run("Post a summary of today's weather to our Facebook page")
    print(response)
```

## Token Management

### Token Lifecycle

1. **Acquisition**: Tokens are obtained either through environment variables or frontend login
2. **Storage**: Tokens from frontend login are stored in a JSON file
3. **Validation**: Tokens are validated before use
4. **Refresh**: Long-lived tokens are used to minimize the need for re-authentication

### Token Validation

The system validates tokens before use to ensure they are still valid. If a token is invalid or expired, the system will:

1. Log the error
2. Return a clear error message
3. Prompt for re-authentication if needed

## Error Handling

The Facebook MCP server includes robust error handling:

- **Authentication Errors**: Clear messages when tokens are invalid or expired
- **Permission Errors**: Detailed information about missing permissions
- **Rate Limiting**: Automatic handling of Facebook API rate limits
- **Network Issues**: Retry logic for transient network problems

## Troubleshooting

### Common Issues

1. **Invalid Token**:
   - Check that your Facebook access token is valid and not expired
   - Verify that the token has the necessary permissions
   - Try re-authenticating through the Facebook login button

2. **Missing Page ID**:
   - If you're seeing "me" instead of your page, check the FACEBOOK_PAGE_ID environment variable
   - Ensure you have admin access to the page you're trying to manage

3. **Permission Errors**:
   - Review your Facebook app's permissions
   - Make sure your app has been approved for the necessary permissions

### Debugging

For debugging issues with the Facebook MCP server:

1. Run the test script:
   ```
   python Agents/facebook_mcp/test_facebook_mcp.py
   ```

2. Check the logs for detailed error messages

3. Verify token validity using the Facebook Graph API Explorer

## Security Considerations

- **Token Storage**: Access tokens are sensitive and should be protected
- **Environment Variables**: Prefer using environment variables for production deployments
- **Permissions**: Request only the permissions your application needs
- **User Consent**: Ensure users understand what permissions they're granting

## Future Improvements

- Implement token refresh mechanism
- Add support for more Facebook Graph API endpoints
- Improve error reporting and recovery
- Add support for multiple Facebook pages

## References

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [Model Context Protocol Specification](https://github.com/microsoft/mcp)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)