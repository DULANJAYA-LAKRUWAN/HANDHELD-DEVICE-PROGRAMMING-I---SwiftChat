# SwiftChat — Quality Assurance & Testing Plan (Verification Checklist)

**Course:** Handheld Device Programming I  
**Project:** SwiftChat — Real-Time Mobile Chat Application  
**Target:** Academic Verification & Defense Demonstration

---

## 1. Overview & Test Objectives

This document provides a systematic manual testing protocol for **SwiftChat**. It is structured to allow students to execute reproducible test scenarios and gather visual evidence (screenshots and video recordings) required for the academic viva and project submission.

### Test Environment Prerequisites
* **Mobile Client:** Android Emulator (API 30+ / Android 11.0+) running Expo Go or Development Build.
* **Backend:** Apache Tomcat 10.1 running `swiftchat-backend.war` on port `8080`.
* **Database:** MySQL 8.0 on `localhost:3306` with `swiftchat_db` schema loaded.
* **Secondary Client:** A second Android Emulator or browser/Postman instance to simulate real-time two-party communication.

---

## 2. Test Execution Matrix

| Test ID | Module / Feature | Priority | Type | Pass / Fail |
|---|---|---|---|---|
| **TC-DB-01** | Database Initialization & Constraints | Critical | Integration | [ ] |
| **TC-AUTH-01** | User Registration (Valid Credentials) | Critical | Functional | [ ] |
| **TC-AUTH-02** | User Registration (Duplicate Username Conflict) | High | Functional / Validation | [ ] |
| **TC-AUTH-03** | User Registration (Duplicate Contact Number) | High | Functional / Validation | [ ] |
| **TC-AUTH-04** | User Login (Valid Credentials & Session Load) | Critical | Functional | [ ] |
| **TC-AUTH-05** | User Login (Invalid Password / Non-existent User) | High | Security / Functional | [ ] |
| **TC-USER-01** | User Search (Directory Query & Filter) | Medium | Functional | [ ] |
| **TC-USER-02** | User Search (Exclusion of Self) | High | Business Logic | [ ] |
| **TC-CHAT-01** | Chat Channel Creation (Canonical Participant Ordering) | Critical | Database / Logic | [ ] |
| **TC-CHAT-02** | Idempotent Chat Creation (Prevent Duplicate Channels) | Critical | Integrity | [ ] |
| **TC-WS-01** | WebSocket Connection & Handshake | Critical | Network / Real-Time | [ ] |
| **TC-WS-02** | Real-Time Bi-Directional Message Transmission | Critical | Real-Time UI | [ ] |
| **TC-WS-03** | Message Persistence & REST History Synchronization | Critical | End-to-End | [ ] |
| **TC-NET-01** | Disconnection & Reconnection UI Resilience | High | Fault Tolerance | [ ] |
| **TC-AUTH-06** | User Logout & Session Invalidation | Medium | Security | [ ] |

---

## 3. Detailed Test Cases

### 3.1 Database & Infrastructure Verification

#### TC-DB-01: Database Initialization & Integrity Constraints
* **Objective:** Verify that `swiftchat_db` tables, indexes, and foreign keys are created with correct constraints.
* **Pre-conditions:** MySQL Server running.
* **Test Steps:**
  1. Open MySQL CLI or MySQL Workbench.
  2. Run: `USE swiftchat_db; SHOW TABLES;`
  3. Run: `DESCRIBE users; DESCRIBE chats; DESCRIBE messages;`
  4. Attempt to insert a chat with identical participant IDs:
     ```sql
     INSERT INTO chats (user1_id, user2_id) VALUES (1, 1);
     ```
* **Expected Result:**
  * Tables `users`, `chats`, and `messages` are present with InnoDB engine.
  * Attempted insert of `user1_id == user2_id` fails with MySQL `CHECK constraint violation (chk_user_order)`.
* **Evidence to Capture:** Screenshot of MySQL console displaying schema structure and the check constraint violation.

---

### 3.2 Authentication & User Management

#### TC-AUTH-01: User Registration (Successful Creation)
* **Objective:** Register a new user and confirm database persistence with BCrypt password hashing.
* **Pre-conditions:** App open on Login screen.
* **Test Steps:**
  1. Tap "Don't have an account? Sign Up".
  2. Enter Username: `alice`.
  3. Enter Contact No: `+94771112233`.
  4. Enter Password: `Password123!`.
  5. Tap "Create Account".
* **Expected Result:**
  * Success alert dialog displays: *"Account created successfully! Please sign in."*
  * User is redirected to Login screen.
  * In database: `SELECT id, username, password_hash, contact_no FROM users WHERE username = 'alice';` reveals an encrypted hash starting with `$2a$`.
* **Evidence to Capture:** App screenshot of success alert + SQL screenshot showing the BCrypt hash.

---

