package com.ecommerce.exception;

public class DuplicateEmailException extends ConflictException {
    public DuplicateEmailException(String email) { super("An account with this email already exists"); }
}
