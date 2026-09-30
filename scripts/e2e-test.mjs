/**
 * SwiftChat - Automated End-to-End (E2E) Live Stack Test Suite
 *
 * Exercises the full operational stack:
 * - Tomcat 10.1 (HTTP + REST Servlets)
 * - MySQL 8 (InnoDB persistence, transactions, and foreign keys)
 * - Native Java 17 WebSockets (Full-duplex real-time message delivery & read receipts)
 * - Client REST client & JWT authentication flow
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_HTTP_URL = 'http://localhost:8090/swiftchat-backend';
const BASE_WS_URL = 'ws://localhost:8090/swiftchat-backend/ws/chat';

const timestamp = Date.now();
const userAData = {
  username: `e2e_alice_${timestamp}`,
  password: 'Password123!',
  contactNo: `+9477${Math.floor(1000000 + Math.random() * 9000000)}`,
};
const userBData = {
  username: `e2e_bob_${timestamp}`,
  password: 'Password456!',
  contactNo: `+9471${Math.floor(1000000 + Math.random() * 9000000)}`,
};

let userA = null; // { id, username, contactNo, token }
let userB = null; // { id, username, contactNo, token }
let activeChatId = null;

let wsAlice = null;
let wsBob = null;

describe('SwiftChat Full-Stack End-to-End (E2E) Test Suite', () => {
  // Step 1: Health Check
  it('1. Backend Server Health Check: Verify HTTP connectivity on port 8090', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/users/search?query=healthcheck_probe`);
    assert.strictEqual(res.status, 200, 'Server should respond with 200 OK');
    const body = await res.json();
    assert.strictEqual(body.success, true, 'Response body should indicate success');
  });

  // Step 2: User Registration Flow
  it('2. Account Registration: Provision User A (Alice)', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAData),
    });

    assert.strictEqual(res.status, 201, 'Registration should return 201 Created');
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data && body.data.id, 'User entity should have generated ID');
    assert.strictEqual(body.data.username, userAData.username);
    assert.ok(body.data.token, 'JWT authentication token should be issued');

    userA = body.data;
  });

  it('3. Account Registration: Provision User B (Bob)', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userBData),
    });

    assert.strictEqual(res.status, 201, 'Registration should return 201 Created');
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data && body.data.id);
    assert.strictEqual(body.data.username, userBData.username);
    assert.ok(body.data.token);

    userB = body.data;
  });

  // Step 3: Negative Registration Boundaries
  it('4. Negative Auth: Reject duplicate username with 409 Conflict', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userAData.username,
        password: 'SomeOtherPassword',
        contactNo: `+9470${Math.floor(1000000 + Math.random() * 9000000)}`,
      }),
    });

    assert.strictEqual(res.status, 409, 'Duplicate username must return 409 Conflict');
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  it('5. Negative Auth: Reject empty/missing credentials with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '',
        password: '',
        contactNo: '',
      }),
    });

    assert.strictEqual(res.status, 400, 'Missing fields must return 400 Bad Request');
  });

  // Step 4: Login Authentication
  it('6. Authentication Flow: User A logs in with BCrypt verification', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userAData.username,
        password: userAData.password,
      }),
    });

    assert.strictEqual(res.status, 200, 'Valid login must return 200 OK');
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, userA.id);
    assert.ok(body.data.token, 'Fresh JWT token should be returned');
  });

  it('7. Negative Auth: Reject incorrect password with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userAData.username,
        password: 'CompletelyWrongPassword123',
      }),
    });

    assert.strictEqual(res.status, 401, 'Bad password must return 401 Unauthorized');
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  // Step 5: User Search & Discovery
  it('8. User Discovery: User A searches for User B and self is excluded', async () => {
    const res = await fetch(
      `${BASE_HTTP_URL}/api/users/search?query=${userBData.username}&excludeId=${userA.id}`
    );

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));

    const foundBob = body.data.some((u) => u.id === userB.id);
    const foundAlice = body.data.some((u) => u.id === userA.id);

    assert.ok(foundBob, 'Search results must include target user B');
    assert.ok(!foundAlice, 'Search results must NOT include excluded caller user A');
  });

  // Step 6: User Profile Retrieval & Update
  it('9. User Profile: Retrieve profile and update contact number', async () => {
    // GET Profile with Bearer token
    const getRes = await fetch(`${BASE_HTTP_URL}/api/users/profile?userId=${userA.id}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    });
    assert.strictEqual(getRes.status, 200);
    const getBody = await getRes.json();
    assert.strictEqual(getBody.data.username, userAData.username);

    // Update Profile
    const updatedContact = `+9478${Math.floor(1000000 + Math.random() * 9000000)}`;
    const putRes = await fetch(`${BASE_HTTP_URL}/api/users/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({
        userId: userA.id,
        contactNo: updatedContact,
      }),
    });

    assert.strictEqual(putRes.status, 200);
    const putBody = await putRes.json();
    assert.strictEqual(putBody.success, true);
    assert.strictEqual(putBody.data.contactNo, updatedContact);
  });

  // Step 7: Chat Channel Resolution & Canonical Ordering
  it('10. Chat Provisioning & Canonical Idempotency: Establish 1-on-1 channel', async () => {
    // User A establishes chat with User B
    const res1 = await fetch(`${BASE_HTTP_URL}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiatorId: userA.id, targetId: userB.id }),
    });

    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.strictEqual(body1.success, true);
    assert.ok(body1.data.chatId, 'Channel ID must be created');
    activeChatId = body1.data.chatId;

    // Verify Canonical Participant Ordering: user1_id < user2_id
    const smallerId = Math.min(userA.id, userB.id);
    const largerId = Math.max(userA.id, userB.id);
    assert.strictEqual(body1.data.user1Id, smallerId);
    assert.strictEqual(body1.data.user2Id, largerId);

    // User B establishes chat with User A (swapped order)
    const res2 = await fetch(`${BASE_HTTP_URL}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiatorId: userB.id, targetId: userA.id }),
    });

    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.success, true);
    assert.strictEqual(
      body2.data.chatId,
      activeChatId,
      'Swapped participant roles must resolve to the identical idempotent chatId'
    );
  });

  it('11. Security Boundary: Prevent user from creating chat with themselves', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiatorId: userA.id, targetId: userA.id }),
    });

    assert.strictEqual(res.status, 400, 'Self-chat must be rejected with 400 Bad Request');
  });

  it('12. Conversation List: Verify chat appears in user conversation index', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/chats?userId=${userA.id}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));

    const foundChat = body.data.find((c) => c.chatId === activeChatId);
    assert.ok(foundChat, 'Created chat must be present in conversation list');
    assert.strictEqual(foundChat.otherUser.id, userB.id);
  });

  // Step 8: Real-Time WebSocket Messaging & Live Full-Duplex Delivery
  it('13. Real-Time WebSockets: Connect Alice and Bob duplex sockets', async () => {
    const connectSocket = (userId) => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${BASE_WS_URL}/${userId}`);
        const timeout = setTimeout(() => {
          reject(new Error(`WebSocket connection timeout for user ${userId}`));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          resolve(ws);
        };

        ws.onerror = (err) => {
          clearTimeout(timeout);
          reject(err);
        };
      });
    };

    wsAlice = await connectSocket(userA.id);
    wsBob = await connectSocket(userB.id);

    assert.strictEqual(wsAlice.readyState, WebSocket.OPEN, 'Alice WebSocket must be OPEN');
    assert.strictEqual(wsBob.readyState, WebSocket.OPEN, 'Bob WebSocket must be OPEN');
  });

  it('14. Real-Time Messaging: Alice sends message, Bob receives live, Alice gets echo', async () => {
    const messageText = `E2E Live message at ${new Date().toISOString()}`;

    // Prepare promises for events on both sockets
    const bobReceivedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Bob message receive timeout')), 5000);
      wsBob.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.chatId === activeChatId && data.text === messageText) {
            clearTimeout(timeout);
            resolve(data);
          }
        } catch (e) {
          reject(e);
        }
      };
    });

    const aliceEchoPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Alice echo receive timeout')), 5000);
      wsAlice.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.chatId === activeChatId && data.text === messageText) {
            clearTimeout(timeout);
            resolve(data);
          }
        } catch (e) {
          reject(e);
        }
      };
    });

    // Transmit message from Alice to Bob
    wsAlice.send(
      JSON.stringify({
        chatId: activeChatId,
        senderId: userA.id,
        recipientId: userB.id,
        text: messageText,
      })
    );

    const [bobMsg, aliceEcho] = await Promise.all([bobReceivedPromise, aliceEchoPromise]);

    assert.ok(bobMsg.messageId, 'Message must be assigned a persistent database ID');
    assert.strictEqual(bobMsg.senderId, userA.id);
    assert.strictEqual(bobMsg.recipientId, userB.id);
    assert.strictEqual(bobMsg.text, messageText);
    assert.strictEqual(bobMsg.status, 'SENT');
    assert.ok(bobMsg.timestamp, 'Message must have server timestamp');

    assert.strictEqual(aliceEcho.messageId, bobMsg.messageId, 'Echo ID must match recipient ID');
    assert.strictEqual(aliceEcho.status, 'SENT');
  });

  it('15. Real-Time Read Receipts: Bob sends READ receipt, Alice receives event', async () => {
    const aliceReceiptPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Alice read receipt receive timeout')), 5000);
      wsAlice.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'READ_RECEIPT' && data.chatId === activeChatId) {
            clearTimeout(timeout);
            resolve(data);
          }
        } catch (e) {
          reject(e);
        }
      };
    });

    // Bob sends READ acknowledgement
    wsBob.send(
      JSON.stringify({
        type: 'READ',
        chatId: activeChatId,
        readerId: userB.id,
        recipientId: userA.id,
      })
    );

    const receipt = await aliceReceiptPromise;
    assert.strictEqual(receipt.type, 'READ_RECEIPT');
    assert.strictEqual(receipt.chatId, activeChatId);
    assert.strictEqual(receipt.readerId, userB.id);
  });

  // Step 9: REST Conversation History & Database Status
  it('16. REST Message History: Verify stored message audit and READ status update', async () => {
    const res = await fetch(
      `${BASE_HTTP_URL}/api/chats/messages?chatId=${activeChatId}&userId=${userB.id}`
    );

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1, 'History must contain at least 1 persisted message');

    const lastMsg = body.data[body.data.length - 1];
    assert.strictEqual(lastMsg.senderId, userA.id);
    assert.strictEqual(
      lastMsg.status,
      'READ',
      'Message status in database must be updated to READ after read receipt'
    );
  });

  // Clean-up WebSocket sessions after tests
  after(() => {
    if (wsAlice && wsAlice.readyState === WebSocket.OPEN) {
      wsAlice.close();
    }
    if (wsBob && wsBob.readyState === WebSocket.OPEN) {
      wsBob.close();
    }
  });
});
