# Workflows Development Guide

> Explore the different types of workflows in the Agno workflow system, including sequential, parallel, conditional, and looping workflows.

Agno Workflows provides a powerful, declarative way to orchestrate multi-step AI processes. Unlike traditional linear workflows, you can now create sophisticated branching logic, parallel execution, and dynamic routing based on content analysis.

This guide covers all workflow patterns, from simple linear sequences to complex conditional logic with parallel execution.

## Building Blocks

The core building blocks of Agno Workflows are:

| Component     | Purpose                         |
| ------------- | ------------------------------- |
| **Step**      | Basic execution unit            |
| **Agent**     | AI assistant with specific role |
| **Team**      | Coordinated group of agents     |
| **Function**  | Custom Python logic             |
| **Parallel**  | Concurrent execution            |
| **Condition** | Conditional execution           |
| **Loop**      | Iterative execution             |
| **Router**    | Dynamic routing                 |

## Workflow Patterns

### 1. Basic Sequential Workflows

**When to use**: Linear processes where each step depends on the previous one.

**Example Steps**: Research → Process research data in a function before next step → Content Creation

```python
from agno.workflow.v2 import Step, Workflow

def data_preprocessor(step_input):
    # Custom preprocessing logic

    # Or you can also run any agent/team over here itself
    # response = some_agent.run(...)
    return StepOutput(content=f"Processed: {step_input.message}") # <-- Now pass the agent/team response in content here

workflow = Workflow(
    name="Mixed Execution Pipeline",
    steps=[
        research_team,      # Team
        data_preprocessor,  # Function
        content_agent,      # Agent
    ]
)

workflow.print_response("Analyze the competitive landscape for fintech startups", markdown=True)
```

<Note>
  For more information on how to use custom functions, refer to the [Advanced](/workflows_2/advanced) page.
</Note>

**See Example**:

* [Sequence of Functions and Agents](/examples/workflows_2/01-basic-workflows/sequence_of_functions_and_agents) - Complete workflow with functions and agents

<Note>
  `StepInput` and `StepOutput` provides standardized interfaces for data flow between steps:
  So if you make a custom function as an executor for a step, make sure that the input and output types are compatible with the `StepInput` and `StepOutput` interfaces.
  This will ensure that your custom function can seamlessly integrate into the workflow system.

  Take a look at the schemas for [`StepInput`](/reference/workflows_2/step_input) and [`StepOutput`](/reference/workflows_2/step_output).
</Note>

### 2. Fully Python Workflow

**Keep it Simple with Pure Python**: If you prefer the Workflows 1.0 approach or need maximum flexibility, you can still use a single Python function to handle everything.
This approach gives you complete control over the execution flow while still benefiting from workflow features like storage, streaming, and session management.

Replace all the steps in the workflow with a single executable function where you can control everything.

```python
def custom_workflow_function(workflow: Workflow, execution_input: WorkflowExecutionInput):
    # Custom orchestration logic
    research_result = research_team.run(execution_input.message)
    analysis_result = analysis_agent.run(research_result.content)
    return f"Final: {analysis_result.content}"

workflow = Workflow(
    name="Function-Based Workflow",
    steps=custom_workflow_function  # Single function replaces all steps
)

workflow.print_response("Evaluate the market potential for quantum computing applications", markdown=True)
```

**See Example**:

* [Function-Based Workflow](/examples/workflows_2/01-basic-workflows/function_instead_of_steps) - Complete function-based workflow

For migration from 1.0 style workflows, refer to the page for [Migrating to Workflows 2.0](./migration)

### 3. Step-Based Workflows

**You can name your steps** for better logging and future support on the Agno platform.\
This also changes the name of a step when accessing that step's output inside a `StepInput` object.

#### Parameters

<Snippet file="step-reference.mdx" />

#### Example

```python
from agno.workflow.v2 import Step, Workflow

# Named steps for better tracking
workflow = Workflow(
    name="Content Creation Pipeline",
    steps=[
        Step(name="Research Phase", team=researcher),
        Step(name="Analysis Phase", executor=custom_function), 
        Step(name="Writing Phase", agent=writer),
    ]
)

workflow.print_response(
    "AI trends in 2024",
    markdown=True,
)
```

**See Examples**:

* [Sequence of Steps](/examples/workflows_2/01-basic-workflows/sequence_of_steps)
* [Step with a Custom Function](/examples/workflows_2/01-basic-workflows/step_with_function)

### 4. Conditional Steps

**When to use**: Conditional step execution based on business logic.

**Example Use-Cases**: Topic-specific research strategies, content type routing

