const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Get user settings
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const result = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default settings if not exists
      const newSettings = await db.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
        [userId]
      );
      return res.json({
        success: true,
        data: {
          emailNotifications: newSettings.rows[0].email_notifications,
          pushNotifications: newSettings.rows[0].push_notifications,
          taskReminders: newSettings.rows[0].task_reminders,
          weeklySummary: newSettings.rows[0].weekly_summary,
          theme: newSettings.rows[0].theme,
          language: newSettings.rows[0].language,
          timezone: newSettings.rows[0].timezone
        }
      });
    }
    
    const settings = result.rows[0];
    
    res.json({
      success: true,
      data: {
        emailNotifications: settings.email_notifications,
        pushNotifications: settings.push_notifications,
        taskReminders: settings.task_reminders,
        weeklySummary: settings.weekly_summary,
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user settings
router.put('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { emailNotifications, pushNotifications, taskReminders, weeklySummary, theme, language, timezone } = req.body;
    
    const result = await db.query(
      `UPDATE user_settings 
       SET email_notifications = COALESCE($1, email_notifications),
           push_notifications = COALESCE($2, push_notifications),
           task_reminders = COALESCE($3, task_reminders),
           weekly_summary = COALESCE($4, weekly_summary),
           theme = COALESCE($5, theme),
           language = COALESCE($6, language),
           timezone = COALESCE($7, timezone)
       WHERE user_id = $8
       RETURNING *`,
      [emailNotifications, pushNotifications, taskReminders, weeklySummary, theme, language, timezone, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }
    
    const settings = result.rows[0];
    
    res.json({
      success: true,
      data: {
        emailNotifications: settings.email_notifications,
        pushNotifications: settings.push_notifications,
        taskReminders: settings.task_reminders,
        weeklySummary: settings.weekly_summary,
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone
      }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/:userId/change-password', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Get current password hash
    const user = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Get workspace settings
router.get('/workspace/:workspaceId', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    
    const result = await db.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [workspaceId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    
    const workspace = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        timezone: workspace.timezone,
        language: workspace.language
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update workspace settings
router.put('/workspace/:workspaceId', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, timezone, language } = req.body;
    
    const result = await db.query(
      `UPDATE workspaces 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           timezone = COALESCE($3, timezone),
           language = COALESCE($4, language)
       WHERE id = $5
       RETURNING *`,
      [name, description, timezone, language, workspaceId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
