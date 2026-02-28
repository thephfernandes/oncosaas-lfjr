"""
Pydantic models for agent API request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


# ============================================
# Agent Process (main endpoint)
# ============================================

class AgentProcessRequest(BaseModel):
    """Request to process a patient message through the agent."""

    message: str = Field(..., description="Patient message content")
    patient_id: str = Field(..., description="Patient UUID")
    tenant_id: str = Field(..., description="Tenant UUID")
    clinical_context: Dict[str, Any] = Field(
        default_factory=dict, description="Full clinical context from backend"
    )
    protocol: Optional[Dict[str, Any]] = Field(
        None, description="Active clinical protocol"
    )
    conversation_history: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Recent conversation messages [{role, content}]",
    )
    agent_state: Dict[str, Any] = Field(
        default_factory=dict, description="Persistent agent state"
    )
    agent_config: Optional[Dict[str, Any]] = Field(
        None, description="Tenant agent configuration"
    )


class DetectedSymptom(BaseModel):
    """A detected symptom from the message."""

    name: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float = 0.0
    action: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class SymptomAnalysisResult(BaseModel):
    """Result of symptom analysis."""

    detectedSymptoms: List[DetectedSymptom] = Field(default_factory=list)
    overallSeverity: str = "LOW"
    requiresEscalation: bool = False
    structuredData: Dict[str, Any] = Field(default_factory=dict)
    escalationReason: Optional[str] = None


class AgentDecision(BaseModel):
    """A decision made by the agent."""

    decisionType: str
    reasoning: str
    confidence: Optional[float] = None
    inputData: Dict[str, Any] = Field(default_factory=dict)
    outputAction: Dict[str, Any] = Field(default_factory=dict)
    requiresApproval: bool = False


class AgentProcessResponse(BaseModel):
    """Response from agent processing."""

    response: str = Field(..., description="Agent response to send to patient")
    actions: List[Dict[str, Any]] = Field(
        default_factory=list, description="Actions to execute"
    )
    symptom_analysis: Optional[SymptomAnalysisResult] = None
    new_state: Dict[str, Any] = Field(
        default_factory=dict, description="Updated agent state"
    )
    decisions: List[AgentDecision] = Field(
        default_factory=list, description="Decisions made by the agent"
    )


# ============================================
# Build Context
# ============================================

class BuildContextRequest(BaseModel):
    """Request to build clinical context."""

    patient_id: str
    tenant_id: str
    clinical_context: Dict[str, Any] = Field(default_factory=dict)
    protocol: Optional[Dict[str, Any]] = None


class ClinicalContextResponse(BaseModel):
    """Built clinical context."""

    context: str = Field(..., description="Formatted clinical context string")
    patient_summary: str = Field(
        "", description="Brief patient summary"
    )


# ============================================
# Symptom Analysis
# ============================================

class SymptomAnalysisRequest(BaseModel):
    """Request for symptom analysis."""

    message: str
    patient_id: str
    cancer_type: Optional[str] = None
    clinical_context: Optional[Dict[str, Any]] = None
    use_llm: bool = False
    agent_config: Optional[Dict[str, Any]] = None


class SymptomAnalysisResponse(BaseModel):
    """Response from symptom analysis."""

    detected_symptoms: List[DetectedSymptom] = Field(default_factory=list)
    overall_severity: str = "LOW"
    requires_escalation: bool = False
    structured_data: Dict[str, Any] = Field(default_factory=dict)
    escalation_reason: Optional[str] = None
