// Chemin : backend/src/main/java/com/gestiondelais/exception/GlobalExceptionHandler.java
package com.gestiondelais.exception;

import com.gestiondelais.dto.response.ApiErrorDTO;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiErrorDTO> handleNotFound(
            EntityNotFoundException ex, HttpServletRequest req) {
        log.warn("404 — {}", ex.getMessage());
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorDTO> handleBadState(
            IllegalStateException ex, HttpServletRequest req) {
        log.warn("400 — {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorDTO> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest req) {
        log.warn("401 — Login échoué sur {}", req.getRequestURI());
        return build(HttpStatus.UNAUTHORIZED, "Identifiants invalides", req.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDTO> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        String details = ex.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage).collect(Collectors.joining(" | "));
        return build(HttpStatus.BAD_REQUEST, details, req.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDTO> handleGeneric(
            Exception ex, HttpServletRequest req) {
        log.error("500 — erreur inattendue", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
            "Une erreur interne est survenue", req.getRequestURI());
    }

    private ResponseEntity<ApiErrorDTO> build(
            HttpStatus status, String message, String path) {
        return ResponseEntity.status(status).body(ApiErrorDTO.builder()
            .status(status.value()).error(status.getReasonPhrase())
            .message(message).path(path).timestamp(LocalDateTime.now())
            .build());
    }
}