/**
 * Grok Structured Output Schemas
 * Reusable JSON schemas for X.AI structured outputs
 * Based on https://docs.x.ai/docs/guides/structured-outputs
 */

// Agent Decision Schema
export const AGENT_DECISION_SCHEMA = {
  name: "agent_decision",
  schema: {
    type: "object",
    properties: {
      shouldRespond: {
        type: "boolean",
        description: "Whether the agent should respond to the message"
      },
      recipientIds: {
        type: "array",
        items: { type: "string" },
        description: "List of agent IDs to send response to"
      },
      responseContent: {
        type: "object",
        description: "The content of the response",
        additionalProperties: true
      },
      messageType: {
        type: "string",
        enum: ["response", "question", "proposal", "notification", "collaboration"],
        description: "Type of message to send"
      },
      reasoning: {
        type: "string",
        description: "Explanation of the decision"
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence level in the decision"
      }
    },
    required: ["shouldRespond", "reasoning"],
    additionalProperties: false
  }
};

// Voting Decision Schema
export const VOTING_DECISION_SCHEMA = {
  name: "voting_decision",
  schema: {
    type: "object",
    properties: {
      shouldVote: {
        type: "boolean",
        description: "Whether to cast a vote"
      },
      vote: {
        type: "string",
        enum: ["APPROVE", "REJECT", "ABSTAIN"],
        description: "The vote to cast"
      },
      reasoning: {
        type: "string",
        description: "Detailed reasoning for the vote"
      },
      shouldCounter: {
        type: "boolean",
        description: "Whether to create a counter-proposal"
      },
      counterProposal: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          proposal_data: { type: "object", additionalProperties: true }
        },
        required: ["title", "description"]
      }
    },
    required: ["shouldVote", "vote", "reasoning"],
    additionalProperties: false
  }
};

// Compliance Analysis Schema
export const COMPLIANCE_ANALYSIS_SCHEMA = {
  name: "compliance_analysis",
  schema: {
    type: "object",
    properties: {
      predictions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            issue: { type: "string" },
            field: { type: "string" },
            severity: {
              type: "string",
              enum: ["critical", "high", "medium", "low"]
            },
            likelihood: {
              type: "number",
              minimum: 0,
              maximum: 1
            },
            impact: { type: "string" },
            preemptiveFix: {
              type: "object",
              additionalProperties: true
            }
          },
          required: ["issue", "severity", "likelihood"]
        }
      },
      autoFixable: {
        type: "object",
        additionalProperties: true,
        description: "Fields that can be automatically fixed"
      },
      riskScore: {
        type: "integer",
        minimum: 0,
        maximum: 100
      },
      readyForCreation: {
        type: "boolean"
      },
      criticalIssues: {
        type: "integer",
        minimum: 0
      },
      aiRecommendation: {
        type: "string"
      }
    },
    required: ["predictions", "riskScore", "readyForCreation"],
    additionalProperties: false
  }
};

// Market Analysis Schema
export const MARKET_ANALYSIS_SCHEMA = {
  name: "market_analysis",
  schema: {
    type: "object",
    properties: {
      analysis: {
        type: "object",
        properties: {
          sentiment: {
            type: "string",
            enum: ["very_bullish", "bullish", "neutral", "bearish", "very_bearish"]
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          keyFactors: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["sentiment", "confidence"]
      },
      technicalIndicators: {
        type: "object",
        properties: {
          rsi: { type: "number" },
          sma20: { type: "number" },
          sma50: { type: "number" },
          macd: {
            type: "object",
            properties: {
              value: { type: "number" },
              signal: { type: "number" },
              histogram: { type: "number" }
            }
          },
          trend: {
            type: "string",
            enum: ["strong_uptrend", "uptrend", "sideways", "downtrend", "strong_downtrend"]
          }
        }
      },
      prediction: {
        type: "object",
        properties: {
          direction: {
            type: "string",
            enum: ["up", "down", "sideways"]
          },
          targetPrice: { type: "number" },
          timeframe: { type: "string" },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          }
        },
        required: ["direction", "confidence"]
      },
      risks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"]
            },
            description: { type: "string" }
          },
          required: ["type", "severity", "description"]
        }
      },
      opportunities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            potential: {
              type: "string",
              enum: ["low", "medium", "high", "very_high"]
            },
            description: { type: "string" },
            actionRequired: { type: "string" }
          },
          required: ["type", "potential", "description"]
        }
      }
    },
    required: ["analysis", "prediction"],
    additionalProperties: false
  }
};

