package br.com.salao.service;

public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException() {
        super("Email ja cadastrado");
    }
}