#### TC-AUTH-02: User Registration (Conflict on Duplicate Username)
* **Objective:** Confirm HTTP `409 Conflict` is returned and presented when registering an existing username.
* **Pre-conditions:** User `alice` exists in the database.
* **Test Steps:**
  1. Navigate to Register screen.
  2. Enter Username: `alice`.
  3. Enter Contact No: `+94779998877` (different contact).
  4. Enter Password: `Password123!`.
  5. Tap "Create Account".
* **Expected Result:**
  * App displays error: *"Username is already registered."*
  * HTTP response code is `409 Conflict`.
* **Evidence to Capture:** App screenshot showing the error alert.

---

#### TC-AUTH-03: User Registration (Conflict on Duplicate Contact Number)
* **Objective:** Confirm validation catches duplicate phone numbers.
* **Pre-conditions:** User `alice` with contact `+94771112233` exists.
* **Test Steps:**
  1. Enter Username: `bob`.
  2. Enter Contact No: `+94771112233` (same contact as alice).
  3. Enter Password: `Password123!`.
  4. Tap "Create Account".
* **Expected Result:**
  * App displays error: *"Contact number is already registered."*
* **Evidence to Capture:** App screenshot showing conflict message.

---

#### TC-AUTH-04: User Login (Valid Credentials)
* **Objective:** Authenticate user, store session token in AsyncStorage, and navigate to main chat list.
* **Pre-conditions:** User `alice` registered with password `Password123!`.
* **Test Steps:**
  1. Open Login screen.
  2. Enter Username: `alice`.
  3. Enter Password: `Password123!`.
  4. Tap "Sign In".
* **Expected Result:**
  * Button displays loading indicator.
  * App navigates to `ChatListScreen` with header title "SwiftChat".
  * App remembers session upon reloading (tested via pressing `r` in Expo terminal).
* **Evidence to Capture:** Video or screenshot of login transition into the chat list.

---

#### TC-AUTH-05: User Login (Invalid Password)
* **Objective:** Reject authentication when password does not match BCrypt hash.
* **Pre-conditions:** User `alice` registered.
* **Test Steps:**
  1. Enter Username: `alice`.
  2. Enter Password: `WrongPassword`.
  3. Tap "Sign In".
* **Expected Result:**
  * Error alert: *"Invalid username or password."*
  * HTTP status `401 Unauthorized`.
  * Navigation is blocked.
* **Evidence to Capture:** Screenshot of 401 error message.

---

### 3.3 User Search & Discovery

#### TC-USER-01: User Search Functionality
* **Objective:** Search user directory by partial username or contact number.
* **Pre-conditions:** Users `alice`, `bob`, and `charlie` registered in database. Logged in as `alice`.
* **Test Steps:**
  1. On `ChatListScreen`, tap the floating action button `+`.
  2. On `UserSearchScreen`, type `bob` in search bar.
  3. Observe list updates.
  4. Clear and type `charlie`'s phone number.
* **Expected Result:**
  * Typing triggers debounced search (`GET /api/users/search?q=...`).
  * Matching user card appears with username, avatar initial, and contact number.
* **Evidence to Capture:** Screenshot of UserSearchScreen displaying search results.

---

#### TC-USER-02: Self Exclusion in Search
* **Objective:** Ensure logged-in user cannot search for or chat with themselves.
* **Pre-conditions:** Logged in as `alice`.
* **Test Steps:**
  1. In `UserSearchScreen`, type `alice`.
* **Expected Result:**
  * No search result card for `alice` is returned.
  * Empty state displays: *"No users found matching 'alice'"*.
* **Evidence to Capture:** Screenshot of search result showing self is excluded.

---

### 3.4 Chat Creation & Canonical Ordering

#### TC-CHAT-01: Chat Channel Provisioning & Canonical ID Ordering
* **Objective:** Verify chat creation adheres to canonical rule `user1_id < user2_id`.
* **Pre-conditions:** User `alice` (ID: 1) and User `bob` (ID: 2). Logged in as `bob` (higher ID).
* **Test Steps:**
  1. From `UserSearchScreen`, tap on `alice`.
  2. Inspect backend logs / database:
     ```sql
     SELECT chat_id, user1_id, user2_id FROM chats WHERE chat_id = ...;
     ```
* **Expected Result:**
  * App transitions to `ChatScreen` with title `@alice`.
  * Database record shows: `user1_id = 1` (alice) and `user2_id = 2` (bob), regardless of who initiated the conversation.
* **Evidence to Capture:** SQL screenshot showing `user1_id < user2_id`.

---

#### TC-CHAT-02: Idempotent Chat Creation
* **Objective:** Ensure tapping a user multiple times retrieves existing room without creating duplicate channels.
* **Pre-conditions:** Chat already exists between `alice` and `bob`.
* **Test Steps:**
  1. Log in as `alice`. Search for `bob` and tap to open chat.
  2. Note the `chatId`.
  3. Return to search, tap `bob` again.
  4. Log in as `bob`. Search for `alice` and tap to open chat.
* **Expected Result:**
  * Both users and all taps navigate to the EXACT SAME `chatId`.
  * Database table `chats` contains only 1 row for this pair.
