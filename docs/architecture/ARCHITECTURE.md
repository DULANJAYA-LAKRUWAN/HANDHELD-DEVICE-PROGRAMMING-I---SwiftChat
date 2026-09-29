# SwiftChat — System Architecture & Design Documentation (Phase 1)

**Course:** Handheld Device Programming I  
**Project:** SwiftChat — Real-Time Mobile Chat Application  
**Architectural Stage:** Phase 1 (Foundation, Schema, and Entity Models)

---

## 1. System Architecture Overview

SwiftChat is built on a 3-tier distributed client-server architecture:

```
+--------------------------------------------------------------+
|                    Client Layer (Mobile App)                 |
|             React Native + React Navigation v6               |
|      - Fetch API (REST Authentication & History)             |
|      - Native WebSocket API (Live Real-Time Messaging)       |
+------------------------------+-------------------------------+
                               |
                   HTTP / REST | WebSocket (ws://)
                               |
+------------------------------v-------------------------------+
|                    Server Layer (Backend)                    |
|             Jakarta EE 10 / Java 17 / Apache Tomcat          |
|      - Java Servlets (Auth, Chat Sessions, Contacts)         |
|      - Jakarta WebSocket ServerEndpoint (Live Messaging)     |
|      - Hibernate ORM 6.4 (Jakarta Persistence 3.1)           |
|      - BCrypt Password Hashing (jBCrypt)                     |
+------------------------------+-------------------------------+
                               |
                               | JDBC Driver (MySQL Connector/J 8.x)
                               |
+------------------------------v-------------------------------+
|                    Database Layer (MySQL 8)                  |
|                 Database: swiftchat_db (InnoDB)              |
|      - Tables: users, chats, messages                        |
|      - Referential Integrity, Check Constraints, Indexes     |
+--------------------------------------------------------------+
```

---

## 2. Compatibility Decision: Pure Jakarta EE 10 Ecosystem

### Decision
**Adopt pure Jakarta EE 10 (`jakarta.*`) throughout the entire backend.**

### Technical Rationale
1. **Java 17 & Hibernate 6.x Requirement:** Modern Hibernate ORM 6.x is designed specifically for Java 17+ and strictly mandates the `jakarta.persistence` namespace (JPA 3.0/3.1). The older `javax.persistence` namespace was completely dropped in Hibernate 6.
2. **Elimination of Namespace Collisions:** Mixing `javax.websocket` with `jakarta.servlet` or `jakarta.persistence` on modern application servers (such as Apache Tomcat 10.1) results in `ClassNotFoundException`, `IncompatibleClassChangeError`, or server startup rejections.
3. **Application Server Alignment:** Apache Tomcat 10.1.x targets Jakarta EE 10 natively, providing runtime support for `jakarta.servlet` 6.0 and `jakarta.websocket` 2.1.
4. **Consistency:** All dependencies in `pom.xml` adhere strictly to the unified Jakarta EE namespace.

---

## 3. Database Schema & Entity-Relationship (ER) Design

### Tables Summary
* **`users`**: Unique identification of registered users (`id`, `username`, `password_hash`, `contact_no`, `created_at`).
* **`chats`**: Unique 1-on-1 private channels between two users (`chat_id`, `user1_id`, `user2_id`, `created_at`).
* **`messages`**: Individual text messages with state tracking (`message_id`, `chat_id`, `sender_id`, `text`, `timestamp`, `status`).

### Mermaid ER Diagram
```mermaid
erDiagram
    users ||--o{ chats : "participates (as user1)"
    users ||--o{ chats : "participates (as user2)"
    users ||--o{ messages : "sends"
    chats ||--o{ messages : "contains"

    users {
        BIGINT id PK
        VARCHAR username UK
        VARCHAR password_hash
        VARCHAR contact_no UK
        TIMESTAMP created_at
    }

    chats {
        BIGINT chat_id PK
        BIGINT user1_id FK
        BIGINT user2_id FK
        TIMESTAMP created_at
    }

    messages {
        BIGINT message_id PK
        BIGINT chat_id FK
        BIGINT sender_id FK
        TEXT text
        TIMESTAMP timestamp
        ENUM status "SENT, DELIVERED, READ"
    }
```

---

## 4. Entity Class Model

```mermaid
classDiagram
    class User {
        -Long id
        -String username
        -String passwordHash
        -String contactNo
        -Date createdAt
        +getId() Long
        +getUsername() String
        +getPasswordHash() String
        +getContactNo() String
        +getCreatedAt() Date
    }

    class Chat {
        -Long chatId
        -User user1
        -User user2
        -Date createdAt
        +getChatId() Long
        +getUser1() User
        +getUser2() User
        +getCreatedAt() Date
    }

    class Message {
        -Long messageId
        -Chat chat
        -User sender
        -String text
        -Date timestamp
        -MessageStatus status
        +getMessageId() Long
        +getChat() Chat
        +getSender() User
        +getText() String
        +getTimestamp() Date
        +getStatus() MessageStatus
    }

    class MessageStatus {
        <<enumeration>>
        SENT
        DELIVERED
        READ
    }

    Chat --> User : user1 (@ManyToOne)
    Chat --> User : user2 (@ManyToOne)
    Message --> Chat : chat (@ManyToOne)
    Message --> User : sender (@ManyToOne)
    Message --> MessageStatus : status (@Enumerated)
```

---

## 5. Security & Configuration Safety
* Real credentials are never committed.
* `.env.example` provides template variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
* `hibernate.cfg.xml` utilizes parameter placeholders with safe local defaults.
* In Phase 2, passwords will be hashed with standard BCrypt (`jBCrypt`).
