# SwiftChat — Academic Viva & Defense Technical Cheat Sheet

**Course:** Handheld Device Programming I  
**Subject:** Advanced Mobile Application Development & Distributed Systems  
**Project:** SwiftChat — Real-Time Mobile Chat Application  
**Document Purpose:** Oral Defense Preparation, Architectural Justifications & Technical Rationales

---

## 1. Executive Summary for Project Viva

When presenting **SwiftChat** to an academic evaluation panel, emphasize that the project was not merely assembled using third-party monolithic abstractions (such as Firebase or high-level UI component libraries like GiftedChat). 

Instead, the application demonstrates **foundational software engineering excellence**:
* **Enterprise Distributed Architecture:** Clean 3-tier decoupling (Presentation Layer in React Native, Application/Service Layer in Jakarta EE 10, Data Persistence in MySQL 8).
* **Protocol Diversity:** Hybrid RESTful HTTP for transactional and state queries + Native WebSockets (`ws://`) for full-duplex event streaming.
* **Mathematical Invariance in Relational Modeling:** Canonical participant ordering eliminating duplicate channels.
* **Concurrency & Memory Management:** Thread-safe in-memory session registries and virtualized windowing on mobile devices.

---

## 2. Key Architectural Decisions & Deep-Dive Rationales

### Technical Decision 1: Canonical Ordering of Chat Participants
* **The Problem:** In a private 1-on-1 chat, two users ($U_A$ and $U_B$) can both initiate conversations. A naive relational table with `UNIQUE(user1_id, user2_id)` allows duplicate reciprocal rows (e.g., Row 1: `user1=5, user2=9` and Row 2: `user1=9, user2=5`), causing split chat histories and duplicate channels.
* **The Engineering Solution:**
  1. **Application Layer Invariance:** When finding or creating a chat, `ChatService.java` enforces:
     $$\text{user1\_id} = \min(\text{ID}_A, \text{ID}_B), \quad \text{user2\_id} = \max(\text{ID}_A, \text{ID}_B)$$
  2. **Database Layer Enforcement:** The MySQL schema enforces `CHECK (user1_id < user2_id)` and `UNIQUE KEY uk_chat_users (user1_id, user2_id)`.
* **Academic Significance:** Proves understanding of relational algebra, defense-in-depth, and idempotency. The system guarantees that regardless of who sends the message first, exactly one conversation channel ever exists between any two users.

---

### Technical Decision 2: Thread-Safe Session Management via `ConcurrentHashMap`
* **The Problem:** WebSocket servers handle hundreds of asynchronous, concurrent connection requests (`@OnOpen`, `@OnClose`, `@OnMessage`) dispatched across multiple worker threads. Using a standard `java.util.HashMap` would cause race conditions, deadlocks, or `ConcurrentModificationException`.
* **The Engineering Solution:**
  In `ChatWebSocket.java`, active user sessions are registered using:
  ```java
  private static final Map<Long, Session> activeSessions = new ConcurrentHashMap<>();
  ```
  Synchronized blocks are applied selectively only around I/O transmit operations on the individual user's remote endpoint:
  ```java
  synchronized (recipientSession) {
      recipientSession.getBasicRemote().sendText(outgoingJson);
  }
  ```
* **Academic Significance:** Demonstrates multi-threading competence, lock striping, and thread safety in Java EE without inducing global server bottlenecks.

---

### Technical Decision 3: Stateless DTO Encapsulation vs JPA Entity Leakage
* **The Problem:** Directly serializing Hibernate JPA Entities (`User`, `Chat`, `Message`) to JSON via Gson causes:
  1. **Critical Security Leaks:** Leaking sensitive fields (e.g., `passwordHash`).
  2. **Infinite Recursion / Circular References:** `Chat` references `Message`, and `Message` references `Chat`, crashing the serializer with `StackOverflowError`.
  3. **LazyInitializationException:** Serializing outside active Hibernate transactions triggers runtime failures when attempting to access unloaded relationships.
* **The Engineering Solution:**
  Strict separation through Data Transfer Objects (`UserDTO`, `ChatResponseDTO`, `WebSocketMessageDTO`). Servlets and WebSocket handlers explicitly map entities to immutable DTOs before emitting JSON across the network.
* **Academic Significance:** Demonstrates compliance with the Separation of Concerns (SoC) principle, API contract stability, and defensive security.

---

### Technical Decision 4: Adaptive One-Way Password Hashing via BCrypt
* **The Problem:** Plain-text passwords or obsolete cryptographic algorithms like MD5 / SHA-1 are vulnerable to precomputed rainbow table attacks, collision attacks, and rapid brute-forcing on modern GPUs.
* **The Engineering Solution:**
  Adoption of `jBCrypt` with an adaptive work factor (log rounds = 12):
  ```java
  String salt = BCrypt.gensalt(12);
  String hash = BCrypt.hashpw(plainTextPassword, salt);
  ```
  Authentication relies strictly on `BCrypt.checkpw(candidate, storedHash)`.