* **Evidence to Capture:** SQL count query showing `COUNT(*) = 1` for this pair.

---

### 3.5 Real-Time WebSocket Communication

#### TC-WS-01: WebSocket Handshake & Session Registration
* **Objective:** Confirm successful WebSocket connection to backend endpoint.
* **Pre-conditions:** Tomcat running with backend deployed.
* **Test Steps:**
  1. Log in to app as `alice` (ID: 1).
  2. Open chat with `bob`.
  3. Inspect Tomcat console logs.
* **Expected Result:**
  * App top bar shows no warning banner (connected).
  * Tomcat server log displays:
    `INFO: WebSocket connected: User 1 (Session ID: ...)`
* **Evidence to Capture:** Server console log snippet showing `@OnOpen` connection.

---

#### TC-WS-02: Full-Duplex Real-Time Messaging Flow
* **Objective:** Send message from Device A and observe instantaneous delivery on Device B without polling or refreshing.
* **Pre-conditions:**
  * Device A running as `alice`.
  * Device B (or browser/Postman WebSocket) running as `bob`.
  * Both users in chat room.
* **Test Steps:**
  1. On Device A (`alice`), type `"Hello Bob, this is a real-time message!"` into input bar.
  2. Tap "Send".
* **Expected Result:**
  * Device A: Message renders immediately on right side in blue bubble with checkmark `✓` and formatted timestamp. Input box clears.
  * Device B: Message appears instantly on left side in dark slate bubble without page refresh.
  * Tomcat log records routing: `Routed message {id} to online recipient 2`.
* **Evidence to Capture:** Side-by-side screenshot or video recording showing both devices updating simultaneously.

---

#### TC-WS-03: Message Persistence & REST History Recovery
* **Objective:** Verify that sent messages persist in MySQL and load via REST when reopening chat.
* **Pre-conditions:** Message sent in TC-WS-02.
* **Test Steps:**
  1. On Device A, exit the chat room back to `ChatListScreen`.
  2. Confirm last message snippet shows `"Hello Bob, this is a real-time message!"`.
  3. Tap chat to re-enter.
* **Expected Result:**
  * While loading, small spinner indicates history retrieval.
  * Entire message history displays in correct chronological order via `GET /api/chats/messages?chatId=...`.
* **Evidence to Capture:** Screenshot of `ChatListScreen` snippet and re-opened `ChatScreen`.

---

### 3.6 Resilience & Session Handling

#### TC-NET-01: WebSocket Disconnection & Visual Indicator
* **Objective:** Verify UI displays reconnection banner when WebSocket connection drops.
* **Pre-conditions:** App open on `ChatScreen`.
* **Test Steps:**
  1. Disable Wi-Fi/Mobile Data on emulator or stop backend server.
  2. Observe `ChatScreen` UI.
  3. Attempt to send a message.
* **Expected Result:**
  * Top warning banner displays: *"Connecting to real-time chat server..."* with an amber indicator.
  * "Send" button is disabled to prevent dropped messages.
* **Evidence to Capture:** Screenshot of the disconnected banner state.

---

#### TC-AUTH-06: User Logout & Session Cleared
* **Objective:** Confirm user session is purged from AsyncStorage and navigation stack resets to Auth.
* **Pre-conditions:** User logged in.
* **Test Steps:**
  1. On `ChatListScreen`, tap "Sign Out" in header.
* **Expected Result:**
  * App navigates immediately to `LoginScreen`.
  * Back button cannot return to authenticated screens.
  * Reloading the app lands on `LoginScreen`.
* **Evidence to Capture:** Screenshot/video of sign out transition.

---

## 4. Evidence Recording Guide for Academic Submission

When compiling your project defense report or portfolio, organize evidence artifacts into the following structure:

```
evidence/
├── 01_database/
│   ├── TC-DB-01_schema_tables.png
│   └── TC-DB-01_check_constraint_violation.png
├── 02_authentication/
│   ├── TC-AUTH-01_registration_success.png
│   ├── TC-AUTH-01_bcrypt_db_hash.png
│   ├── TC-AUTH-02_username_conflict.png
│   ├── TC-AUTH-04_login_success.png
│   └── TC-AUTH-05_invalid_password_error.png
├── 03_discovery/
│   ├── TC-USER-01_search_results.png
│   └── TC-USER-02_self_exclusion.png
├── 04_chat_management/
│   ├── TC-CHAT-01_canonical_ordering_db.png
│   └── TC-CHAT-02_idempotent_room_count.png
├── 05_realtime_websocket/
│   ├── TC-WS-01_tomcat_connection_log.png
│   ├── TC-WS-02_duplex_messaging_side_by_side.mp4 (or side-by-side screenshot)
│   └── TC-WS-03_rest_history_reload.png
└── 06_fault_tolerance/
    ├── TC-NET-01_reconnection_banner.png
    └── TC-AUTH-06_logout_reset.png
```
