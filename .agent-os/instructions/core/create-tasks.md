---
description: Task Creation and Management Rules for Agent OS
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Task Creation and Management Rules

## Overview

Generate structured task documents for project workflows: task definitions, execution flows, and validation requirements for AI agent consumption.

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>

<process_flow>

<step number="1" subagent="context-fetcher" name="gather_task_requirements">

### Step 1: Gather Task Requirements

Use the context-fetcher subagent to collect all required inputs from the user including task objective, acceptance criteria, dependencies, priority level, and execution parameters with blocking validation before proceeding.

<data_sources>
  <primary>user_direct_input</primary>
  <fallback_sequence>
    1. @.agent-os/specs/
    2. @.agent-os/product/roadmap.md
    3. @.claude/CLAUDE.md
    4. Cursor User Rules
  </fallback_sequence>
</data_sources>

<error_template>
  Please provide the following missing information:
  1. Task objective and description
  2. Acceptance criteria (minimum 2)
  3. Priority level (High/Medium/Low)
  4. Estimated effort (XS/S/M/L/XL)
  5. Dependencies (if any)
  6. Assigned agent or team member
  7. Due date or target completion
</error_template>

</step>

<step number="2" subagent="file-creator" name="create_task_structure">

### Step 2: Create Task Structure

Use the file-creator subagent to create the following file_structure with validation for write permissions and protection against overwriting existing files:

<file_structure>
  .agent-os/
  └── tasks/
      ├── [TASK_ID]/
      │   ├── task.md              # Main task definition
      │   ├── execution-plan.md    # Step-by-step execution flow
      │   ├── validation.md        # Testing and validation criteria
      │   └── resources.md         # Required resources and dependencies
      └── task-registry.md         # Index of all tasks
</file_structure>

</step>

<step number="3" subagent="file-creator" name="create_task_md">

### Step 3: Create task.md

Use the file-creator subagent to create the file: .agent-os/tasks/[TASK_ID]/task.md and use the following template:

<file_template>
  <header>
    # Task Definition: [TASK_NAME]
  </header>
  <required_sections>
    - Overview
    - Objective
    - Acceptance Criteria
    - Priority and Effort
    - Dependencies
    - Assignment
    - Timeline
  </required_sections>
</file_template>

<section name="overview">
  <template>
    ## Overview

    **Task ID:** [TASK_ID]
    **Created:** [CURRENT_DATE]
    **Status:** [STATUS]
    **Type:** [TASK_TYPE]

    [BRIEF_DESCRIPTION_OF_TASK]
  </template>
  <constraints>
    - task_id: unique identifier
    - status: Planning/In Progress/Review/Complete/Blocked
    - task_type: Feature/Bug Fix/Research/Documentation/Infrastructure
    - description: 1-2 sentences
  </constraints>
</section>

<section name="objective">
  <template>
    ## Objective

    [DETAILED_TASK_OBJECTIVE]. This task will [EXPECTED_OUTCOME] and enable [BUSINESS_VALUE].

    ### Success Definition

    This task is considered successful when:
    - [SUCCESS_CRITERION_1]
    - [SUCCESS_CRITERION_2]
    - [SUCCESS_CRITERION_3]
  </template>
  <constraints>
    - objective: 2-4 sentences
    - outcome: specific and measurable
    - criteria: minimum 2, maximum 5
  </constraints>
</section>

<section name="acceptance_criteria">
  <template>
    ## Acceptance Criteria

    ### Functional Requirements

    - [ ] [FUNCTIONAL_REQUIREMENT_1]
    - [ ] [FUNCTIONAL_REQUIREMENT_2]
    - [ ] [FUNCTIONAL_REQUIREMENT_3]

    ### Technical Requirements

    - [ ] [TECHNICAL_REQUIREMENT_1]
    - [ ] [TECHNICAL_REQUIREMENT_2]

    ### Quality Requirements

    - [ ] [QUALITY_REQUIREMENT_1]
    - [ ] [QUALITY_REQUIREMENT_2]
  </template>
  <constraints>
    - functional: 2-5 requirements
    - technical: 1-3 requirements
    - quality: 1-3 requirements
    - format: checkboxes for tracking
  </constraints>
</section>

<section name="priority_effort">
  <template>
    ## Priority and Effort

    **Priority:** [HIGH/MEDIUM/LOW]
    **Effort Estimate:** [XS/S/M/L/XL]
    **Complexity:** [LOW/MEDIUM/HIGH]

    ### Effort Breakdown

    - **Analysis:** [EFFORT_ESTIMATE]
    - **Implementation:** [EFFORT_ESTIMATE]
    - **Testing:** [EFFORT_ESTIMATE]
    - **Documentation:** [EFFORT_ESTIMATE]
  </template>
  <effort_scale>
    - XS: 1 day
    - S: 2-3 days
    - M: 1 week
    - L: 2 weeks
    - XL: 3+ weeks
  </effort_scale>
