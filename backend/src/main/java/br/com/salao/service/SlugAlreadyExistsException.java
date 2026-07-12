package br.com.salao.service;

public class SlugAlreadyExistsException extends RuntimeException {

    public SlugAlreadyExistsException() {
        super("Slug ja cadastrado");
    }
}
