package com.swiftchat.dto;

import com.google.gson.Gson;
import com.swiftchat.entity.MessageStatus;
import com.swiftchat.entity.User;
import com.swiftchat.util.GsonProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("DTO Serialization and Deserialization Smoke Tests")
class DtoSmokeTest {

    private final Gson gson = GsonProvider.getGson();

    @Test
    @DisplayName("ApiResponseDTO success and error factory methods and JSON serialization")
    void testApiResponseDTO() {
        ApiResponseDTO<String> successResponse = ApiResponseDTO.success("Operation completed.", "sample_payload");
        assertTrue(successResponse.isSuccess());
        assertEquals("Operation completed.", successResponse.getMessage());
        assertEquals("sample_payload", successResponse.getData());

        String json = gson.toJson(successResponse);
        assertTrue(json.contains("\"success\":true"));
        assertTrue(json.contains("\"message\":\"Operation completed.\""));

        ApiResponseDTO<?> errorResponse = ApiResponseDTO.error("Invalid input provided.");
        assertFalse(errorResponse.isSuccess());
        assertEquals("Invalid input provided.", errorResponse.getMessage());
        assertNull(errorResponse.getData());
    }

    @Test
    @DisplayName("UserDTO creation from entity and token attachment")
    void testUserDTO() {
        User user = new User("alice", "hashed", "0771112233");
        user.setId(5L);
        user.setCreatedAt(new Date());

        UserDTO dto = UserDTO.fromEntity(user);
        assertNotNull(dto);
        assertEquals(5L, dto.getId());
        assertEquals("alice", dto.getUsername());
        assertEquals("0771112233", dto.getContactNo());

        dto.setToken("sample.jwt.token");
        assertEquals("sample.jwt.token", dto.getToken());

        String json = gson.toJson(dto);
        assertTrue(json.contains("\"username\":\"alice\""));
        assertTrue(json.contains("\"token\":\"sample.jwt.token\""));
    }

    @Test
    @DisplayName("WebSocketMessageDTO serialization with status and timestamps")
    void testWebSocketMessageDTO() {
        Date now = new Date();
        WebSocketMessageDTO msg = new WebSocketMessageDTO(
                501L, 10L, 1L, 2L, "Hello Bob!", now, MessageStatus.SENT
        );

        assertEquals(501L, msg.getMessageId());
        assertEquals(10L, msg.getChatId());
        assertEquals(1L, msg.getSenderId());
        assertEquals(2L, msg.getRecipientId());
        assertEquals("Hello Bob!", msg.getText());
        assertEquals(MessageStatus.SENT, msg.getStatus());

        String json = gson.toJson(msg);
        WebSocketMessageDTO deserialized = gson.fromJson(json, WebSocketMessageDTO.class);

        assertEquals(msg.getMessageId(), deserialized.getMessageId());
        assertEquals(msg.getChatId(), deserialized.getChatId());
        assertEquals(msg.getText(), deserialized.getText());
        assertEquals(msg.getStatus(), deserialized.getStatus());
    }

    @Test
    @DisplayName("LoginRequestDTO and RegisterRequestDTO JSON binding")
    void testRequestDTOs() {
        String loginJson = "{\"username\":\"john_doe\",\"password\":\"Password123\"}";
        LoginRequestDTO loginDTO = gson.fromJson(loginJson, LoginRequestDTO.class);
        assertEquals("john_doe", loginDTO.getUsername());
        assertEquals("Password123", loginDTO.getPassword());

        String registerJson = "{\"username\":\"jane_doe\",\"password\":\"SecurePass\",\"contactNo\":\"+94779998877\"}";
        RegisterRequestDTO regDTO = gson.fromJson(registerJson, RegisterRequestDTO.class);
        assertEquals("jane_doe", regDTO.getUsername());
        assertEquals("SecurePass", regDTO.getPassword());
        assertEquals("+94779998877", regDTO.getContactNo());
    }
}