</section>

<section name="dependencies">
  <template>
    ## Dependencies

    ### Blocking Dependencies

    - [DEPENDENCY_1] - [STATUS] - [OWNER]
    - [DEPENDENCY_2] - [STATUS] - [OWNER]

    ### Related Tasks

    - [RELATED_TASK_1] - [RELATIONSHIP]
    - [RELATED_TASK_2] - [RELATIONSHIP]

    ### External Dependencies

    - [EXTERNAL_DEPENDENCY_1] - [DESCRIPTION]
  </template>
  <relationship_types>
    - Blocks: this task blocks the related task
    - Blocked by: this task is blocked by the related task
    - Related to: tasks share common components
    - Follows: this task should start after the related task
  </relationship_types>
</section>

<section name="assignment">
  <template>
    ## Assignment

    **Assigned To:** [ASSIGNEE_NAME]
    **Agent Type:** [AGENT_TYPE]
    **Team:** [TEAM_NAME]

    ### Required Skills

    - [SKILL_1]
    - [SKILL_2]
    - [SKILL_3]

    ### Required Tools

    - [TOOL_1]: [PURPOSE]
    - [TOOL_2]: [PURPOSE]
  </template>
  <agent_types>
    - Human Developer
    - AI Coding Agent
    - AI Documentation Agent
    - AI Testing Agent
    - Mixed Team
  </agent_types>
</section>

<section name="timeline">
  <template>
    ## Timeline

    **Start Date:** [START_DATE]
    **Due Date:** [DUE_DATE]
    **Estimated Duration:** [DURATION]

    ### Milestones

    - [ ] [MILESTONE_1] - [TARGET_DATE]
    - [ ] [MILESTONE_2] - [TARGET_DATE]
    - [ ] [MILESTONE_3] - [TARGET_DATE]
  </template>
  <constraints>
    - dates: YYYY-MM-DD format
    - milestones: 2-5 key checkpoints
    - duration: business days
  </constraints>
</section>

</step>

<step number="4" subagent="file-creator" name="create_execution_plan_md">

### Step 4: Create execution-plan.md

Use the file-creator subagent to create the file: .agent-os/tasks/[TASK_ID]/execution-plan.md and use the following template:

<file_template>
  <header>
    # Execution Plan: [TASK_NAME]
  </header>
</file_template>

<required_sections>
  - Approach Overview
  - Implementation Steps
  - Risk Assessment
  - Contingency Plans
</required_sections>

<section name="approach">
  <template>
    ## Approach Overview

    ### Strategy

    [IMPLEMENTATION_STRATEGY_DESCRIPTION]

    ### Key Decisions

    - **[DECISION_TOPIC]:** [CHOSEN_APPROACH] because [RATIONALE]
    - **[DECISION_TOPIC]:** [CHOSEN_APPROACH] because [RATIONALE]

    ### Architecture Impact

    [DESCRIPTION_OF_SYSTEM_CHANGES]
  </template>
</section>

<section name="steps">
  <template>
    ## Implementation Steps

    ### Phase 1: [PHASE_NAME]

    1. **[STEP_NAME]** - [DESCRIPTION]
       - Input: [REQUIRED_INPUT]
       - Output: [EXPECTED_OUTPUT]
       - Validation: [VALIDATION_CRITERIA]

    2. **[STEP_NAME]** - [DESCRIPTION]
       - Input: [REQUIRED_INPUT]
       - Output: [EXPECTED_OUTPUT]
       - Validation: [VALIDATION_CRITERIA]

    ### Phase 2: [PHASE_NAME]

    [SIMILAR_STRUCTURE]
  </template>
  <constraints>
    - phases: 2-4 logical groupings
    - steps: 3-8 per phase
    - validation: clear success criteria per step
  </constraints>
</section>

<section name="risks">
  <template>
    ## Risk Assessment

    ### High Risk Items

    - **[RISK_DESCRIPTION]**
      - Impact: [HIGH/MEDIUM/LOW]
      - Probability: [HIGH/MEDIUM/LOW]
      - Mitigation: [MITIGATION_STRATEGY]

    ### Medium Risk Items

    - **[RISK_DESCRIPTION]**
      - Impact: [HIGH/MEDIUM/LOW]
      - Probability: [HIGH/MEDIUM/LOW]
      - Mitigation: [MITIGATION_STRATEGY]
  </template>
</section>

</step>

<step number="5" subagent="file-creator" name="create_validation_md">

### Step 5: Create validation.md

Use the file-creator subagent to create the file: .agent-os/tasks/[TASK_ID]/validation.md for the purpose of defining comprehensive testing and validation criteria.

