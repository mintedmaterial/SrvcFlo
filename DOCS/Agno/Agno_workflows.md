# What are Workflows?

Workflows are deterministic, stateful, multi-agent programs that are built for production applications. They're battle-tested, incredibly powerful and offer the following benefits:

* **Pure python**: Build your workflow logic using standard python. Having built 100s of agentic systems, **no framework or step based approach will give you the flexibility and reliability of pure-python**. Want loops - use while/for, want conditionals - use if/else, want exceptional handling - use try/except.
* **Full control and flexibility**: Because your workflow logic is a python function, you have full control over the process, like validating input before processing, spawning agents and running them in parallel, caching results as needed and correcting any intermediate errors. **This level of control is critical for reliability.**
* **Built-in storage and caching**: Workflows come with built-in storage and state management. Use session\_state to cache intermediate results. A big advantage of this approach is that you can trigger workflows in a separate process and ping for results later, meaning you don't run into request timeout issues which are very common with long running workflows.

<Check>
  Because the workflow logic is a python function, AI code editors can write workflows for you. Just add `https://docs.agno.com` as a document source.
</Check>

### The best part

There's nothing new to learn! You already know python, you already know how to build Agents and Teams -- now its just about putting them together using regular python code. No need to learn a new DSL or syntax.

Here's a simple workflow that caches the outputs. You see the level of control you have over the process, even the "storing state" happens after the response is yielded.

```python simple_cache_workflow.py
from typing import Iterator

from agno.agent import Agent, RunResponse
from agno.models.openai import OpenAIChat
from agno.utils.log import logger
from agno.utils.pprint import pprint_run_response
from agno.workflow import Workflow


class CacheWorkflow(Workflow):
    # Purely descriptive, not used by the workflow
    description: str = "A workflow that caches previous outputs"

    # Add agents or teams as attributes on the workflow
    agent = Agent(model=OpenAIChat(id="gpt-4o-mini"))

    # Write the logic in the `run()` method
    def run(self, message: str) -> Iterator[RunResponse]:
        logger.info(f"Checking cache for '{message}'")
        # Check if the output is already cached
        if self.session_state.get(message):
            logger.info(f"Cache hit for '{message}'")
            yield RunResponse(run_id=self.run_id, content=self.session_state.get(message))
            return

        logger.info(f"Cache miss for '{message}'")
        # Run the agent and yield the response
        yield from self.agent.run(message, stream=True)

        # Cache the output after response is yielded
        self.session_state[message] = self.agent.run_response.content


if __name__ == "__main__":
    workflow = CacheWorkflow()
    # Run workflow (this is takes ~1s)
    response: Iterator[RunResponse] = workflow.run(message="Tell me a joke.")
    # Print the response
    pprint_run_response(response, markdown=True, show_time=True)
    # Run workflow again (this is immediate because of caching)
    response: Iterator[RunResponse] = workflow.run(message="Tell me a joke.")
    # Print the response
    pprint_run_response(response, markdown=True, show_time=True)
```

### How to build a workflow

1. Define your workflow as a class by inheriting the `Workflow` class.
2. Add agents or teams as attributes on the workflow. These isn't a strict requirement, just helps us map the session\_id of the agent to the session\_id of the workflow.
3. Implement the workflow logic in the `run()` method. This is the main function that will be called when you run the workflow (**the workflow entrypoint**). This function gives us so much control over the process, some agents can stream, other's can generate structured outputs, agents can be run in parallel using `async.gather()`, some agents can have validation logic that runs before returning the response.

<Note>
  You can also execute workflows asynchronously using the `arun` method. This allows for more efficient and non-blocking operations when calling agents. For a detailed example, please refer to the [Async Workflows Example](examples/workflows/async-hackernews-reporter).
</Note>

## Full Example: Blog Post Generator

Let's create a blog post generator that can search the web, read the top links and write a blog post for us. We'll cache intermediate results in the database to improve performance.

### Create the Workflow

1. Define your workflow as a class by inheriting from the `Workflow` class.

```python blog_post_generator.py
from agno.workflow import Workflow

class BlogPostGenerator(Workflow):
    pass
```

2. Add one or more agents to the workflow and implement the workflow logic in the `run()` method.