![Condition Steps](https://mintlify.s3.us-west-1.amazonaws.com/agno/images/condition_steps.png)

#### Parameters

<Snippet file="condition-step-reference.mdx" />

#### Example

```python
from agno.workflow.v2 import Condition, Step, Workflow

def is_tech_topic(step_input) -> bool:
    topic = step_input.message.lower()
    return any(keyword in topic for keyword in ["ai", "tech", "software"])

workflow = Workflow(
    name="Conditional Research",
    steps=[
        Condition(
            name="Tech Topic Check",
            evaluator=is_tech_topic,
            steps=[Step(name="Tech Research", agent=tech_researcher)]
        ),
        Step(name="General Analysis", agent=general_analyst),
    ]
)

workflow.print_response("Comprehensive analysis of AI and machine learning trends", markdown=True)
```

**More Examples**:

* [Condition Steps Workflow](/examples/workflows_2/02-workflows-conditional-execution/condition_steps_workflow_stream)
* [Condition with List of Steps](/examples/workflows_2/02-workflows-conditional-execution/condition_with_list_of_steps)

### 5. Parallel Execution

**When to use**: Independent tasks that can run simultaneously to save time.

**Example Use-Cases**: Multiple research sources, parallel content creation

![Parallel Steps](https://mintlify.s3.us-west-1.amazonaws.com/agno/images/parallel_steps.png)

#### Parameters

<Snippet file="parallel-step-reference.mdx" />

#### Example

```python
from agno.workflow.v2 import Parallel, Step, Workflow

workflow = Workflow(
    name="Parallel Research Pipeline",
    steps=[
        Parallel(
            Step(name="HackerNews Research", agent=hn_researcher),
            Step(name="Web Research", agent=web_researcher),
            Step(name="Academic Research", agent=academic_researcher),
            name="Research Step"
        ),
        Step(name="Synthesis", agent=synthesizer),  # Combines the results and produces a report
    ]
)

workflow.print_response("Write about the latest AI developments", markdown=True)
```

**More Examples**:

* [Parallel Steps Workflow](/examples/workflows_2/04-workflows-parallel-execution/parallel_steps_workflow)

### 6. Loop/Iteration Workflows

**When to use**: Quality-driven processes, iterative refinement, or retry logic.

**Example Use-Cases**: Research until sufficient quality, iterative improvement

![Loop Steps](https://mintlify.s3.us-west-1.amazonaws.com/agno/images/loop_steps.png)

#### Parameters

<Snippet file="loop-step-reference.mdx" />

#### Example

```python
from agno.workflow.v2 import Loop, Step, Workflow

def quality_check(outputs) -> bool:
    # Return True to break loop, False to continue
    return any(len(output.content) > 500 for output in outputs)

workflow = Workflow(
    name="Quality-Driven Research",
    steps=[
        Loop(
            name="Research Loop",
            steps=[Step(name="Deep Research", agent=researcher)],
            end_condition=quality_check,
            max_iterations=3
        ),
        Step(name="Final Analysis", agent=analyst),
    ]
)

workflow.print_response("Research the impact of renewable energy on global markets", markdown=True)
```

**More Examples**:

* [Loop Steps Workflow](/examples/workflows_2/03_workflows_loop_execution/loop_steps_workflow)

### 7. Branching Workflows

**When to use**: Complex decision trees, topic-specific workflows, dynamic routing.

**Example Use-Cases**: Content type detection, expertise routing

![Router Steps](https://mintlify.s3.us-west-1.amazonaws.com/agno/images/router_steps.png)

#### Parameters

<Snippet file="router-step-reference.mdx" />

#### Example

```python
from agno.workflow.v2 import Router, Step, Workflow

def route_by_topic(step_input) -> List[Step]:
    topic = step_input.message.lower()
    
    if "tech" in topic:
        return [Step(name="Tech Research", agent=tech_expert)]
    elif "business" in topic:
        return [Step(name="Business Research", agent=biz_expert)]
    else:
        return [Step(name="General Research", agent=generalist)]

workflow = Workflow(
    name="Expert Routing",
    steps=[
        Router(
            name="Topic Router",
            selector=route_by_topic,
            choices=[tech_step, business_step, general_step]
        ),
        Step(name="Synthesis", agent=synthesizer),
    ]
)

workflow.print_response("Latest developments in artificial intelligence and machine learning", markdown=True)
```

**More Examples**:

* [Router Steps Workflow](/examples/workflows_2/05_workflows_conditional_branching/router_steps_workflow)

### 8. Steps: Grouping a list of steps

**When to use**: When you need to group multiple steps into logical sequences, create reusable workflows, or organize complex workflows with multiple branching paths.

**Better Routing**: Use with Router for clean branching logic

#### Parameters

<Snippet file="steps-reference.mdx" />

#### Basic Example

```python
from agno.workflow.v2 import Steps, Step, Workflow

# Create a reusable content creation sequence
article_creation_sequence = Steps(
    name="ArticleCreation",
    description="Complete article creation workflow from research to final edit",
    steps=[
        Step(name="research", agent=researcher),
        Step(name="writing", agent=writer), 
        Step(name="editing", agent=editor),
    ],
)

# Use the sequence in a workflow
workflow = Workflow(
    name="Article Creation Workflow",
    steps=[article_creation_sequence]  # Single sequence
)

workflow.print_response("Write an article about renewable energy", markdown=True)
```

#### Steps with Router

This is where `Steps` really shines - creating distinct sequences for different content types or workflows:

```python
from agno.workflow.v2 import Steps, Router, Step, Workflow

# Define two completely different workflows as Steps
image_sequence = Steps(
    name="image_generation",
    description="Complete image generation and analysis workflow",
    steps=[
        Step(name="generate_image", agent=image_generator),
        Step(name="describe_image", agent=image_describer),
    ],
)

video_sequence = Steps(
    name="video_generation", 
    description="Complete video production and analysis workflow",
    steps=[
        Step(name="generate_video", agent=video_generator),
        Step(name="describe_video", agent=video_describer),
    ],
)

def media_sequence_selector(step_input) -> List[Step]:
    """Route to appropriate media generation pipeline"""
    if not step_input.message:
        return [image_sequence]
        
    message_lower = step_input.message.lower()
    
    if "video" in message_lower:
        return [video_sequence]
    elif "image" in message_lower:
        return [image_sequence]
    else:
        return [image_sequence]  # Default

# Clean workflow with clear branching
media_workflow = Workflow(
    name="AI Media Generation Workflow",
    description="Generate and analyze images or videos using AI agents",
    steps=[
        Router(
            name="Media Type Router",
            description="Routes to appropriate media generation pipeline",
            selector=media_sequence_selector,
            choices=[image_sequence, video_sequence],  # Clear choices
        )
    ],
)

# Usage examples
media_workflow.print_response("Create an image of a magical forest", markdown=True)
media_workflow.print_response("Create a cinematic video of city timelapse", markdown=True)
```

**More Examples**:

* [`workflow_using_steps.py`](/examples/workflows_2/01-basic-workflows/workflow_using_steps)
* [`workflow_using_steps_nested.py`](/examples/workflows_2/01-basic-workflows/workflow_using_steps_nested)
* [`selector_for_image_video_generation_pipelines.py`](/examples/workflows_2/05_workflows_conditional_branching/selector_for_image_video_generation_pipelines)

### 9. Advanced Workflow Patterns

You can use the patterns above to construct sophisticated workflows.

**Example Usage**: Conditions + Parallel + Loops + Custom Post-Processing Function + Routing

```python
from agno.workflow.v2 import Condition, Loop, Parallel, Router, Step, Workflow

def research_post_processor(step_input) -> StepOutput:
    """Post-process and consolidate research data from parallel conditions"""
    research_data = step_input.previous_step_content or ""
    
    try:
        # Analyze research quality and completeness
        word_count = len(research_data.split())
        has_tech_content = any(keyword in research_data.lower() 
                              for keyword in ["technology", "ai", "software", "tech"])
        has_business_content = any(keyword in research_data.lower() 
                                  for keyword in ["market", "business", "revenue", "strategy"])
        
        # Create enhanced research summary
        enhanced_summary = f"""
            ## Research Analysis Report
            
            **Data Quality:** {"✓ High-quality" if word_count > 200 else "⚠ Limited data"}
            
            **Content Coverage:**
            - Technical Analysis: {"✓ Completed" if has_tech_content else "✗ Not available"}
            - Business Analysis: {"✓ Completed" if has_business_content else "✗ Not available"}
            
            **Research Findings:**
            {research_data}
        """.strip()
        
        return StepOutput(
            content=enhanced_summary,
            success=True,
        )
        
    except Exception as e:
        return StepOutput(
            content=f"Research post-processing failed: {str(e)}",
            success=False,
            error=str(e)
        )

# Complex workflow combining multiple patterns
workflow = Workflow(
    name="Advanced Multi-Pattern Workflow",
    steps=[
        Parallel(
            Condition(
                name="Tech Check",
                evaluator=is_tech_topic,
                steps=[Step(name="Tech Research", agent=tech_researcher)]
            ),
            Condition(
                name="Business Check", 
                evaluator=is_business_topic,
                steps=[
                    Loop(
                        name="Deep Business Research",
                        steps=[Step(name="Market Research", agent=market_researcher)],
                        end_condition=research_quality_check,
                        max_iterations=3
                    )
                ]
            ),
            name="Conditional Research Phase"
        ),
        Step(
            name="Research Post-Processing",
            executor=research_post_processor,
            description="Consolidate and analyze research findings with quality metrics"
        ),
        Router(
            name="Content Type Router",
            selector=content_type_selector,
            choices=[blog_post_step, social_media_step, report_step]
        ),
        Step(name="Final Review", agent=reviewer),
    ]
)

workflow.print_response("Create a comprehensive analysis of sustainable technology trends and their business impact for 2024", markdown=True)
```

**More Examples**:

* [Condition and Parallel Steps (Streaming Example)](/examples/workflows_2/02-workflows-conditional-execution/condition_and_parallel_steps_stream)
* [Loop with Parallel Steps (Streaming Example)](/examples/workflows_2/03_workflows_loop_execution/loop_with_parallel_steps_stream)
* [Router with Loop Steps](/examples/workflows_2/05_workflows_conditional_branching/router_with_loop_steps)