<file_template>
  <header>
    # Validation Plan: [TASK_NAME]
  </header>
</file_template>

<content_structure>
  <test_scenarios>
    - source: acceptance criteria from task.md
    - format: executable test cases
  </test_scenarios>
  <validation_checklist>
    - length: comprehensive coverage
    - includes: functional, technical, quality checks
    - excludes: implementation details
  </validation_checklist>
</content_structure>

<section name="test_scenarios">
  <template>
    ## Test Scenarios

    ### Functional Tests

    **Scenario 1: [TEST_SCENARIO_NAME]**
    - Given: [PRECONDITION]
    - When: [ACTION]
    - Then: [EXPECTED_RESULT]

    **Scenario 2: [TEST_SCENARIO_NAME]**
    - Given: [PRECONDITION]
    - When: [ACTION]
    - Then: [EXPECTED_RESULT]

    ### Integration Tests

    **Scenario 1: [INTEGRATION_TEST_NAME]**
    - Components: [SYSTEM_COMPONENTS]
    - Test: [TEST_DESCRIPTION]
    - Success: [SUCCESS_CRITERIA]

    ### Performance Tests

    **Scenario 1: [PERFORMANCE_TEST_NAME]**
    - Metric: [PERFORMANCE_METRIC]
    - Target: [TARGET_VALUE]
    - Test Method: [TEST_METHOD]
  </template>
</section>

<section name="validation_checklist">
  <template>
    ## Validation Checklist

    ### Code Quality

    - [ ] Code follows project standards
    - [ ] All functions have proper documentation
    - [ ] Error handling is implemented
    - [ ] Security best practices followed

    ### Functionality

    - [ ] All acceptance criteria met
    - [ ] Edge cases handled
    - [ ] User experience validated
    - [ ] Performance requirements met

    ### Integration

    - [ ] Dependencies properly integrated
    - [ ] API contracts maintained
    - [ ] Database changes validated
    - [ ] External services tested
  </template>
</section>

</step>

<step number="6" subagent="file-creator" name="create_resources_md">

### Step 6: Create resources.md

Use the file-creator subagent to create the following file: .agent-os/tasks/[TASK_ID]/resources.md using the following template:

<file_template>
  <header>
    # Resources: [TASK_NAME]
  </header>
</file_template>

<section name="required_resources">
  <template>
    ## Required Resources

    ### Development Tools

    - [TOOL_NAME]: [PURPOSE] - [ACCESS_REQUIREMENTS]
    - [TOOL_NAME]: [PURPOSE] - [ACCESS_REQUIREMENTS]

    ### Documentation

    - [DOCUMENT_NAME]: [LOCATION] - [RELEVANCE]
    - [DOCUMENT_NAME]: [LOCATION] - [RELEVANCE]

    ### APIs and Services

    - [SERVICE_NAME]: [ENDPOINT] - [AUTHENTICATION_REQUIRED]
    - [SERVICE_NAME]: [ENDPOINT] - [AUTHENTICATION_REQUIRED]

    ### Reference Materials

    - [REFERENCE_NAME]: [LINK] - [DESCRIPTION]
    - [REFERENCE_NAME]: [LINK] - [DESCRIPTION]
  </template>
</section>

<section name="environment_setup">
  <template>
    ## Environment Setup

    ### Prerequisites

    1. [PREREQUISITE_1]
    2. [PREREQUISITE_2]
    3. [PREREQUISITE_3]

    ### Configuration

    ```bash
    # [CONFIGURATION_DESCRIPTION]
    [COMMAND_1]
    [COMMAND_2]
    ```

    ### Verification

    - [ ] [VERIFICATION_STEP_1]
    - [ ] [VERIFICATION_STEP_2]
  </template>
</section>

</step>

<step number="7" subagent="file-creator" name="update_task_registry">

### Step 7: Update Task Registry

Use the file-creator subagent to update or create the file: .agent-os/tasks/task-registry.md to maintain an index of all tasks.

<registry_template>
  # Task Registry

  ## Active Tasks

  | Task ID | Name | Priority | Status | Assignee | Due Date |
  |---------|------|----------|--------|----------|----------|
  | [TASK_ID] | [TASK_NAME] | [PRIORITY] | [STATUS] | [ASSIGNEE] | [DUE_DATE] |

  ## Completed Tasks

  | Task ID | Name | Completed | Duration | Assignee |
  |---------|------|-----------|----------|----------|
  | [TASK_ID] | [TASK_NAME] | [COMPLETION_DATE] | [ACTUAL_DURATION] | [ASSIGNEE] |

  ## Task Statistics

  - Total Active: [COUNT]
  - Total Completed: [COUNT]
  - Average Completion Time: [DURATION]
</registry_template>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>