```python blog_post_generator.py
import json
from textwrap import dedent
from typing import Dict, Iterator, Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.storage.sqlite import SqliteStorage
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.newspaper4k import Newspaper4kTools
from agno.utils.log import logger
from agno.utils.pprint import pprint_run_response
from agno.workflow import RunEvent, RunResponse, Workflow
from pydantic import BaseModel, Field


class NewsArticle(BaseModel):
    title: str = Field(..., description="Title of the article.")
    url: str = Field(..., description="Link to the article.")
    summary: Optional[str] = Field(
        ..., description="Summary of the article if available."
    )


class SearchResults(BaseModel):
    articles: list[NewsArticle]


class ScrapedArticle(BaseModel):
    title: str = Field(..., description="Title of the article.")
    url: str = Field(..., description="Link to the article.")
    summary: Optional[str] = Field(
        ..., description="Summary of the article if available."
    )
    content: Optional[str] = Field(
        ...,
        description="Full article content in markdown format. None if content is unavailable.",
    )


class BlogPostGenerator(Workflow):
    """Advanced workflow for generating professional blog posts with proper research and citations."""

    description: str = dedent("""\
    An intelligent blog post generator that creates engaging, well-researched content.
    This workflow orchestrates multiple AI agents to research, analyze, and craft
    compelling blog posts that combine journalistic rigor with engaging storytelling.
    The system excels at creating content that is both informative and optimized for
    digital consumption.
    """)

    # Search Agent: Handles intelligent web searching and source gathering
    searcher: Agent = Agent(
        model=OpenAIChat(id="gpt-4o-mini"),
        tools=[DuckDuckGoTools()],
        description=dedent("""\
        You are BlogResearch-X, an elite research assistant specializing in discovering
        high-quality sources for compelling blog content. Your expertise includes:

        - Finding authoritative and trending sources
        - Evaluating content credibility and relevance
        - Identifying diverse perspectives and expert opinions
        - Discovering unique angles and insights
        - Ensuring comprehensive topic coverage\
        """),
        instructions=dedent("""\
        1. Search Strategy 🔍
           - Find 10-15 relevant sources and select the 5-7 best ones
           - Prioritize recent, authoritative content
           - Look for unique angles and expert insights
        2. Source Evaluation 📊
           - Verify source credibility and expertise
           - Check publication dates for timeliness
           - Assess content depth and uniqueness
        3. Diversity of Perspectives 🌐
           - Include different viewpoints
           - Gather both mainstream and expert opinions
           - Find supporting data and statistics\
        """),
        response_model=SearchResults,
    )

    # Content Scraper: Extracts and processes article content
    article_scraper: Agent = Agent(
        model=OpenAIChat(id="gpt-4o-mini"),
        tools=[Newspaper4kTools()],
        description=dedent("""\
        You are ContentBot-X, a specialist in extracting and processing digital content
        for blog creation. Your expertise includes:

        - Efficient content extraction
        - Smart formatting and structuring
        - Key information identification
        - Quote and statistic preservation
        - Maintaining source attribution\
        """),
        instructions=dedent("""\
        1. Content Extraction 📑
           - Extract content from the article
           - Preserve important quotes and statistics
           - Maintain proper attribution
           - Handle paywalls gracefully
        2. Content Processing 🔄
           - Format text in clean markdown
           - Preserve key information
           - Structure content logically
        3. Quality Control ✅
           - Verify content relevance
           - Ensure accurate extraction
           - Maintain readability\
        """),
        response_model=ScrapedArticle,
        structured_outputs=True,
    )

    # Content Writer Agent: Crafts engaging blog posts from research
    writer: Agent = Agent(
        model=OpenAIChat(id="gpt-4o"),
        description=dedent("""\
        You are BlogMaster-X, an elite content creator combining journalistic excellence
        with digital marketing expertise. Your strengths include:

        - Crafting viral-worthy headlines
        - Writing engaging introductions
        - Structuring content for digital consumption
        - Incorporating research seamlessly
        - Optimizing for SEO while maintaining quality
        - Creating shareable conclusions\
        """),
        instructions=dedent("""\
        1. Content Strategy 📝
           - Craft attention-grabbing headlines
           - Write compelling introductions
           - Structure content for engagement
           - Include relevant subheadings
        2. Writing Excellence ✍️
           - Balance expertise with accessibility
           - Use clear, engaging language
           - Include relevant examples
           - Incorporate statistics naturally
        3. Source Integration 🔍
           - Cite sources properly
           - Include expert quotes
           - Maintain factual accuracy
        4. Digital Optimization 💻
           - Structure for scanability
           - Include shareable takeaways
           - Optimize for SEO
           - Add engaging subheadings\
        """),
        expected_output=dedent("""\
        # {Viral-Worthy Headline}

        ## Introduction
        {Engaging hook and context}

        ## {Compelling Section 1}
        {Key insights and analysis}
        {Expert quotes and statistics}

        ## {Engaging Section 2}
        {Deeper exploration}
        {Real-world examples}

        ## {Practical Section 3}
        {Actionable insights}
        {Expert recommendations}

        ## Key Takeaways
        - {Shareable insight 1}
        - {Practical takeaway 2}
        - {Notable finding 3}

        ## Sources
        {Properly attributed sources with links}\
        """),
        markdown=True,
    )

    def run(
        self,
        topic: str,
        use_search_cache: bool = True,
        use_scrape_cache: bool = True,
        use_cached_report: bool = True,
    ) -> Iterator[RunResponse]:
        logger.info(f"Generating a blog post on: {topic}")

        # Use the cached blog post if use_cache is True
        if use_cached_report:
            cached_blog_post = self.get_cached_blog_post(topic)
            if cached_blog_post:
                yield RunResponse(
                    content=cached_blog_post, event=RunEvent.workflow_completed
                )
                return

        # Search the web for articles on the topic
        search_results: Optional[SearchResults] = self.get_search_results(
            topic, use_search_cache
        )
        # If no search_results are found for the topic, end the workflow
        if search_results is None or len(search_results.articles) == 0:
            yield RunResponse(
                event=RunEvent.workflow_completed,
                content=f"Sorry, could not find any articles on the topic: {topic}",
            )
            return

        # Scrape the search results
        scraped_articles: Dict[str, ScrapedArticle] = self.scrape_articles(
            topic, search_results, use_scrape_cache
        )

        # Prepare the input for the writer
        writer_input = {
            "topic": topic,
            "articles": [v.model_dump() for v in scraped_articles.values()],
        }

        # Run the writer and yield the response
        yield from self.writer.run(json.dumps(writer_input, indent=4), stream=True)

        # Save the blog post in the cache
        self.add_blog_post_to_cache(topic, self.writer.run_response.content)

    def get_cached_blog_post(self, topic: str) -> Optional[str]:
        logger.info("Checking if cached blog post exists")

        return self.session_state.get("blog_posts", {}).get(topic)

    def add_blog_post_to_cache(self, topic: str, blog_post: str):
        logger.info(f"Saving blog post for topic: {topic}")
        self.session_state.setdefault("blog_posts", {})
        self.session_state["blog_posts"][topic] = blog_post

    def get_cached_search_results(self, topic: str) -> Optional[SearchResults]:
        logger.info("Checking if cached search results exist")
        search_results = self.session_state.get("search_results", {}).get(topic)
        return (
            SearchResults.model_validate(search_results)
            if search_results and isinstance(search_results, dict)
            else search_results
        )

    def add_search_results_to_cache(self, topic: str, search_results: SearchResults):
        logger.info(f"Saving search results for topic: {topic}")
        self.session_state.setdefault("search_results", {})
        self.session_state["search_results"][topic] = search_results

    def get_cached_scraped_articles(
        self, topic: str
    ) -> Optional[Dict[str, ScrapedArticle]]:
        logger.info("Checking if cached scraped articles exist")
        scraped_articles = self.session_state.get("scraped_articles", {}).get(topic)
        return (
            ScrapedArticle.model_validate(scraped_articles)
            if scraped_articles and isinstance(scraped_articles, dict)
            else scraped_articles
        )

    def add_scraped_articles_to_cache(
        self, topic: str, scraped_articles: Dict[str, ScrapedArticle]
    ):
        logger.info(f"Saving scraped articles for topic: {topic}")
        self.session_state.setdefault("scraped_articles", {})
        self.session_state["scraped_articles"][topic] = scraped_articles

    def get_search_results(
        self, topic: str, use_search_cache: bool, num_attempts: int = 3
    ) -> Optional[SearchResults]:
        # Get cached search_results from the session state if use_search_cache is True
        if use_search_cache:
            try:
                search_results_from_cache = self.get_cached_search_results(topic)
                if search_results_from_cache is not None:
                    search_results = SearchResults.model_validate(
                        search_results_from_cache
                    )
                    logger.info(
                        f"Found {len(search_results.articles)} articles in cache."
                    )
                    return search_results
            except Exception as e:
                logger.warning(f"Could not read search results from cache: {e}")

        # If there are no cached search_results, use the searcher to find the latest articles
        for attempt in range(num_attempts):
            try:
                searcher_response: RunResponse = self.searcher.run(topic)
                if (
                    searcher_response is not None
                    and searcher_response.content is not None
                    and isinstance(searcher_response.content, SearchResults)
                ):
                    article_count = len(searcher_response.content.articles)
                    logger.info(
                        f"Found {article_count} articles on attempt {attempt + 1}"
                    )
                    # Cache the search results
                    self.add_search_results_to_cache(topic, searcher_response.content)
                    return searcher_response.content
                else:
                    logger.warning(
                        f"Attempt {attempt + 1}/{num_attempts} failed: Invalid response type"
                    )
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1}/{num_attempts} failed: {str(e)}")

        logger.error(f"Failed to get search results after {num_attempts} attempts")
        return None

    def scrape_articles(
        self, topic: str, search_results: SearchResults, use_scrape_cache: bool
    ) -> Dict[str, ScrapedArticle]:
        scraped_articles: Dict[str, ScrapedArticle] = {}

        # Get cached scraped_articles from the session state if use_scrape_cache is True
        if use_scrape_cache:
            try:
                scraped_articles_from_cache = self.get_cached_scraped_articles(topic)
                if scraped_articles_from_cache is not None:
                    scraped_articles = scraped_articles_from_cache
                    logger.info(
                        f"Found {len(scraped_articles)} scraped articles in cache."
                    )
                    return scraped_articles
            except Exception as e:
                logger.warning(f"Could not read scraped articles from cache: {e}")

        # Scrape the articles that are not in the cache
        for article in search_results.articles:
            if article.url in scraped_articles:
                logger.info(f"Found scraped article in cache: {article.url}")
                continue

            article_scraper_response: RunResponse = self.article_scraper.run(
                article.url
            )
            if (
                article_scraper_response is not None
                and article_scraper_response.content is not None
                and isinstance(article_scraper_response.content, ScrapedArticle)
            ):
                scraped_articles[article_scraper_response.content.url] = (
                    article_scraper_response.content
                )
                logger.info(f"Scraped article: {article_scraper_response.content.url}")

        # Save the scraped articles in the session state
        self.add_scraped_articles_to_cache(topic, scraped_articles)
        return scraped_articles


# Run the workflow if the script is executed directly
if __name__ == "__main__":
    import random

    from rich.prompt import Prompt

    # Fun example prompts to showcase the generator's versatility
    example_prompts = [
        "Why Cats Secretly Run the Internet",
        "The Science Behind Why Pizza Tastes Better at 2 AM",
        "Time Travelers' Guide to Modern Social Media",
        "How Rubber Ducks Revolutionized Software Development",
        "The Secret Society of Office Plants: A Survival Guide",
        "Why Dogs Think We're Bad at Smelling Things",
        "The Underground Economy of Coffee Shop WiFi Passwords",
        "A Historical Analysis of Dad Jokes Through the Ages",
    ]

    # Get topic from user
    topic = Prompt.ask(
        "[bold]Enter a blog post topic[/bold] (or press Enter for a random example)\n✨",
        default=random.choice(example_prompts),
    )

    # Convert the topic to a URL-safe string for use in session_id
    url_safe_topic = topic.lower().replace(" ", "-")

    # Initialize the blog post generator workflow
    # - Creates a unique session ID based on the topic
    # - Sets up SQLite storage for caching results
    generate_blog_post = BlogPostGenerator(
        session_id=f"generate-blog-post-on-{url_safe_topic}",
        storage=SqliteStorage(
            table_name="generate_blog_post_workflows",
            db_file="tmp/agno_workflows.db",
        ),
        debug_mode=True,
    )

    # Execute the workflow with caching enabled
    # Returns an iterator of RunResponse objects containing the generated content
    blog_post: Iterator[RunResponse] = generate_blog_post.run(
        topic=topic,
        use_search_cache=True,
        use_scrape_cache=True,
        use_cached_report=True,
    )

    # Print the response
    pprint_run_response(blog_post, markdown=True)
```

