package br.com.salao.notification;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;

class MockWhatsAppNotifierTest {

    @Test
    void sendsMessageWithoutError() {
        MockWhatsAppNotifier notifier = new MockWhatsAppNotifier();

        assertThatCode(() -> notifier.sendMessage("(11) 99999-9999", "Teste de confirmacao"))
                .doesNotThrowAnyException();
    }

    @Test
    void ignoresBlankPhone() {
        MockWhatsAppNotifier notifier = new MockWhatsAppNotifier();

        assertThatCode(() -> notifier.sendMessage("  ", "Teste"))
                .doesNotThrowAnyException();
    }
}
