const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all channels
router.get('/channels', async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    
    const result = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
              (SELECT COUNT(*) FROM messages WHERE channel_id = c.id) as message_count
       FROM channels c
       WHERE c.workspace_id = $1
       ORDER BY c.name`,
      [workspaceId || '01234567-89ab-cdef-0123-456789abcdef']
    );
    
    res.json({
      success: true,
      data: result.rows.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isPrivate: c.is_private,
        memberCount: parseInt(c.member_count),
        messageCount: parseInt(c.message_count),
        createdAt: c.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get messages in a channel
router.get('/channels/:channelId/messages', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await db.query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar_url, u.is_online
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.channel_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [channelId, limit, offset]
    );
    
    res.json({
      success: true,
      data: result.rows.reverse().map(m => ({
        id: m.id,
        content: m.content,
        messageType: m.message_type,
        fileUrl: m.file_url,
        fileName: m.file_name,
        isEdited: m.is_edited,
        createdAt: m.created_at,
        sender: m.sender_id ? {
          id: m.sender_id,
          firstName: m.first_name,
          lastName: m.last_name,
          avatarUrl: m.avatar_url,
          isOnline: m.is_online
        } : null
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Send message to channel
router.post('/channels/:channelId/messages', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { content, senderId, messageType, fileUrl, fileName } = req.body;
    
    const result = await db.query(
      `INSERT INTO messages (channel_id, sender_id, content, message_type, file_url, file_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [channelId, senderId, content, messageType || 'text', fileUrl, fileName]
    );
    
    // Get sender info
    const sender = await db.query(
      'SELECT id, first_name, last_name, avatar_url, is_online FROM users WHERE id = $1',
      [senderId]
    );
    
    const message = result.rows[0];
    const senderInfo = sender.rows[0];
    
    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        messageType: message.message_type,
        fileUrl: message.file_url,
        fileName: message.file_name,
        createdAt: message.created_at,
        sender: senderInfo ? {
          id: senderInfo.id,
          firstName: senderInfo.first_name,
          lastName: senderInfo.last_name,
          avatarUrl: senderInfo.avatar_url,
          isOnline: senderInfo.is_online
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create channel
router.post('/channels', async (req, res, next) => {
  try {
    const { name, description, isPrivate, workspaceId, createdBy } = req.body;
    
    const result = await db.query(
      `INSERT INTO channels (workspace_id, name, description, is_private, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workspaceId || '01234567-89ab-cdef-0123-456789abcdef', name, description, isPrivate || false, createdBy]
    );
    
    // Add creator as member
    await db.query(
      'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
      [result.rows[0].id, createdBy]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get direct messages
router.get('/direct/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { withUserId, limit = 50 } = req.query;
    
    const result = await db.query(
      `SELECT dm.*, 
              s.first_name as sender_first_name, s.last_name as sender_last_name, s.avatar_url as sender_avatar,
              r.first_name as receiver_first_name, r.last_name as receiver_last_name, r.avatar_url as receiver_avatar
       FROM direct_messages dm
       LEFT JOIN users s ON dm.sender_id = s.id
       LEFT JOIN users r ON dm.receiver_id = r.id
       WHERE (dm.sender_id = $1 AND dm.receiver_id = $2)
          OR (dm.sender_id = $2 AND dm.receiver_id = $1)
       ORDER BY dm.created_at DESC
       LIMIT $3`,
      [userId, withUserId, limit]
    );
    
    res.json({
      success: true,
      data: result.rows.reverse().map(m => ({
        id: m.id,
        content: m.content,
        messageType: m.message_type,
        fileUrl: m.file_url,
        isRead: m.is_read,
        createdAt: m.created_at,
        sender: {
          id: m.sender_id,
          firstName: m.sender_first_name,
          lastName: m.sender_last_name,
          avatarUrl: m.sender_avatar
        },
        receiver: {
          id: m.receiver_id,
          firstName: m.receiver_first_name,
          lastName: m.receiver_last_name,
          avatarUrl: m.receiver_avatar
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Send direct message
router.post('/direct', async (req, res, next) => {
  try {
    const { senderId, receiverId, content, messageType, fileUrl, fileName } = req.body;
    
    const result = await db.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, content, message_type, file_url, file_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [senderId, receiverId, content, messageType || 'text', fileUrl, fileName]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
