package br.com.salao.security;

import br.com.salao.domain.entity.Role;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final long expirationMs;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMs = expirationMs;
    }

    public String generateToken(UUID userPublicId, UUID tenantPublicId, Role role, String email) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMs);

        Map<String, Object> payload = Map.of(
                "sub", email,
                "userPublicId", userPublicId.toString(),
                "tenantPublicId", tenantPublicId.toString(),
                "role", role.name(),
                "iat", now.getEpochSecond(),
                "exp", expiresAt.getEpochSecond()
        );

        return buildToken(payload);
    }

    public JwtClaims parseToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new InvalidJwtException("Token JWT invalido");
        }

        String signedContent = parts[0] + "." + parts[1];
        if (!verifySignature(signedContent, parts[2])) {
            throw new InvalidJwtException("Assinatura JWT invalida");
        }

        try {
            JsonNode payload = objectMapper.readTree(decodeUrl(parts[1]));
            long exp = payload.get("exp").asLong();
            if (Instant.now().getEpochSecond() >= exp) {
                throw new InvalidJwtException("Token JWT expirado");
            }

            return new JwtClaims(
                    payload.get("sub").asText(),
                    UUID.fromString(payload.get("userPublicId").asText()),
                    UUID.fromString(payload.get("tenantPublicId").asText()),
                    Role.valueOf(payload.get("role").asText())
            );
        } catch (InvalidJwtException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InvalidJwtException("Token JWT invalido");
        }
    }

    private String buildToken(Map<String, Object> payload) {
        try {
            String header = encodeUrl(objectMapper.writeValueAsBytes(Map.of("alg", "HS256", "typ", "JWT")));
            String body = encodeUrl(objectMapper.writeValueAsBytes(payload));
            String signature = sign(header + "." + body);
            return header + "." + body + "." + signature;
        } catch (Exception ex) {
            throw new IllegalStateException("Falha ao gerar token JWT", ex);
        }
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return encodeUrl(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Falha ao assinar token JWT", ex);
        }
    }

    private boolean verifySignature(String content, String signature) {
        return sign(content).equals(signature);
    }

    private static String encodeUrl(byte[] data) {
        return URL_ENCODER.encodeToString(data);
    }

    private static byte[] decodeUrl(String value) {
        return URL_DECODER.decode(value);
    }

    public record JwtClaims(String email, UUID userPublicId, UUID tenantPublicId, Role role) {}
}
