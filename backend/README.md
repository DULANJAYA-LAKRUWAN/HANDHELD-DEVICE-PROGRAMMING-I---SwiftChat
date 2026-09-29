# SwiftChat — Backend Architecture

## Overview
* **Architecture:** Java Servlet Architecture (Pure Jakarta EE 10)
* **Target Java Version:** Java 17 (LTS)
* **Target Container:** Apache Tomcat 10.1.x / Jakarta EE 10 compliant Servlet Container
* **ORM:** Hibernate ORM 6.4.x (JPA 3.1)
* **Build System:** Apache Maven 3.9+

## Layering Architecture
```
com.swiftchat/
├── entity/       # Hibernate JPA Entity classes (User, Chat, Message, MessageStatus)
├── dto/          # Data Transfer Objects for JSON payloads (Phase 2)
├── repository/   # Data access logic using Hibernate Session (Phase 2)
├── service/      # Business logic services (Phase 2)
├── servlet/      # REST API Controllers extending HttpServlet (Phase 2)
├── websocket/    # Java WebSocket endpoints for real-time messaging (Phase 2)
├── config/       # App lifecycle listeners and global config (Phase 2)
└── util/         # HibernateUtil and BCrypt PasswordUtil (Phase 2)
```

## Compilation & Build Instructions
Ensure Java 17+ and Maven are installed.

```bash
# Clean and compile
mvn clean compile

# Package WAR file
mvn package
```

The resulting artifact `swiftchat-backend.war` in `target/` can be deployed directly to Tomcat 10.1 `webapps/`.
