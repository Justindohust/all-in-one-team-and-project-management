const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all meetings
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, status, organizerId } = req.query;
    
    let query = `
      SELECT m.*, 
             u.first_name as organizer_first_name, u.last_name as organizer_last_name
      FROM meetings m
      LEFT JOIN users u ON m.organizer_id = u.id
      WHERE m.workspace_id = $1
    `;
    const params = ['01234567-89ab-cdef-0123-456789abcdef'];
    
    if (startDate) {
      params.push(startDate);
      query += ` AND m.start_time >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND m.end_time <= $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND m.status = $${params.length}`;
    }
    
    if (organizerId) {
      params.push(organizerId);
      query += ` AND m.organizer_id = $${params.length}`;
    }
    
    query += ' ORDER BY m.start_time';
    
    const result = await db.query(query, params);
    
    // Get participants for each meeting
    const meetings = await Promise.all(result.rows.map(async (meeting) => {
      const participantsResult = await db.query(
        'SELECT u.id, u.first_name, u.last_name, u.email FROM meeting_participants mp JOIN users u ON mp.user_id = u.id WHERE mp.meeting_id = $1',
        [meeting.id]
      );
      
      const notifieesResult = await db.query(
        'SELECT u.id, u.first_name, u.last_name, u.email FROM meeting_notifiees mn JOIN users u ON mn.user_id = u.id WHERE mn.meeting_id = $1',
        [meeting.id]
      );
      
      return {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        location: meeting.location,
        isRecurring: meeting.is_recurring,
        recurrencePattern: meeting.recurrence_pattern,
        recurrenceEndDate: meeting.recurrence_end_date,
        status: meeting.status,
        minutes: meeting.minutes,
        organizerId: meeting.organizer_id,
        organizer: meeting.organizer_first_name ? {
          firstName: meeting.organizer_first_name,
          lastName: meeting.organizer_last_name
        } : null,
        participants: participantsResult.rows.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email
        })),
        notifiees: notifieesResult.rows.map(n => ({
          id: n.id,
          name: `${n.first_name} ${n.last_name}`,
          email: n.email
        }))
      };
    }));
    
    res.json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
});

// Get single meeting
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT m.*, 
              u.first_name as organizer_first_name, u.last_name as organizer_last_name
       FROM meetings m
       LEFT JOIN users u ON m.organizer_id = u.id
       WHERE m.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    const meeting = result.rows[0];
    
    // Get participants
    const participantsResult = await db.query(
      'SELECT u.id, u.first_name, u.last_name, u.email FROM meeting_participants mp JOIN users u ON mp.user_id = u.id WHERE mp.meeting_id = $1',
      [id]
    );
    
    // Get notifiees
    const notifieesResult = await db.query(
      'SELECT u.id, u.first_name, u.last_name, u.email FROM meeting_notifiees mn JOIN users u ON mn.user_id = u.id WHERE mn.meeting_id = $1',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        location: meeting.location,
        isRecurring: meeting.is_recurring,
        recurrencePattern: meeting.recurrence_pattern,
        recurrenceEndDate: meeting.recurrence_end_date,
        status: meeting.status,
        minutes: meeting.minutes,
        organizerId: meeting.organizer_id,
        organizer: meeting.organizer_first_name ? {
          firstName: meeting.organizer_first_name,
          lastName: meeting.organizer_last_name
        } : null,
        participants: participantsResult.rows.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email
        })),
        notifiees: notifieesResult.rows.map(n => ({
          id: n.id,
          name: `${n.first_name} ${n.last_name}`,
          email: n.email
        }))
      }
    });
  }catch (error) {
    next(error);
  }
});

// Create meeting
router.post('/', async (req, res, next) => {
  try {
    const { 
      title, description, startTime, endTime, location, 
      isRecurring, recurrencePattern, recurrenceEndDate, 
      status, participants, notifiees, workspaceId, organizerId 
    }= req.body;
    
    const result = await db.query(
      `INSERT INTO meetings (workspace_id, organizer_id, title, description, start_time, end_time, location, is_recurring, recurrence_pattern, recurrence_end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        workspaceId || '01234567-89ab-cdef-0123-456789abcdef',
        organizerId,
        title,
        description,
        startTime,
        endTime,
        location,
        isRecurring || false,
        recurrencePattern,
        recurrenceEndDate,
        status || 'scheduled'
      ]
    );
    
    const meetingId = result.rows[0].id;
    
    // Add participants
    if (participants && participants.length > 0) {
      for (const participantId of participants) {
        await db.query(
          'INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2)',
          [meetingId, participantId]
        );
      }
    }
    
    // Add notifiees
    if (notifiees && notifiees.length > 0) {
      for (const notifieeId of notifiees) {
        await db.query(
          'INSERT INTO meeting_notifiees (meeting_id, user_id) VALUES ($1, $2)',
          [meetingId, notifieeId]
        );
      }
    }
    
    res.status(201).json({ success: true, data: { id: meetingId, ...result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

// Update meeting
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      title, description, startTime, endTime, location, 
      isRecurring, recurrencePattern, recurrenceEndDate, 
      status, minutes, participants, notifiees 
    } = req.body;
    
    const result = await db.query(
      `UPDATE meetings 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           location = COALESCE($5, location),
           is_recurring = COALESCE($6, is_recurring),
           recurrence_pattern = COALESCE($7, recurrence_pattern),
           recurrence_end_date = COALESCE($8, recurrence_end_date),
           status = COALESCE($9, status),
           minutes = COALESCE($10, minutes)
       WHERE id = $11
       RETURNING *`,
      [title, description, startTime, endTime, location, isRecurring, recurrencePattern, recurrenceEndDate, status, minutes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    // Update participants if provided
    if (participants !== undefined) {
      await db.query('DELETE FROM meeting_participants WHERE meeting_id = $1', [id]);
      for (const participantId of participants) {
        await db.query(
          'INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2)',
          [id, participantId.id || participantId]
        );
      }
    }
    
    // Update notifiees if provided
    if (notifiees !== undefined) {
      await db.query('DELETE FROM meeting_notifiees WHERE meeting_id = $1', [id]);
      for (const notifieeId of notifiees) {
        await db.query(
          'INSERT INTO meeting_notifiees (meeting_id, user_id) VALUES ($1, $2)',
          [id, notifieeId.id || notifieeId]
        );
      }
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete meeting
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete participants and notifiees first
    await db.query('DELETE FROM meeting_participants WHERE meeting_id = $1', [id]);
    await db.query('DELETE FROM meeting_notifiees WHERE meeting_id = $1', [id]);
    
    const result = await db.query('DELETE FROM meetings WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Send meeting minutes
router.post('/:id/minutes/send', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get meeting with notifiees
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1', [id]);
    
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    const meeting = meetingResult.rows[0];
    
    if (!meeting.minutes) {
      return res.status(400).json({ success: false, message: 'No meeting minutes to send' });
    }
    
    // Get notifiees
    const notifieesResult = await db.query(
      'SELECT u.id, u.email FROM meeting_notifiees mn JOIN users u ON mn.user_id = u.id WHERE mn.meeting_id = $1',
      [id]
    );
    
    // In a real app, you would send emails here
    // For now, just return success
    console.log(`Sending meeting minutes for meeting ${id} to:`, notifieesResult.rows.map(n => n.email));
    
    res.json({ success: true, message: 'Meeting minutes sent successfully' });
  } catch (error) {
    next(error);
  }
});

// Get meeting series (for recurring meetings)
router.get('/series/all', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM meetings WHERE is_recurring = true ORDER BY start_time`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