// Agent Enhancement Schema
export const AGENT_ENHANCEMENT_SCHEMA = {
  name: "agent_enhancement",
  schema: {
    type: "object",
    properties: {
      enhanced_description: {
        type: "string",
        description: "Detailed markdown description"
      },
      capabilities: {
        type: "array",
        items: { type: "string" }
      },
      inputSchema: {
        type: "object",
        additionalProperties: true
      },
      outputSchema: {
        type: "object",
        additionalProperties: true
      },
      goals: {
        type: "array",
        items: { type: "string" }
      },
      personality_traits: {
        type: "array",
        items: { type: "string" }
      },
      collaboration_preferences: {
        type: "object",
        properties: {
          preferred_partners: {
            type: "array",
            items: { type: "string" }
          },
          communication_style: {
            type: "string",
            enum: ["formal", "casual", "technical", "collaborative"]
          },
          negotiation_approach: {
            type: "string",
            enum: ["data-driven", "consensus-seeking", "decisive", "flexible"]
          }
        }
      },
      performance_metrics: {
        type: "object",
        properties: {
          accuracy_threshold: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          response_time_ms: {
            type: "integer",
            minimum: 0
          },
          success_rate_target: {
            type: "number",
            minimum: 0,
            maximum: 1
          }
        }
      },
      compliance_notes: {
        type: "string"
      }
    },
    required: ["enhanced_description", "capabilities", "goals"],
    additionalProperties: false
  }
};

// Reputation Analysis Schema
export const REPUTATION_ANALYSIS_SCHEMA = {
  name: "reputation_analysis",
  schema: {
    type: "object",
    properties: {
      reputation_score: {
        type: "number",
        minimum: 0,
        maximum: 100
      },
      trust_level: {
        type: "string",
        enum: ["very_high", "high", "medium", "low", "very_low"]
      },
      performance_metrics: {
        type: "object",
        properties: {
          messages_handled: { type: "integer" },
          successful_proposals: { type: "integer" },
          failed_proposals: { type: "integer" },
          average_response_time: { type: "number" },
          collaboration_score: { type: "number", minimum: 0, maximum: 100 }
        }
      },
      strengths: {
        type: "array",
        items: { type: "string" }
      },
      areas_for_improvement: {
        type: "array",
        items: { type: "string" }
      },
      recent_activities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            activity: { type: "string" },
            timestamp: { type: "string" },
            outcome: {
              type: "string",
              enum: ["success", "failure", "partial"]
            }
          }
        }
      },
      recommendation: {
        type: "string"
      }
    },
    required: ["reputation_score", "trust_level", "recommendation"],
    additionalProperties: false
  }
};

// Workflow Analysis Schema
export const WORKFLOW_ANALYSIS_SCHEMA = {
  name: "workflow_analysis",
  schema: {
    type: "object",
    properties: {
      stepAnalysis: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            issues: {
              type: "array",
              items: { type: "string" }
            },
            fixes: {
              type: "object",
              additionalProperties: true
            },
            skipIfFails: { type: "boolean" }
          }
        }
      },
      dataFlowIssues: {
        type: "array",
        items: { type: "string" }
      },
      optimizations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            step: { type: "string" },
            optimization: { type: "string" },
            impact: {
              type: "string",
              enum: ["low", "medium", "high"]
            }
          }
        }
      },
      alternativeFlow: {
        type: "object",
        additionalProperties: true
      },
      successProbability: {
        type: "number",
        minimum: 0,
        maximum: 1
      }
    },
    required: ["stepAnalysis", "successProbability"],
    additionalProperties: false
  }
};

// Helper function to create structured output request
export function createStructuredRequest(messages, schema, options = {}) {
  return {
    model: options.model || 'grok-4-0709',
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 1000,
    response_format: {
      type: "json_schema",
      json_schema: schema
    }
  };
}

// Helper function to make structured API call
export async function callGrokStructured(apiKey, messages, schema, options = {}) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createStructuredRequest(messages, schema, options))
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // With structured outputs, the response is already parsed JSON
  return data.choices[0]?.message?.content;
}

export default {
  schemas: {
    AGENT_DECISION_SCHEMA,
    VOTING_DECISION_SCHEMA,
    COMPLIANCE_ANALYSIS_SCHEMA,
    MARKET_ANALYSIS_SCHEMA,
    AGENT_ENHANCEMENT_SCHEMA,
    REPUTATION_ANALYSIS_SCHEMA,
    WORKFLOW_ANALYSIS_SCHEMA
  },
  createStructuredRequest,
  callGrokStructured
};