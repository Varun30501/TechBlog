package org.blog.controller;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.map(e -> e.getField() + ": " + e.getDefaultMessage())
				.collect(Collectors.joining("; "));
		return response(HttpStatus.BAD_REQUEST, message);
	}

	@ExceptionHandler(NoSuchElementException.class)
	public ResponseEntity<Map<String, String>> handleMissingResource() {
		return response(HttpStatus.NOT_FOUND, "Requested resource was not found.");
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException ex) {
		String message = ex.getConstraintViolations().stream()
				.map(v -> v.getPropertyPath() + ": " + v.getMessage())
				.collect(Collectors.joining("; "));
		return response(HttpStatus.BAD_REQUEST, message);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<Map<String, String>> handleDuplicateOrConstraint() {
		return response(HttpStatus.CONFLICT, "The request conflicts with existing data.");
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<Map<String, String>> handleUploadLimit() {
		return response(HttpStatus.PAYLOAD_TOO_LARGE, "Uploaded file is too large.");
	}

	// ResponseEntity.status().body() factory avoids the unchecked-conversion warning
	// that new ResponseEntity<>(body, HttpStatus) triggers in Spring Framework 6,
	// where the constructor parameter is typed as @NonNull HttpStatusCode.
	private ResponseEntity<Map<String, String>> response(HttpStatus status, String message) {
		return ResponseEntity.status(status)
				.body(Map.of("status", "failed", "message", message));
	}
}