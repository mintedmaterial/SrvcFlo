# Workflow State

All workflows come with a `session_state` dictionary that you can use to cache intermediate results. The `session_state` is tied to a `session_id` and can be persisted to a database.

Provide your workflows with `storage` to enable persistence of session state in a database.

For example, you can use the `SqliteWorkflowStorage` to cache results in a Sqlite database.

```python
# Create the workflow
generate_blog_post = BlogPostGenerator(
    # Fix the session_id for this demo
    session_id="my-session-id",
    storage=SqliteWorkflowStorage(
        table_name="generate_blog_post_workflows",
        db_file="tmp/workflows.db",
    ),
)
```

Then in the `run()` method, you can read from and add to the `session_state` as needed.

```python

class BlogPostGenerator(Workflow):
    # ... agents
    def run(self, topic: str, use_cache: bool = True) -> Iterator[RunResponse]:
        # Read from the session state cache
        if use_cache and "blog_posts" in self.session_state:
            logger.info("Checking if cached blog post exists")
            for cached_blog_post in self.session_state["blog_posts"]:
                if cached_blog_post["topic"] == topic:
                    logger.info("Found cached blog post")
                    yield RunResponse(
                        run_id=self.run_id,
                        event=RunEvent.workflow_completed,
                        content=cached_blog_post["blog_post"],
                    )
                    return

        # ... generate the blog post

        # Save to session state for future runs
        if "blog_posts" not in self.session_state:
            self.session_state["blog_posts"] = []
        self.session_state["blog_posts"].append({"topic": topic, "blog_post": self.writer.run_response.content})
```

When the workflow starts, the `session_state` for that particular `session_id` is read from the database and when the workflow ends, the `session_state` is stored in the database.

<Tip>
  You can always call `self.write_to_storage()` to save the `session_state` to the database at any time. In case you need to abort the workflow but want to store the intermediate results.
</Tip>

View the [Blog Post Generator](/workflows/introduction#full-example-blog-post-generator) for an example of how to use session state for caching.


Advanced

# Advanced

**Workflows are all about control and flexibility.**

Your workflow logic is just a python function, so you have full control over the workflow logic. You can:

* Validate input before processing
* Depending on the input, spawn agents and run them in parallel
* Cache results as needed
* Correct any intermediate errors
* Stream the output
* Return a single or multiple outputs

**This level of control is critical for reliability.**

## Streaming

It is important to understand that when you build a workflow, you are writing a python function, meaning you decide if the function streams the output or not. To stream the output, yield an `Iterator[RunResponse]` from the `run()` method of your workflow.

```python news_report_generator.py
# Define the workflow
class GenerateNewsReport(Workflow):
    agent_1: Agent = ...

    agent_2: Agent = ...

    agent_3: Agent = ...

    def run(self, ...) -> Iterator[RunResponse]:
        # Run agents and gather the response
        # These can be batch responses, you can also stream intermediate results if you want
        final_agent_input = ...

        # Generate the final response from the writer agent
        agent_3_response_stream: Iterator[RunResponse] = self.agent_3.run(final_agent_input, stream=True)

        # Yield the response
        yield agent_3_response_stream

# Instantiate the workflow
generate_news_report = GenerateNewsReport()

# Run workflow and get the response as an iterator of RunResponse objects
report_stream: Iterator[RunResponse] = generate_news_report.run(...)

# Print the response
pprint_run_response(report_stream, markdown=True)
```

## Batch

Simply return a `RunResponse` object from the `run()` method of your workflow to return a single output.

```python news_report_generator.py
# Define the workflow
class GenerateNewsReport(Workflow):
    agent_1: Agent = ...

    agent_2: Agent = ...

    agent_3: Agent = ...

    def run(self, ...) -> RunResponse:
        # Run agents and gather the response
        final_agent_input = ...

        # Generate the final response from the writer agent
        agent_3_response: RunResponse = self.agent_3.run(final_agent_input)

        # Return the response
        return agent_3_response

# Instantiate the workflow
generate_news_report = GenerateNewsReport()

# Run workflow and get the response as a RunResponse object
report: RunResponse = generate_news_report.run(...)

# Print the response
pprint_run_response(report, markdown=True)
```
