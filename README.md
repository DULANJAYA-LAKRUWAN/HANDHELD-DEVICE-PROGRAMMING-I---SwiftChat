# SwiftChat — Real-Time Mobile Chat Application

An academic project for **Handheld Device Programming I**, demonstrating cross-platform mobile development with React Native, a Jakarta EE Java Servlet backend, Hibernate ORM, and MySQL 8 with WebSocket real-time messaging.

---

## Project Structure
```
SwiftChat/
├── frontend/             # React Native (JavaScript + React Navigation v6)
│   ├── src/              # Screens, components, navigation, services, constants, hooks
│   ├── App.js            # Main entry point with SafeAreaProvider & AppNavigator
│   ├── package.json      # Frontend dependencies & scripts
│   └── .env.example      # Frontend environment variables template
│
├── backend/              # Java 17 + Jakarta EE 10 Servlet Backend
│   ├── src/main/java/    # com.swiftchat (entity, dto, servlet, service, repository, websocket)
│   ├── src/main/resources/hibernate.cfg.xml # Hibernate ORM configuration
│   ├── src/main/webapp/WEB-INF/web.xml     # Jakarta EE 10 deployment descriptor
│   └── pom.xml           # Maven build descriptor
│
├── database/             # Database initialization
│   ├── schema.sql        # MySQL 8 table definitions, constraints, indexes
│   └── README.md         # Database setup instructions
│
├── docs/                 # Documentation
│   └── architecture/     # System architecture, ER diagrams, class diagrams
│
├── .env.example          # Root environment configuration template
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## Phase 1 Deliverables
* **Database Schema:** Defined in `database/schema.sql` (Tables: `users`, `chats`, `messages`).
* **Entity Layer:** `User.java`, `Chat.java`, `Message.java`, and `MessageStatus.java` with JPA annotations.
* **Hibernate Config:** `hibernate.cfg.xml` configured for MySQL 8 with safe configuration placeholders.
* **Backend Build:** Maven `pom.xml` configured for Java 17, Jakarta Servlet 6.0, Jakarta WebSocket 2.1, Hibernate 6.4, MySQL Connector 8.3, Gson, and jBCrypt.
* **Frontend Scaffolding:** React Navigation v6 Stack with screen placeholders and design system tokens.

---

## Verification
To compile the backend:
```bash
cd backend
mvn clean compile
```
