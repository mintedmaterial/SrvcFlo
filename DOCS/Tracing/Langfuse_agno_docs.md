# Langfuse

> Integrate Agno with Langfuse to send traces and gain insights into your agent's performance.

## Integrating Agno with Langfuse

Langfuse provides a robust platform for tracing and monitoring AI model calls. By integrating Agno with Langfuse, you can utilize OpenInference and OpenLIT to send traces and gain insights into your agent's performance.

## Prerequisites

1. **Install Dependencies**

   Ensure you have the necessary packages installed:

   ```bash
   pip install agno openai langfuse opentelemetry-sdk opentelemetry-exporter-otlp openinference-instrumentation-agno
   ```

2. **Setup Langfuse Account**

   * Either self-host or sign up for an account at [Langfuse](https://us.cloud.langfuse.com).
   * Obtain your public and secret API keys from the Langfuse dashboard.

3. **Set Environment Variables**

   Configure your environment with the Langfuse API keys:

   ```bash
   export LANGFUSE_PUBLIC_KEY=<your-public-key>
   export LANGFUSE_SECRET_KEY=<your-secret-key>
   ```

## Sending Traces to Langfuse

* ### Example: Using Langfuse with OpenInference

This example demonstrates how to instrument your Agno agent with OpenInference and send traces to Langfuse.

```python
import base64
import os

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.yfinance import YFinanceTools
from openinference.instrumentation.agno import AgnoInstrumentor
from opentelemetry import trace as trace_api
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor

# Set environment variables for Langfuse
LANGFUSE_AUTH = base64.b64encode(
    f"{os.getenv('LANGFUSE_PUBLIC_KEY')}:{os.getenv('LANGFUSE_SECRET_KEY')}".encode()
).decode()
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "https://us.cloud.langfuse.com/api/public/otel"
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {LANGFUSE_AUTH}"

# Configure the tracer provider
tracer_provider = TracerProvider()
tracer_provider.add_span_processor(SimpleSpanProcessor(OTLPSpanExporter()))
trace_api.set_tracer_provider(tracer_provider=tracer_provider)

# Start instrumenting agno
AgnoInstrumentor().instrument()

# Create and configure the agent
agent = Agent(
    name="Stock Price Agent",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[YFinanceTools()],
    instructions="You are a stock price agent. Answer questions in the style of a stock analyst.",
    debug_mode=True,
)

# Use the agent
agent.print_response("What is the current price of Tesla?")
```

* ### Example: Using Langfuse with OpenLIT

This example demonstrates how to use Langfuse via OpenLIT to trace model calls.

```python
import base64
import os

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry import trace

# Set environment variables for Langfuse
LANGFUSE_AUTH = base64.b64encode(
    f"{os.getenv('LANGFUSE_PUBLIC_KEY')}:{os.getenv('LANGFUSE_SECRET_KEY')}".encode()
).decode()
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "https://us.cloud.langfuse.com/api/public/otel"
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {LANGFUSE_AUTH}"

# Configure the tracer provider
trace_provider = TracerProvider()
trace_provider.add_span_processor(SimpleSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(trace_provider)

# Initialize OpenLIT instrumentation
import openlit
openlit.init(tracer=trace.get_tracer(__name__), disable_batch=True)

# Create and configure the agent
agent = Agent(
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[DuckDuckGoTools()],
    markdown=True,
    debug_mode=True,
)

# Use the agent
agent.print_response("What is currently trending on Twitter?")
```

## Notes

* **Environment Variables**: Ensure your environment variables are correctly set for the API keys and OTLP endpoint.
* **Data Regions**: Adjust the `OTEL_EXPORTER_OTLP_ENDPOINT` for your data region or local deployment as needed. Available regions include:
  * `https://us.cloud.langfuse.com/api/public/otel` for the US region
  * `https://eu.cloud.langfuse.com/api/public/otel` for the EU region
  * `http://localhost:3000/api/public/otel` for local deployment

By following these steps, you can effectively integrate Agno with Langfuse, enabling comprehensive observability and monitoring of your AI agents.
