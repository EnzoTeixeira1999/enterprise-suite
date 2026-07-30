package dev.enzoteixeira.tracepass.batch;

public enum BatchStatus {
    REGISTERED,
    IN_STORAGE,
    IN_TRANSIT,
    BLOCKED,
    COMPLETED,
    EXPIRED
}