* **Academic Significance:** BCrypt is salted automatically to prevent rainbow table exploits and incorporates a cryptographic key derivation function designed to scale with computational advances over time.

---

### Technical Decision 5: WebSocket Full-Duplex Communication vs HTTP Polling
* **The Problem:** Conventional HTTP request-response architectures require the mobile client to repeatedly poll the server (e.g., every 2 seconds) to discover new messages. This wastes mobile battery, floods the server with redundant HTTP headers, and introduces latency equal to the polling interval.
* **The Engineering Solution:**
  * **Persistent TCP Connection:** After a single HTTP handshake (HTTP `101 Switching Protocols`), a persistent WebSocket connection remains open.
  * **Header Overhead Reduction:** WebSocket frames require only 2 to 10 bytes of framing overhead per message compared to 500–1000 bytes per HTTP request header.
  * **Instant Event Dispatching:** The server pushes messages instantaneously to the client the millisecond they are saved to the database.
* **Academic Significance:** Illustrates deep knowledge of networking protocol tradeoffs, mobile battery preservation, and real-time event-driven architectures.

---

### Technical Decision 6: Inverted Virtualized List Optimization in React Native
* **The Problem:** Standard lists in chat applications start at the top, requiring manual `scrollToEnd` animations upon every render. This leads to viewport jitter, layout jumps, and poor performance when rendering large conversation threads.
* **The Engineering Solution:**
  * In `ChatScreen.js`, the React Native `FlatList` uses `inverted={true}` with the data array reversed (`[...messages].reverse()`).
  * Index `0` represents the most recent message anchored at the bottom edge of the viewport.
  * The empty state container incorporates a counteracting transformation (`transform: [{ scaleY: -1 }]`) to ensure proper visual orientation.
* **Academic Significance:** Demonstrates mastery of React Native mobile rendering pipelines, window virtualization, and hardware-accelerated memory conservation.

---

### Technical Decision 7: Stale Closure Mitigation in React Hooks
* **The Problem:** The `WebSocket.onmessage` callback is declared inside a `useEffect` hook. If it references standard state variables (`messages`), it captures a stale snapshot of the array from the initial render, causing subsequent messages to overwrite rather than append past messages.
* **The Engineering Solution:**
  In `useChat.js`, state updates use the functional update pattern:
  ```javascript
  setMessages((prevMessages) => {
      const exists = prevMessages.some((m) => m.messageId === incomingData.messageId);
      if (exists) return prevMessages;
      return [...prevMessages, incomingData];
  });
  ```
  Combined with `useRef` guards for component mount states and message ID deduplication.
* **Academic Significance:** Highlights advanced understanding of React rendering mechanics, closures, and state immutability.

---

## 3. Anticipated Viva / Defense Questions & Model Answers

### Q1: Why did you use pure Jakarta Servlets instead of Spring Boot?
> **Answer:** "Using pure Jakarta EE 10 servlets and Hibernate ORM demonstrates an understanding of the fundamental mechanics of the Java enterprise web tier without relying on the magic of Spring auto-configuration. It showcases explicit request dispatching, manual transaction lifecycle management, session factory construction, and low-level Jakarta WebSocket endpoint lifecycle hooks."

### Q2: Why is unencrypted AsyncStorage acceptable here, and how would you harden it for production?
> **Answer:** "In an academic prototype, AsyncStorage provides a clear demonstration of asynchronous key-value persistence. However, because AsyncStorage stores plaintext data in Android SQLite/XML, for a medical, banking, or commercial application, we would replace it with hardware-backed secure storage such as `react-native-keychain` or `expo-secure-store`, which leverage the Android Keystore system and iOS Keychain."

### Q3: What happens if User B is offline when User A sends a message?
> **Answer:** "When User A sends a message, `ChatWebSocket.java` first persists the message into the MySQL database via `ChatService.processNewMessage` with status `SENT`. It then checks `activeSessions.get(recipientId)`. Because User B is offline, no WebSocket transmission is attempted, but the message is safely stored in the database. When User B opens the application and navigates to the chat, the `useChat` hook calls the REST endpoint `GET /api/chats/messages`, fetching the entire conversation history from the database."

### Q4: How do you prevent cross-user message eavesdropping on the WebSocket?
> **Answer:** "In our architecture, incoming WebSocket messages are validated against the active connection. When a client connects to `@ServerEndpoint('/ws/chat/{userId}')`, their user ID is tied to that specific WebSocket session. When a message payload arrives, the server overrides or verifies the `senderId` against the authenticated session before routing, ensuring users can only dispatch messages as themselves and only route to the recipient identified in the database-verified chat channel."

### Q5: Why was MySQL 8 chosen over MongoDB or NoSQL for this chat app?
> **Answer:** "SwiftChat requires strict transactional consistency (ACID), foreign-key relational integrity, and unique constraints between users and chat rooms. Chat channels, user accounts, and message foreign-key cascades are fundamentally relational structures. MySQL 8 with the InnoDB engine provides reliable referential integrity and check constraints, whereas a NoSQL store would require complex application-level validation to prevent orphan messages or duplicate channels."
