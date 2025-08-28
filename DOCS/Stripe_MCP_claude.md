# Model Context Protocol (MCP)

Let your AI agents interact with the Stripe API by using our MCP server.

The Stripe Model Context Protocol (MCP) server defines a set of tools that AI agents can use to interact with the Stripe API and search our knowledge base (including documentation and support articles).

If you use AI-powered code editors like Cursor or Windsurf, or general-purpose tools like Claude Desktop, you can use the MCP server.

## Remote server 

Stripe hosts a Streamable HTTP MCP server that’s available at `https://mcp.stripe.com`. The Stripe MCP server uses OAuth Dynamic Client Registration to connect MCP clients as per the [MCP spec](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization#2-1-1-oauth-grant-types.md).

#### Cursor

[Install in Cursor](https://cursor.com/install-mcp?name=stripe&config=eyJ1cmwiOiJodHRwczovL21jcC5zdHJpcGUuY29tIn0%3D.md)

To open Cursor and automatically add the Stripe MCP, click install. Alternatively, add the following to your `~/.cursor/mcp.json` file. To learn more, see the Cursor [documentation](https://docs.cursor.com/context/model-context-protocol.md).

```json
{
  "mcpServers": {"stripe": {
      "url": "https://mcp.stripe.com"
    }
  }
}
```

#### VS Code

[Install in VS Code](https://vscode.dev/redirect/mcp/install?name=stripe&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.stripe.com%22%7D.md)

To open VS Code and automatically add the Stripe MCP, click install. Alternatively, add the following to your `.vscode/mcp.json` file in your workspace. To learn more, see the VS Code [documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers.md).

```json
{
  "servers": {"stripe": {
      "type": "http",
      "url": "https://mcp.stripe.com"
    }
  }
}
```

#### Claude Code

To add MCP to Claude code, run the following command. To learn more, see the Claude Code [documentation](https://docs.anthropic.com/en/docs/claude-code/mcp#configure-mcp-servers.md).

```bash
claude mcp add --transport http http-server https://mcp.stripe.com/
```

### OAuth connections 

When you add the Stripe MCP to a client, the MCP client opens an OAuth consent form which allows you to authorize the client to access your Stripe data. OAuth is done through a *Stripe App* (An app that you can build on top of Stripe to customize the functionality of the Stripe Dashboard UI, leverage Stripe user data, store data on Stripe, and more). Only admins can install the Stripe MCP. After installing, you can manage your OAuth connections in your Dashboard settings.

**To view authorized MCP clients:**

1. Navigate to the [Stripe MCP app](https://dashboard.stripe.com/settings/apps/com.stripe.mcp.md) in the Stripe Dashboard.

1. In the right panel, click **Clients** to view OAuth-connected MCP clients.

**To revoke OAuth access for a specific MCP client:**

1. Find the client in the list, and click the overflow menu.

1. Select **Revoke**.

### Allowlist of client redirect URIs 

Stripe maintains an allowlist of vetted MCP client redirect URIs to protect our users from malicious phishing attacks. If there’s an MCP client application that you want to allowlist, email us at [mcp@stripe.com](mailto:mcp@stripe.com.md).

### Bearer token

If you’re building agentic software, you can pass a Stripe API key as a bearer token to the MCP remote server. We strongly recommend using [restricted API keys](https://docs.stripe.com/keys#create-restricted-api-secret-key.md) to limit access to the functionality your agent requires. For example, you can use this authorization method with [OpenAI’s Responses API](https://platform.openai.com/docs/guides/tools-remote-mcp#authentication.md).

```bash
curl https://mcp.stripe.com/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -d '{
      "jsonrpc": "2.0",
      "method": "tools/call",
      "params": {
        "name": "create_customer",
        "arguments": {"name": "Jenny Rosen", "email": "jenny.rosen@example.com" }
      },
      "id": 1
  }'
```

## Local server 

If you prefer or require a local setup, run the [local Stripe MCP server](https://github.com/stripe/agent-toolkit/tree/main/modelcontextprotocol.md).

#### Cursor

[Install in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=stripe&config=eyJjb21tYW5kIjoibnB4IC15IEBzdHJpcGUvbWNwIC0tdG9vbHM9YWxsIiwiZW52Ijp7IlNUUklQRV9TRUNSRVRfS0VZIjoiIn19.md)

To open Cursor and automatically add the Stripe MCP, click install. Alternatively, add the following to your `~/.cursor/mcp.json` file. To learn more, see the Cursor [documentation](https://docs.cursor.com/context/model-context-protocol.md).

```json
{
  "mcpServers": {"stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "<<YOUR_SECRET_KEY>>"
      }
    }
  }
}
```

The code editor agent automatically detects all the available tools, calling the relevant tool when you post a related question in the chat.

#### VS Code

[Install in VS Code](https://vscode.dev/redirect/mcp/install?name=stripe&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22stripe_secret_key%22%2C%22description%22%3A%22Stripe%20secret%20API%20key%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40stripe%2Fmcp%22%2C%22--tools%3Dall%22%5D%2C%22env%22%3A%7B%22STRIPE_SECRET_KEY%22%3A%22%24%7Binput%3Astripe_secret_key%7D%22%7D%7D.md)

To open VS Code and automatically add the Stripe MCP, click install. Alternatively, add the following to your `.vscode/mcp.json` file in your workspace. To learn more, see the VS Code [documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers.md).

```json
{
  "servers": {"stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "<<YOUR_SECRET_KEY>>"
      }
    }
  }
}
```

#### Windsurf

Add the following to your `~/.codeium/windsurf/mcp_config.json` file. To learn more, see the Windsurf [documentation](https://docs.windsurf.com/windsurf/cascade/mcp.md).

```json
{
  "mcpServers": {"stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "<<YOUR_SECRET_KEY>>"
      }
    }
  }
}
```

#### Claude

Add the following to your `claude_desktop_config.json` file. To learn more, see the Claude Desktop [documentation](https://modelcontextprotocol.io/quickstart/user.md).

```json
{
  "mcpServers": {"stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "<<YOUR_SECRET_KEY>>"
      }
    }
  }
}
```

#### CLI

Start the MCP server locally with this command:

```bash
npx -y @stripe/mcp --tools=all --api-key=<<YOUR_SECRET_KEY>>
```

The MCP server uses either the passed in `--api-key` or the `STRIPE_SECRET_KEY` environment variable.

## Tools

The server exposes the following [MCP tools](https://modelcontextprotocol.io/docs/concepts/tools.md). We recommend enabling human confirmation of tools and excercising caution when using the Stripe MCP with other servers to avoid prompt injection attacks. If you have feedback or want to see more tools, email us at [mcp@stripe.com](mailto:mcp@stripe.com.md).

| Resource              | Tool                                                                      | API                                                                        |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Account**           | `get_stripe_account_info`                                                 | [Retrieve account](https://docs.stripe.com/api/account/retrieve.md)        |
| **Balance**           | `retrieve_balance`                                                        | [Retrieve balance](https://docs.stripe.com/api/balance/retrieve.md)        |
| **Coupon**            | `create_coupon`                                                           | [Create coupon](https://docs.stripe.com/api/coupon/create.md)              |
| `list_coupons`        | [List coupons](https://docs.stripe.com/api/coupon/list.md)                |
| **Customer**          | `create_customer`                                                         | [Create customer](https://docs.stripe.com/api/customer/create.md)          |
| `list_customers`      | [List customers](https://docs.stripe.com/api/customer/list.md)            |
| **Dispute**           | `list_disputes`                                                           | [List disputes](https://docs.stripe.com/api/dispute/list.md)               |
| `update_dispute`      | [Update dispute](https://docs.stripe.com/api/dispute/update.md)           |
| **Invoice**           | `create_invoice`                                                          | [Create invoice](https://docs.stripe.com/api/invoice/create.md)            |
| `create_invoice_item` | [Create invoice item](https://docs.stripe.com/api/invoice_item/create.md) |
| `finalize_invoice`    | [Finalize invoice](https://docs.stripe.com/api/invoice/finalize.md)       |
| `list_invoices`       | [List invoices](https://docs.stripe.com/api/invoice/list.md)              |
| **Payment Link**      | `create_payment_link`                                                     | [Create payment link](https://docs.stripe.com/api/payment_link/create.md)  |
| **Payment Intent**    | `list_payment_intents`                                                    | [List payment intents](https://docs.stripe.com/api/payment_intent/list.md) |
| **Price**             | `create_price`                                                            | [Create price](https://docs.stripe.com/api/price/create.md)                |
| `list_prices`         | [List prices](https://docs.stripe.com/api/price/list.md)                  |
| **Product**           | `create_product`                                                          | [Create product](https://docs.stripe.com/api/product/create.md)            |
| `list_products`       | [List products](https://docs.stripe.com/api/product/list.md)              |
| **Refund**            | `create_refund`                                                           | [Create refund](https://docs.stripe.com/api/refund/create.md)              |
| **Subscription**      | `cancel_subscription`                                                     | [Cancel subscription](https://docs.stripe.com/api/subscription/cancel.md)  |
| `list_subscriptions`  | [List subscriptions](https://docs.stripe.com/api/subscription/list.md)    |
| `update_subscription` | [Update subscription](https://docs.stripe.com/api/subscription/update.md) |
| **Documentation**     | `search_documentation`                                                    | Search Stripe knowledge                                                    |

## See also

- [Build on Stripe with LLMs](https://docs.stripe.com/building-with-llms.md)
- [Add Stripe to your agentic workflows](https://docs.stripe.com/agents.md)