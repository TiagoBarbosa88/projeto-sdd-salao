package br.com.salao.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class MockWhatsAppNotifier implements WhatsAppNotifier {

    private static final Logger log = LoggerFactory.getLogger(MockWhatsAppNotifier.class);

    @Override
    public void sendMessage(String phone, String message) {
        if (phone == null || phone.isBlank()) {
            log.warn("WhatsApp mock: telefone vazio, mensagem nao enviada");
            return;
        }
        log.info("WhatsApp mock -> {}: {}", phone.trim(), message);
    }
}
