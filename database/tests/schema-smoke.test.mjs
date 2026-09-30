import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../schema.sql');

describe('Database Schema & Integrity Smoke Tests', () => {
  it('should have database/schema.sql file present and non-empty', () => {
    assert.ok(fs.existsSync(schemaPath), 'schema.sql must exist');
    const content = fs.readFileSync(schemaPath, 'utf8');
    assert.ok(content.length > 500, 'schema.sql must contain DDL definitions');
  });

  it('should define users table with unique constraints on username and contact_no', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');
    assert.match(content, /CREATE TABLE IF NOT EXISTS [`"]?users[`"]?/i, 'users table declaration missing');
    assert.match(content, /[`"]?username[`"]?\s+VARCHAR\(50\)\s+NOT NULL\s+UNIQUE/i, 'username unique constraint missing');
    assert.match(content, /[`"]?contact_no[`"]?\s+VARCHAR\(20\)\s+NOT NULL\s+UNIQUE/i, 'contact_no unique constraint missing');
    assert.match(content, /[`"]?password_hash[`"]?\s+VARCHAR\(255\)\s+NOT NULL/i, 'password_hash column missing');
  });

  it('should define chats table with canonical constraint user1_id != user2_id and foreign keys', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');
    assert.match(content, /CREATE TABLE IF NOT EXISTS [`"]?chats[`"]?/i, 'chats table declaration missing');
    assert.match(content, /CHECK\s*\(\s*[`"]?user1_id[`"]?\s*!=\s*[`"]?user2_id[`"]?\s*\)/i, 'Check constraint for user1_id != user2_id missing');
    assert.match(content, /FOREIGN KEY\s*\(\s*[`"]?user1_id[`"]?\s*\)\s*REFERENCES\s*[`"]?users[`"]?/i, 'user1 foreign key missing');
    assert.match(content, /FOREIGN KEY\s*\(\s*[`"]?user2_id[`"]?\s*\)\s*REFERENCES\s*[`"]?users[`"]?/i, 'user2 foreign key missing');
    assert.match(content, /ON DELETE CASCADE/i, 'ON DELETE CASCADE constraint missing');
  });

  it('should define messages table with foreign keys and message status ENUM', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');
    assert.match(content, /CREATE TABLE IF NOT EXISTS [`"]?messages[`"]?/i, 'messages table declaration missing');
    assert.match(content, /FOREIGN KEY\s*\(\s*[`"]?chat_id[`"]?\s*\)\s*REFERENCES\s*[`"]?chats[`"]?/i, 'chat_id foreign key missing');
    assert.match(content, /FOREIGN KEY\s*\(\s*[`"]?sender_id[`"]?\s*\)\s*REFERENCES\s*[`"]?users[`"]?/i, 'sender_id foreign key missing');
    assert.match(content, /ENUM\s*\(\s*'SENT'\s*,\s*'DELIVERED'\s*,\s*'READ'\s*\)/i, 'Message status ENUM definition missing');
  });
});
