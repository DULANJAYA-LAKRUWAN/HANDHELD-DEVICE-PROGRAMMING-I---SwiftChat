# SwiftChat — Real-Time Mobile Chat Application

An academic full-stack mobile computing assessment project developed for **Handheld Device Programming I**.

SwiftChat is a robust, full-duplex real-time messaging application engineered with a **React Native** mobile client, a **Jakarta EE 10 Java Servlet** backend, **Hibernate ORM 6.4**, **MySQL 8**, and bidirectional **Java WebSockets**.

---

## 1. Technology Stack

### Frontend (Mobile Client)
* **Framework:** React Native `0.74.5` (via Expo SDK `~51.0.0`)
* **Language:** JavaScript (ES6+, Functional Components & Hooks)
* **Routing & Navigation:** React Navigation v6 (`@react-navigation/native-stack`)
* **State & Persistence:** React Context API + `@react-native-async-storage/async-storage` (unencrypted local key-value store for session tokens)
* **Real-Time Client:** Standard WebSockets (`window.WebSocket` API)
* **Networking:** Fetch API with centralized REST client

### Backend (Server Layer)
* **Runtime:** Java 17 LTS
* **Platform:** Jakarta EE 10 (Servlet 6.0, WebSocket 2.1)
* **Container / Web Server:** Apache Tomcat 10.1.x
* **ORM / Persistence:** Hibernate ORM 6.4.4.Final (Jakarta Persistence 3.1)
* **JSON Serialization:** Google Gson 2.10.1
* **Security & Cryptography:** jBCrypt 0.4 (Salter & Blowfish hashing)
* **Build System:** Apache Maven 3.8+

### Database Layer
* **RDBMS:** MySQL 8.0+
* **Storage Engine:** InnoDB
* **Driver:** MySQL Connector/J 8.3.0
* **Data Integrity:** Strict Foreign Keys with `ON DELETE CASCADE`, Check Constraints (`CHECK (user1_id != user2_id)`), and Canonical Participant Ordering

---

## 2. Core Features Implemented

* **User Authentication & Session Management:**
  * Secure user registration with unique username and contact number validation.
  * BCrypt-hashed password verification on login.
  * Client-side session persistence via AsyncStorage and AuthContext.
* **User Discovery & Search:**
  * Real-time search by username or phone number with debounce.
  * Exclusion of self from search results.
* **1-on-1 Chat Channel Provisioning:**
  * Automated channel resolution via canonical participant ordering (`min(u1, u2)`, `max(u1, u2)`).
  * Idempotent chat creation (retrieves existing room or provisions new channel).
* **Live Full-Duplex Real-Time Messaging:**
  * Bi-directional communication through native Jakarta WebSocket `@ServerEndpoint("/ws/chat/{userId}")`.
  * Instant delivery to active online recipients.
  * Automatic DB persistence for offline receipt and audit history.
  * Real-time sender echo confirmation with generated database IDs.
* **REST-Based Message History:**
  * Chronological conversation history loading on room entry.
  * Message status tracking (`SENT`, `DELIVERED`, `READ`).
* **Modern Mobile Chat UI:**
  * Inverted `FlatList` layout mirroring industry standards (WhatsApp/Telegram).
  * Distinct incoming and outgoing message bubbles with dynamic timestamps and checkmarks.
  * Keyboard avoidance (`KeyboardAvoidingView`) for seamless typing on both iOS and Android.
  * Live connection status badges and auto-reconnection indicators.

---

## 3. System Architecture & Communication Flow

SwiftChat implements a decoupled 3-tier client-server architecture separating presentation, business logic, and transactional persistence:

