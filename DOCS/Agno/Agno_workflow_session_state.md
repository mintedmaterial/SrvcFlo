# How does shared state work between workflows, teams and agents?

> Learn to handle shared state between the different components of a Workflow

The workflow session state is a powerful feature of the Workflows system that allows for the persistence and sharing of state information across different components of a workflow.
This state is crucial for maintaining continuity in workflows that involve multiple tasks, agents, and teams.

![Workflow Session State](https://mintlify.s3.us-west-1.amazonaws.com/agno/images/workflow_session_state.png)

## How Workflow Session State Works

### 1. Initialization

The workflow session state is initialized when a Workflow object is created. It can be an empty dictionary or pre-populated with initial state data.

```python
shopping_workflow = Workflow(
    name="Shopping List Workflow",
    steps=[manage_items_step, view_list_step],
    workflow_session_state={},  # Initialize empty workflow session state
)
```

### 2. Access and Modification

Agents and teams can access and modify the workflow session state during task execution. This is typically done through methods or tools that interact with the state.

Consider the following example-

```python
from agno.agent.agent import Agent
from agno.models.openai.chat import OpenAIChat
from agno.workflow.v2.step import Step
from agno.workflow.v2.workflow import Workflow


# Define tools to manage a shopping list in workflow session state
def add_item(agent: Agent, item: str) -> str:
    """Add an item to the shopping list in workflow session state.

    Args:
        item (str): The item to add to the shopping list
    """
    if agent.workflow_session_state is None:
        agent.workflow_session_state = {}

    if "shopping_list" not in agent.workflow_session_state:
        agent.workflow_session_state["shopping_list"] = []

    # Check if item already exists (case-insensitive)
    existing_items = [
        existing_item.lower()
        for existing_item in agent.workflow_session_state["shopping_list"]
    ]
    if item.lower() not in existing_items:
        agent.workflow_session_state["shopping_list"].append(item)
        return f"Added '{item}' to the shopping list."
    else:
        return f"'{item}' is already in the shopping list."


def remove_item(agent: Agent, item: str) -> str:
    """Remove an item from the shopping list in workflow session state.

    Args:
        item (str): The item to remove from the shopping list
    """
    if agent.workflow_session_state is None:
        agent.workflow_session_state = {}

    if "shopping_list" not in agent.workflow_session_state:
        agent.workflow_session_state["shopping_list"] = []
        return f"Shopping list is empty. Cannot remove '{item}'."

    # Find and remove item (case-insensitive)
    shopping_list = agent.workflow_session_state["shopping_list"]
    for i, existing_item in enumerate(shopping_list):
        if existing_item.lower() == item.lower():
            removed_item = shopping_list.pop(i)
            return f"Removed '{removed_item}' from the shopping list."

    return f"'{item}' not found in the shopping list."


def remove_all_items(agent: Agent) -> str:
    """Remove all items from the shopping list in workflow session state."""
    if agent.workflow_session_state is None:
        agent.workflow_session_state = {}

    agent.workflow_session_state["shopping_list"] = []
    return "Removed all items from the shopping list."


def list_items(agent: Agent) -> str:
    """List all items in the shopping list from workflow session state."""
    if (
        agent.workflow_session_state is None
        or "shopping_list" not in agent.workflow_session_state
        or not agent.workflow_session_state["shopping_list"]
    ):
        return "Shopping list is empty."

    items = agent.workflow_session_state["shopping_list"]
    items_str = "\n".join([f"- {item}" for item in items])
    return f"Shopping list:\n{items_str}"


# Create agents with tools that use workflow session state
shopping_assistant = Agent(
    name="Shopping Assistant",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[add_item, remove_item, list_items],
    instructions=[
        "You are a helpful shopping assistant.",
        "You can help users manage their shopping list by adding, removing, and listing items.",
        "Always use the provided tools to interact with the shopping list.",
        "Be friendly and helpful in your responses.",
    ],
)

list_manager = Agent(
    name="List Manager",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[list_items, remove_all_items],
    instructions=[
        "You are a list management specialist.",
        "You can view the current shopping list and clear it when needed.",
        "Always show the current list when asked.",
        "Confirm actions clearly to the user.",
    ],
)

# Create steps
manage_items_step = Step(
    name="manage_items",
    description="Help manage shopping list items (add/remove)",
    agent=shopping_assistant,
)

view_list_step = Step(
    name="view_list",
    description="View and manage the complete shopping list",
    agent=list_manager,
)

# Create workflow with workflow_session_state
shopping_workflow = Workflow(
    name="Shopping List Workflow",
    steps=[manage_items_step, view_list_step],
    workflow_session_state={},  # Initialize empty workflow session state
)

if __name__ == "__main__":
    # Example 1: Add items to the shopping list
    print("=== Example 1: Adding Items ===")
    shopping_workflow.print_response(
        message="Please add milk, bread, and eggs to my shopping list."
    )
    print("Workflow session state:", shopping_workflow.workflow_session_state)

    # Example 2: Add more items and view list
    print("\n=== Example 2: Adding More Items ===")
    shopping_workflow.print_response(
        message="Add apples and bananas to the list, then show me the complete list."
    )
    print("Workflow session state:", shopping_workflow.workflow_session_state)

    # Example 3: Remove items
    print("\n=== Example 3: Removing Items ===")
    shopping_workflow.print_response(
        message="Remove bread from the list and show me what's left."
    )
    print("Workflow session state:", shopping_workflow.workflow_session_state)

    # Example 4: Clear the entire list
    print("\n=== Example 4: Clearing List ===")
    shopping_workflow.print_response(
        message="Clear the entire shopping list and confirm it's empty."
    )
    print("Final workflow session state:", shopping_workflow.workflow_session_state)
```

In the example, the `add_item` function which is passed as a tool to the `Agent` modifies the workflow session state by adding an item to the shopping list.

<Note>
  The `workflow_session_state` is shared across all agents and teams within a workflow. This allows for seamless collaboration and data sharing between different components.
</Note>

**More Examples**:

* [Shared Session State with Agent](https://github.com/agno-agi/agno/tree/main/cookbook/workflows_2/sync/06_workflows_advanced_concepts/shared_session_state_with_agent.py)
* [Shared Session State with Team](https://github.com/agno-agi/agno/tree/main/cookbook/workflows_2/sync/06_workflows_advanced_concepts/shared_session_state_with_team.py)


Advanced

# How does shared state work between workflows, teams and agents?

> Learn to handle shared state between the different components of a Workflow

The workflow session state is a powerful feature of the Workflows system that allows for the persistence and sharing of state information across different components of a workflow.
This state is crucial for maintaining continuity in workflows that involve multiple tasks, agents, and teams.

![Workflow Session State](https://mintlify.s3.us-west-1.amazonaws.com/agno/images/workflow_session_state.png)

## How Workflow Session State Works

### 1. Initialization

The workflow session state is initialized when a Workflow object is created. It can be an empty dictionary or pre-populated with initial state data.

```python
shopping_workflow = Workflow(
    name="Shopping List Workflow",
    steps=[manage_items_step, view_list_step],
    workflow_session_state={},  # Initialize empty workflow session state
)
```

### 2. Access and Modification

Agents and teams can access and modify the workflow session state during task execution. This is typically done through methods or tools that interact with the state.

Consider the following example-

```python
from agno.agent.agent import Agent
from agno.models.openai.chat import OpenAIChat
from agno.workflow.v2.step import Step
from agno.workflow.v2.workflow import Workflow


# Define tools to manage a shopping list in workflow session state
def add_item(agent: Agent, item: str) -> str:
    """Add an item to the shopping list in workflow session state.

    Args:
        item (str): The item to add to the shopping list
    """
    if agent.workflow_session_state is None:
        agent.workflow_session_state = {}

    if "shopping_list" not in agent.workflow_session_state:
        agent.workflow_session_state["shopping_list"] = []

    # Check if item already exists (case-insensitive)
    existing_items = [
        existing_item.lower()
        for existing_item in agent.workflow_session_state["shopping_list"]
    ]
    if item.lower() not in existing_items:
        agent.workflow_session_state["shopping_list"].append(item)
        return f"Added '{item}' to the shopping list."
    else:
        return f"'{item}' is already in the shopping list."


def remove_item(agent: Agent, item: str) -> str:
    """Remove an item from the shopping list in workflow session state.

    Args:
        item (str): The item to remove from the shopping list
    """
    if agent.workflow_session_state is None:
        agent.workflow_session_state = {}

    if "shopping_list" not in agent.workflow_session_state:
        agent.workflow_session_state["shopping_list"] = []
        return f"Shopping list is empty. Cannot remove '{item}'."

    # Find and remove item (case-insensitive)
    shopping_list = agent.workflow_session_state["shopping_list"]
    for i, existing_item in enumerate(shopping_list):
        if existing_item.lower() == item.lower():
            removed_item = shopping_list.pop(i)
            return f"Removed '{removed_item}' from the shopping list."

    return f"'{item}' not found in the shopping list."


def remove_all_items(agent: Agent) -> str:
    """Remove all items from the shopping list in workflow session state."""
    if agent.workflow_session_state is None:
        agent.workflow_session_state = {}

    agent.workflow_session_state["shopping_list"] = []
    return "Removed all items from the shopping list."


def list_items(agent: Agent) -> str:
    """List all items in the shopping list from workflow session state."""
    if (
        agent.workflow_session_state is None
        or "shopping_list" not in agent.workflow_session_state
        or not agent.workflow_session_state["shopping_list"]
    ):
        return "Shopping list is empty."

    items = agent.workflow_session_state["shopping_list"]
    items_str = "\n".join([f"- {item}" for item in items])
    return f"Shopping list:\n{items_str}"


# Create agents with tools that use workflow session state
shopping_assistant = Agent(
    name="Shopping Assistant",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[add_item, remove_item, list_items],
    instructions=[
        "You are a helpful shopping assistant.",
        "You can help users manage their shopping list by adding, removing, and listing items.",
        "Always use the provided tools to interact with the shopping list.",
        "Be friendly and helpful in your responses.",
    ],
)

list_manager = Agent(
    name="List Manager",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[list_items, remove_all_items],
    instructions=[
        "You are a list management specialist.",
        "You can view the current shopping list and clear it when needed.",
        "Always show the current list when asked.",
        "Confirm actions clearly to the user.",
    ],
)

# Create steps
manage_items_step = Step(
    name="manage_items",
    description="Help manage shopping list items (add/remove)",
    agent=shopping_assistant,
)

view_list_step = Step(
    name="view_list",
    description="View and manage the complete shopping list",
    agent=list_manager,
)

# Create workflow with workflow_session_state
shopping_workflow = Workflow(
    name="Shopping List Workflow",
    steps=[manage_items_step, view_list_step],
    workflow_session_state={},  # Initialize empty workflow session state
)

if __name__ == "__main__":
    # Example 1: Add items to the shopping list
    print("=== Example 1: Adding Items ===")
    shopping_workflow.print_response(
        message="Please add milk, bread, and eggs to my shopping list."
    )
    print("Workflow session state:", shopping_workflow.workflow_session_state)

    # Example 2: Add more items and view list
    print("\n=== Example 2: Adding More Items ===")
    shopping_workflow.print_response(
        message="Add apples and bananas to the list, then show me the complete list."
    )
    print("Workflow session state:", shopping_workflow.workflow_session_state)

    # Example 3: Remove items
    print("\n=== Example 3: Removing Items ===")
    shopping_workflow.print_response(
        message="Remove bread from the list and show me what's left."
    )
    print("Workflow session state:", shopping_workflow.workflow_session_state)

    # Example 4: Clear the entire list
    print("\n=== Example 4: Clearing List ===")
    shopping_workflow.print_response(
        message="Clear the entire shopping list and confirm it's empty."
    )
    print("Final workflow session state:", shopping_workflow.workflow_session_state)
```

In the example, the `add_item` function which is passed as a tool to the `Agent` modifies the workflow session state by adding an item to the shopping list.

<Note>
  The `workflow_session_state` is shared across all agents and teams within a workflow. This allows for seamless collaboration and data sharing between different components.
</Note>

**More Examples**:

* [Shared Session State with Agent](https://github.com/agno-agi/agno/tree/main/cookbook/workflows_2/sync/06_workflows_advanced_concepts/shared_session_state_with_agent.py)
* [Shared Session State with Team](https://github.com/agno-agi/agno/tree/main/cookbook/workflows_2/sync/06_workflows_advanced_concepts/shared_session_state_with_team.py)
