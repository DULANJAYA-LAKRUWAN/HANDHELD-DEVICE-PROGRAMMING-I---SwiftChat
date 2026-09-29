import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE_URL } from '../constants/config';
import api from '../services/api';

/**
 * Custom React Hook managing real-time WebSocket communication and REST message history.
 *
 * @param {number|string} chatId - active conversation ID
 * @param {number|string} currentUserId - logged-in user ID
 * @param {number|string} targetUserId - conversation partner ID
 */
export function useChat(chatId, currentUserId, targetUserId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);

  // 1. Fetch past message history via REST API and mark as read
  const loadMessageHistory = useCallback(async () => {
    if (!chatId) return;

    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await api.getChatMessages(chatId, currentUserId);
      if (isMountedRef.current && response && response.data) {
        setMessages(response.data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching chat history:', err);
        setError('Failed to load message history.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingHistory(false);
      }
    }
  }, [chatId, currentUserId]);

  const sendReadReceipt = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && chatId && currentUserId) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'READ',
            chatId: Number(chatId),
            readerId: Number(currentUserId),
            recipientId: Number(targetUserId),
          })
        );
      } catch (err) {
        console.warn('Failed to send read receipt:', err);
      }
    }
  }, [chatId, currentUserId, targetUserId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadMessageHistory();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadMessageHistory]);

  // 2. Establish and manage native WebSocket connection
  useEffect(() => {
    if (!currentUserId) return;

    const socketUrl = `${WS_BASE_URL}/${currentUserId}`;
    console.log(`Connecting to WebSocket: ${socketUrl}`);

    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isMountedRef.current) {
        console.log(`WebSocket connected for user ${currentUserId}`);
        setIsConnected(true);
        setError(null);
        sendReadReceipt();
      }
    };

    ws.onmessage = (event) => {
      try {
        const incomingData = JSON.parse(event.data);

        // Handle Read Receipt: update all outgoing messages to READ status
        if (incomingData && incomingData.type === 'READ_RECEIPT') {
          if (Number(incomingData.chatId) === Number(chatId)) {
            setMessages((prevMessages) =>
              prevMessages.map((m) =>
                Number(m.senderId) === Number(currentUserId)
                  ? { ...m, status: 'READ' }
                  : m
              )
            );
          }
          return;
        }

        // Ensure incoming message belongs to this active chat
        if (incomingData && Number(incomingData.chatId) === Number(chatId)) {
          // If we receive an incoming message from the partner while inside this screen, acknowledge as READ
          if (Number(incomingData.senderId) !== Number(currentUserId)) {
            sendReadReceipt();
            api.markChatAsRead(chatId, currentUserId).catch(() => {});
          }

          setMessages((prevMessages) => {
            // Check for duplicate message (e.g. echo of sent message)
            const exists = prevMessages.some(
              (m) => m.messageId && incomingData.messageId && m.messageId === incomingData.messageId
            );

            if (exists) {
              return prevMessages.map((m) =>
                m.messageId === incomingData.messageId ? incomingData : m
              );
            }

            return [...prevMessages, incomingData];
          });
        }
      } catch (err) {
        console.error('Failed to parse incoming WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('WebSocket encountered error:', err.message || err);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [currentUserId, chatId]);

  // 3. Send text message via open WebSocket
  const sendMessage = useCallback(
    (text) => {
      if (!text || !text.trim()) return false;

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('Cannot send message: WebSocket is not open.');
        return false;
      }

      const payload = {
        chatId: Number(chatId),
        senderId: Number(currentUserId),
        recipientId: Number(targetUserId),
        text: text.trim(),
      };

      try {
        wsRef.current.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.error('Failed to transmit message over WebSocket:', err);
        return false;
      }
    },
    [chatId, currentUserId, targetUserId]
  );

  return {
    messages,
    sendMessage,
    isConnected,
    isLoadingHistory,
    error,
    refreshHistory: loadMessageHistory,
  };
}

export default useChat;