```
+---------------------------------------------------------------------------------+
|                          MOBILE CLIENT (React Native)                           |
|                                                                                 |
|   +-----------------------+     +--------------------+     +----------------+   |
|   | Auth / Screen Views   |     | useChat Hook       |     |  AuthContext   |   |
|   +-----------+-----------+     +---------+----------+     +--------+-------+   |
|               |                           |                         |           |
+---------------|---------------------------|-------------------------|-----------+
                | HTTP / REST               | WebSocket (ws://)       |
                | (JSON Payloads)           | (Bi-directional DTOs)   |
+---------------v---------------------------v-------------------------v-----------+
|                          BACKEND (Jakarta EE 10 / Tomcat 10)                    |
|                                                                                 |
|   +-----------------------+     +--------------------+     +----------------+   |
|   |   Jakarta Servlets    |     |   ChatWebSocket    |     |  Auth / Chat   |   |
|   |   (Login, Register,   |     |  (@ServerEndpoint) |     |    Services    |   |
|   |    Search, Chats)     |     | ConcurrentHashMap  |     |                |   |
|   +-----------+-----------+     +---------+----------+     +--------+-------+   |
|               |                           |                         |           |
|               +---------------------------+-------------------------+           |
|                                           |                                     |
|                              +------------v-----------+                         |
|                              | Hibernate 6.4 (ORM)    |                         |
|                              | SessionFactory / DAOs  |                         |
|                              +------------+-----------+                         |
+-------------------------------------------|-------------------------------------+
                                            | JDBC Driver (MySQL Connector/J 8.3)
+-------------------------------------------v-------------------------------------+
|                         DATABASE LAYER (MySQL 8 - InnoDB)                       |
|                                                                                 |
|         [users] <================> [chats] <================> [messages]        |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

### Protocol Breakdown:
1. **REST APIs (HTTP/1.1 JSON):**
   * `POST /api/auth/register` — Registers new account.
   * `POST /api/auth/login` — Authenticates credentials against BCrypt hashes.
   * `GET  /api/users/search?q={query}` — Searches directory.
   * `POST /api/chats` — Resolves/Creates private 1-on-1 chat room.
   * `GET  /api/chats?userId={userId}` — Lists active user chats.
   * `GET  /api/chats/messages?chatId={chatId}` — Fetches conversation history.
2. **WebSocket Channel (`ws://`):**
   * Endpoint: `ws://10.0.2.2:8080/swiftchat-backend/ws/chat/{userId}`
   * Client opens dedicated duplex socket upon authentication.
   * Transmits and receives serialized `WebSocketMessageDTO` JSON objects.

---

## 4. Project Directory Structure

```
SwiftChat/
├── frontend/                               # React Native Mobile Application
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatBubble.js              # Incoming/Outgoing message bubble UI
│   │   ├── constants/
│   │   │   └── config.js                  # Android emulator IP & WebSocket URIs
│   │   ├── context/
│   │   │   └── AuthContext.js             # Session state & AsyncStorage manager
│   │   ├── hooks/
│   │   │   └── useChat.js                 # WebSocket & chat history React hook
│   │   ├── navigation/
│   │   │   └── AppNavigator.js            # Auth & Main navigation stacks
│   │   ├── screens/
│   │   │   ├── LoginScreen.js             # Account login
│   │   │   ├── RegisterScreen.js          # Account registration
│   │   │   ├── ChatListScreen.js          # Active conversation list & FAB
│   │   │   ├── UserSearchScreen.js        # User directory search
│   │   │   └── ChatScreen.js              # Live real-time messaging screen
│   │   └── utils/
│   │       └── formatDate.js             # Timestamp formatters
│   ├── App.js                             # App root entry point
│   └── package.json                       # Dependencies & Expo config
│
├── backend/                                # Jakarta EE 10 Java Servlet Backend
│   ├── src/main/java/com/swiftchat/
│   │   ├── dao/                           # Hibernate Data Access Objects
│   │   │   ├── UserDao.java
│   │   │   ├── ChatDao.java
│   │   │   └── MessageDao.java
│   │   ├── dto/                           # Data Transfer Objects (No JPA leak)
│   │   │   ├── ApiResponseDTO.java
│   │   │   ├── LoginRequestDTO.java
│   │   │   ├── RegisterRequestDTO.java
│   │   │   ├── UserDTO.java
│   │   │   ├── ChatResponseDTO.java
│   │   │   └── WebSocketMessageDTO.java
│   │   ├── entity/                        # JPA Entities (Hibernate ORM)
│   │   │   ├── User.java
│   │   │   ├── Chat.java
│   │   │   ├── Message.java
│   │   │   └── MessageStatus.java
│   │   ├── filter/                        # HTTP Filters
│   │   │   └── CorsFilter.java            # CORS preflight & header filter
│   │   ├── service/                       # Business & Authentication Services
│   │   │   ├── AuthService.java
│   │   │   └── ChatService.java
│   │   ├── servlet/                       # Jakarta HTTP Endpoints
│   │   │   ├── LoginServlet.java
│   │   │   ├── RegisterServlet.java
│   │   │   ├── UserSearchServlet.java
│   │   │   ├── ChatServlet.java
│   │   │   └── ChatHistoryServlet.java
│   │   ├── util/                          # Hibernate SessionFactory Builder
│   │   │   └── HibernateUtil.java
│   │   └── websocket/                     # Jakarta WebSocket Endpoint
│   │       └── ChatWebSocket.java
│   ├── src/main/resources/
│   │   └── hibernate.cfg.xml              # Database mapping configuration
│   ├── src/main/webapp/WEB-INF/
│   │   └── web.xml                        # Jakarta Servlet deployment descriptor
│   └── pom.xml                            # Maven dependencies & build descriptor
│
├── database/                               # Database Scripts
│   ├── schema.sql                         # MySQL 8 DDL & Integrity Constraints
│   └── README.md                          # Database setup & credentials guide
│
├── docs/                                   # Documentation & Academic Deliverables
│   ├── architecture/
│   │   └── ARCHITECTURE.md                # System Architecture & Design decisions
│   ├── TESTING.md                         # Structured manual testing checklist
│   └── ACADEMIC_NOTES.md                  # Viva / Presentation technical cheat sheet
│
├── .gitignore
└── README.md
```

