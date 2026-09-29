# SwiftChat — Database Documentation

## Database Overview
* **RDBMS Engine:** MySQL 8.x (InnoDB engine)
* **Default Charset:** `utf8mb4`
* **Default Collation:** `utf8mb4_unicode_ci`
* **Database Name:** `swiftchat_db`

## Tables Summary

| Table | Description | Primary Key | Foreign Keys |
|---|---|---|---|
| `users` | User credentials, contact info, and registration timestamp | `id` (BIGINT) | None |
| `chats` | 1-to-1 conversation session between two distinct users | `chat_id` (BIGINT) | `user1_id` -> `users(id)`<br>`user2_id` -> `users(id)` |
| `messages` | Individual text messages transmitted inside a chat | `message_id` (BIGINT) | `chat_id` -> `chats(chat_id)`<br>`sender_id` -> `users(id)` |

## Integrity Constraints
1. **Self-chat prevention:** `chats` table has `CHECK (user1_id != user2_id)`.
2. **Participant uniqueness:** `UNIQUE (user1_id, user2_id)` guarantees only one active conversation record per pair.
3. **Message delivery status:** `ENUM('SENT', 'DELIVERED', 'READ')` with default `'SENT'`.
4. **Referential actions:** Foreign keys specify `ON DELETE CASCADE ON UPDATE CASCADE` to prevent orphaned child rows.

## Initialization Instructions

### Windows PowerShell:
```powershell
Get-Content database/schema.sql | mysql -u root -p swiftchat_db
```

### Windows Command Prompt (cmd.exe) / Linux / macOS (Bash):
```bash
mysql -u root -p swiftchat_db < database/schema.sql
```

### Inside MySQL Shell (Workbench / MySQL CLI):
```sql
USE swiftchat_db;
SOURCE database/schema.sql;
```