### Run the workflow

Install libraries

```shell
pip install agno openai duckduckgo-search sqlalchemy
```

Run the workflow

```shell
python blog_post_generator.py
```

Now the results are cached in the database and can be re-used for future runs. Run the workflow again to view the cached results.

```shell
python blog_post_generator.py
```

<img height="200" src="https://mintlify.s3.us-west-1.amazonaws.com/agno/images/BlogPostGenerator.gif" style={{ borderRadius: '8px' }} />

Checkout more [usecases](/examples/workflows/) and [examples](/examples/concepts/storage/workflow_storage) related to workflows.

## Design decisions

<Tip>
  **Why do we recommend writing your workflow logic as a python function instead of creating a custom abstraction like a Graph, Chain, or Flow?**

  In our experience building AI products, the workflow logic needs to be dynamic (i.e. determined at runtime) and requires fine-grained control over parallelization, caching, state management, error handling, and issue resolution.

  A custom abstraction (Graph, Chain, Flow) with a new DSL would mean learning new concepts and write more code. We would end up spending more time learning and fighting the DSL.

  Every project we worked on, a simple python function always seems to do the trick. We also found that complex workflows can span multiple files, sometimes turning into modules in themselves. You know what works great here? Python.

  We keep coming back to the [Unix Philosophy](https://en.wikipedia.org/wiki/Unix_philosophy).

  If our workflow can't be written in vanilla python, then we should simplify and re-organize our workflow, not the other way around.

  Another significant challenge with long-running workflows is managing request/response timeouts. We need workflows to trigger asynchronously, respond to the client confirming initiation, and then allow the client to poll for results later. Achieving this UX requires running workflows in background tasks and closely managing state so the latest updates are available to the client.

  For these reasons, we recommend building workflows as vanilla python functions, the level of control, flexibility and reliability is unmatched.
</Tip>