---

## 5. Setup & Installation Guide

### Prerequisites
1. **Java Development Kit (JDK):** Version 17 LTS installed (`java -version`).
2. **Build Tool:** Apache Maven 3.8+ (`mvn -version`).
3. **Database:** MySQL Server 8.0+ running on `localhost:3306`.
4. **Servlet Container:** Apache Tomcat 10.1.x (targeting Jakarta EE 10).
5. **Mobile Environment:** Node.js 18+, npm/yarn, and Expo CLI or Android Studio (for Android Emulator).

---

### Step 1: Database Setup
1. Log in to your MySQL terminal or GUI (MySQL Workbench):
   ```sql
   CREATE DATABASE swiftchat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Execute the initialization schema:
   * **Windows PowerShell:**
     ```powershell
     Get-Content database/schema.sql | mysql -u root -p swiftchat_db
     ```
   * **Windows Command Prompt (cmd.exe):**
     ```cmd
     mysql -u root -p swiftchat_db < database/schema.sql
     ```
   * **Linux / macOS (Bash/Zsh):**
     ```bash
     mysql -u root -p swiftchat_db < database/schema.sql
     ```
   * **Inside MySQL Interactive Shell:**
     ```sql
     USE swiftchat_db;
     SOURCE database/schema.sql;
     ```
3. Set your database credentials as environment variables (or configure them in `hibernate.cfg.xml`):
   * **Windows PowerShell:**
     ```powershell
     $env:DB_USER="root"
     $env:DB_PASSWORD="your_password"
     ```
   * **Windows Command Prompt:**
     ```cmd
     set DB_USER=root
     set DB_PASSWORD=your_password
     ```
   * **Linux / macOS:**
     ```bash
     export DB_USER="root"
     export DB_PASSWORD="your_password"
     ```

---

### Step 2: Backend Compilation & Deployment
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the `.war` deployment archive:
   ```bash
   mvn clean package
   ```
3. Deploy the resulting archive `target/swiftchat-backend.war` to Apache Tomcat:
   * Copy `swiftchat-backend.war` to `$CATALINA_HOME/webapps/`.
   * Start Tomcat:
     ```bash
     # Windows
     %CATALINA_HOME%\bin\startup.bat

     # Linux / macOS
     $CATALINA_HOME/bin/startup.sh
     ```
4. Verify backend health by checking:
   ```
   http://localhost:8080/swiftchat-backend/api/users/search?q=test
   ```

---

### Step 3: Frontend Installation & Launch
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure the network address in `frontend/src/constants/config.js`:
   * **Android Emulator:** Uses `http://10.0.2.2:8080/swiftchat-backend` (Default).
   * **Physical Device:** Replace `10.0.2.2` with your development computer's local LAN IP (e.g., `192.168.1.50`).
4. Start Metro bundler:
   ```bash
   npx expo start
   ```
5. Press `a` in the terminal to launch the app on the running Android Emulator.

---

## 6. Academic Assessment Information
* **Course:** Handheld Device Programming I
* **Module Code:** HHDP1 / Mobile Application Development
* **Institution:** Java Institute for Advanced Technology (JIAT)
* **Author / Candidate:** Dulanjaya Lakruwan
