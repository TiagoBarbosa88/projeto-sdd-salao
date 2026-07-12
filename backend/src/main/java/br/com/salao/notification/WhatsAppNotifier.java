package br.com.salao.notification;

public interface WhatsAppNotifier {

    void sendMessage(String phone, String message);
}
