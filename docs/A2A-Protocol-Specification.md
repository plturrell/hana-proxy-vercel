# A2A Protocol Specification v1.0

## Overview
The Agent-to-Agent (A2A) Protocol defines standardized message formats, communication patterns, and consensus mechanisms for autonomous agent interaction within the Finsight Experience network.

## Core Principles
- **Asynchronous Communication**: All messages are fire-and-forget with optional acknowledgments
- **Type Safety**: Structured message formats with validation
- **Consensus-Driven**: Critical decisions require multi-agent agreement
- **Trust-Based**: Communication respects established trust relationships
- **Event-Driven**: Agents respond to system events and triggers

## Message Format Standard

### Base Message Structure
```json
{
  "message_id": "msg_${timestamp}_${uuid}",
  "sender_id": "agent_identifier", 
  "recipient_id": "target_agent_identifier",
  "message_type": "MESSAGE_TYPE_CONSTANT",
  "payload": {
    // Type-specific payload structure
  },
  "timestamp": "ISO8601_timestamp",
  "ttl_seconds": 300,
  "priority": "low|medium|high|critical",
  "requires_ack": boolean,
  "correlation_id": "optional_conversation_thread_id"
}
```

## Standard Message Types

### 1. Task Management Messages

#### TASK_CREATE
**Purpose**: Request another agent to execute a specific task
```json
{
  "message_type": "TASK_CREATE",
  "payload": {
    "task_id": "unique_task_identifier",
    "task_type": "analytics|ml|financial|data_processing",
    "description": "Human readable description",
    "input_data": {},
    "deadline": "ISO8601_timestamp",
    "priority": "low|medium|high|critical",
    "success_criteria": {},
    "callback_endpoint": "optional_webhook_url"
  }
}
```

#### TASK_ACCEPT
**Purpose**: Confirm acceptance of a task request
```json
{
  "message_type": "TASK_ACCEPT",
  "payload": {
    "task_id": "referenced_task_id",
    "estimated_completion": "ISO8601_timestamp",
    "resource_requirements": {},
    "status": "accepted"
  }
}
```

#### TASK_REJECT
**Purpose**: Decline a task request with reason
```json
{
  "message_type": "TASK_REJECT",
  "payload": {
    "task_id": "referenced_task_id",
    "reason": "insufficient_resources|capability_mismatch|overloaded|other",
    "alternative_suggestions": [],
    "retry_after": "optional_ISO8601_timestamp"
  }
}
```

#### TASK_PROGRESS
**Purpose**: Update task execution progress
```json
{
  "message_type": "TASK_PROGRESS", 
  "payload": {
    "task_id": "referenced_task_id",
    "progress_percentage": 0-100,
    "current_stage": "stage_description",
    "intermediate_results": {},
    "estimated_completion": "updated_ISO8601_timestamp"
  }
}
```

#### TASK_COMPLETE
**Purpose**: Signal task completion with results
```json
{
  "message_type": "TASK_COMPLETE",
  "payload": {
    "task_id": "referenced_task_id",
    "status": "success|failure|partial",
    "results": {},
    "execution_metrics": {
      "duration_ms": 1234,
      "resources_used": {},
      "error_count": 0
    }
  }
}
```

### 2. Data Exchange Messages

#### DATA_REQUEST
**Purpose**: Request specific data from another agent
```json
{
  "message_type": "DATA_REQUEST",
  "payload": {
    "request_id": "unique_request_id",
    "data_type": "market_data|model_output|analytics_result",
    "query_parameters": {},
    "format": "json|csv|parquet",
    "max_records": 1000
  }
}
```

#### DATA_RESPONSE
**Purpose**: Provide requested data
```json
{
  "message_type": "DATA_RESPONSE",
  "payload": {
    "request_id": "referenced_request_id",
    "status": "success|error|partial",
    "data": {},
    "metadata": {
      "record_count": 123,
      "generation_time": "ISO8601_timestamp",
      "data_quality_score": 0.95
    }
  }
}
```

### 3. Consensus Messages

#### CONSENSUS_PROPOSE
**Purpose**: Initiate a consensus round for decision making
```json
{
  "message_type": "CONSENSUS_PROPOSE",
  "payload": {
    "proposal_id": "unique_proposal_id",
    "proposal_type": "model_deployment|parameter_update|network_change",
    "description": "What is being proposed",
    "proposed_changes": {},
    "participants": ["agent_id_1", "agent_id_2"],
    "voting_deadline": "ISO8601_timestamp",
    "quorum_threshold": 2,
    "consensus_threshold": 0.67
  }
}
```

