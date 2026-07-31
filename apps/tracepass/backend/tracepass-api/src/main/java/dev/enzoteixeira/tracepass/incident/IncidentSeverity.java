package dev.enzoteixeira.tracepass.incident;

public enum IncidentSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    public boolean requiresAutomaticBlock() {
        return this == HIGH || this == CRITICAL;
    }
}