package br.com.salao.config;

import br.com.salao.web.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("VALIDATION_ERROR", "Dados invalidos"));
    }

    @ExceptionHandler(br.com.salao.service.EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("EMAIL_ALREADY_EXISTS", "Email ja cadastrado"));
    }

    @ExceptionHandler(br.com.salao.service.SlugAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleSlugAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("SLUG_ALREADY_EXISTS", "Slug ja cadastrado"));
    }

    @ExceptionHandler(br.com.salao.service.InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("INVALID_CREDENTIALS", "Credenciais invalidas"));
    }

    @ExceptionHandler(br.com.salao.service.ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Recurso nao encontrado"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleSpringAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("ACCESS_DENIED", "Acesso negado"));
    }

    @ExceptionHandler(br.com.salao.service.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("ACCESS_DENIED", "Acesso negado"));
    }

    @ExceptionHandler(br.com.salao.service.AppointmentConflictException.class)
    public ResponseEntity<ErrorResponse> handleAppointmentConflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("APPOINTMENT_CONFLICT", "Conflito de agenda"));
    }

    @ExceptionHandler(br.com.salao.service.InactiveServiceException.class)
    public ResponseEntity<ErrorResponse> handleInactiveService() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("INACTIVE_SERVICE", "Servico inativo"));
    }

    @ExceptionHandler(br.com.salao.service.SlotUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleSlotUnavailable() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("SLOT_UNAVAILABLE", "Horario indisponivel"));
    }

    @ExceptionHandler(br.com.salao.service.InvalidScheduleException.class)
    public ResponseEntity<ErrorResponse> handleInvalidSchedule() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("INVALID_SCHEDULE", "Configuracao de agenda invalida"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("INTERNAL_ERROR", "Erro interno"));
    }
}