#### CONSENSUS_VOTE
**Purpose**: Cast a vote in an active consensus round
```json
{
  "message_type": "CONSENSUS_VOTE",
  "payload": {
    "proposal_id": "referenced_proposal_id",
    "vote": "approve|reject|abstain",
    "reasoning": "Explanation for the vote",
    "conditions": "Optional conditions for approval",
    "signature": "cryptographic_signature"
  }
}
```

#### CONSENSUS_RESULT
**Purpose**: Announce consensus round results
```json
{
  "message_type": "CONSENSUS_RESULT",
  "payload": {
    "proposal_id": "referenced_proposal_id",
    "result": "approved|rejected|failed_quorum",
    "vote_summary": {
      "approve": 3,
      "reject": 1,
      "abstain": 0
    },
    "execution_plan": "What happens next if approved"
  }
}
```

### 4. System Messages

#### HEARTBEAT
**Purpose**: Maintain agent liveness and status
```json
{
  "message_type": "HEARTBEAT",
  "payload": {
    "status": "active|busy|maintenance|error",
    "capabilities": [],
    "load_metrics": {
      "cpu_usage": 0.45,
      "memory_usage": 0.62,
      "active_tasks": 3
    },
    "last_activity": "ISO8601_timestamp"
  }
}
```

#### ERROR_REPORT
**Purpose**: Report errors or system issues
```json
{
  "message_type": "ERROR_REPORT",
  "payload": {
    "error_id": "unique_error_id",
    "error_type": "connection|computation|data|timeout",
    "severity": "low|medium|high|critical",
    "description": "Error description",
    "stack_trace": "optional_stack_trace",
    "affected_tasks": [],
    "recovery_actions": []
  }
}
```

## Message Triggers and Workflows

### 1. Task Execution Workflow
```
Agent A → TASK_CREATE → Agent B
Agent B → TASK_ACCEPT/TASK_REJECT → Agent A
[If accepted]
Agent B → TASK_PROGRESS → Agent A (periodic)
Agent B → TASK_COMPLETE → Agent A
```

### 2. Consensus Workflow
```
Proposer → CONSENSUS_PROPOSE → All Participants
Participants → CONSENSUS_VOTE → Proposer
Proposer → CONSENSUS_RESULT → All Participants
[If approved, execute changes]
```

### 3. Data Exchange Workflow
```
Consumer → DATA_REQUEST → Provider
Provider → DATA_RESPONSE → Consumer
```

## Event Triggers for Autonomous Behavior

### Market Event Triggers
- **Market volatility spike**: Trigger risk analysis tasks
- **New data availability**: Trigger model updates
- **Performance threshold breach**: Trigger consensus for parameter changes

### System Event Triggers
- **Agent joins network**: Send capability announcements
- **Trust relationship change**: Update communication preferences
- **Resource constraints**: Initiate load balancing consensus

### Time-Based Triggers
- **Scheduled model retraining**: Initiate TASK_CREATE messages
- **Periodic health checks**: Send HEARTBEAT messages
- **Consensus deadline approach**: Send reminder messages

## Implementation Guidelines

### Message Validation Rules
1. All messages must include required base fields
2. Payload must match schema for message_type
3. TTL must be reasonable (30-3600 seconds)
4. sender_id must match authenticated agent identity

### Error Handling
1. Invalid messages generate ERROR_REPORT responses
2. Timeout messages should be retried with exponential backoff
3. Critical errors require immediate ERROR_REPORT broadcast

### Security Considerations
1. All inter-agent messages should include sender authentication
2. Consensus votes require cryptographic signatures
3. Sensitive data should be encrypted in payload
4. Rate limiting prevents message spam

## Integration with Existing Infrastructure

### Supabase Tables
- `a2a_messages`: Stores all A2A communications
- `a2a_proposals`: Tracks consensus proposals
- `a2a_votes`: Records consensus votes
- `a2a_agent_states`: Maintains agent status

### PostgreSQL Functions
- `process_a2a_message()`: Validates and routes messages
- `start_consensus_round()`: Initiates consensus voting
- `cast_vote()`: Records votes with validation
- `check_consensus()`: Calculates consensus results

This specification provides the foundation for implementing autonomous agent behavior, event-driven messaging, and interactive consensus participation within your existing Supabase-backed A2A network.
