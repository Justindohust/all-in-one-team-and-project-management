/**
 * NotebookLM Integration Routes
 * Uses browser-based authentication with user's NotebookLM account
 * No Gemini API key required
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ==================
// Helper Functions
// ==================

/**
 * Run Python NotebookLM service
 */
function runNotebookLMService(audioPath, meetingTitle) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'notebooklm_service.py');

        const python = spawn('python', [scriptPath, audioPath, meetingTitle], {
            cwd: path.join(__dirname, '..')
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                console.error('[NotebookLM] Python script error:', stderr);
                reject(new Error(stderr || 'Python script failed'));
            } else {
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (e) {
                    reject(new Error('Failed to parse Python output'));
                }
            }
        });

        python.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Save summary to a text file
 */
function saveSummaryToFile(summary, meetingId) {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'summaries');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `meeting_${meetingId}_${Date.now()}.txt`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, summary, 'utf8');

    return `/uploads/summaries/${fileName}`;
}

// ==================
// API Routes
// ==================

/**
 * GET /api/notebooklm/config
 * Get NotebookLM configuration status
 */
router.get('/config', async (req, res, next) => {
    try {
        // Check if NotebookLM credentials are available
        // This will be checked via the Python script which uses browser auth
        res.json({
            success: true,
            data: {
                connected: true,
                authType: 'browser',
                message: 'Uses browser-based authentication with your NotebookLM account'
            }
        });
    } catch (error) {
        console.error('[NotebookLM] Config error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/notebooklm/login
 * Trigger browser login for NotebookLM (if not already authenticated)
 */
router.post('/login', async (req, res, next) => {
    try {
        // This would open browser for login if needed
        // For now, we assume the user will run "notebooklm login" once on the server
        res.json({
            success: true,
            message: 'NotebookLM uses browser authentication. Run "notebooklm login" on server if not already authenticated.'
        });
    } catch (error) {
        console.error('[NotebookLM] Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/notebooklm/upload
 * Upload audio recording and generate summary using NotebookLM
 */
router.post('/upload', async (req, res, next) => {
    try {
        const { meetingId, audioData, duration, meetingTitle } = req.body;

        if (!meetingId || !audioData) {
            return res.status(400).json({
                success: false,
                message: 'Missing meetingId or audioData'
            });
        }

        // Decode base64 audio
        const audioBuffer = Buffer.from(audioData, 'base64');

        // Save audio file
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'recordings');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `meeting_${meetingId}_${Date.now()}.webm`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, audioBuffer);

        // Create recording record in database
        const recordingResult = await db.query(
            `INSERT INTO meeting_recordings
             (meeting_id, file_name, file_path, file_size, duration_seconds, mime_type, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [meetingId, fileName, filePath, audioBuffer.length, duration || 0, 'audio/webm', 'processing']
        );

        const recordingId = recordingResult.rows[0].id;

        try {
            // Process audio through NotebookLM Python service
            console.log('[NotebookLM] Processing audio with NotebookLM...');

            const notebookResult = await runNotebookLMService(
                filePath,
                meetingTitle || `Meeting ${meetingId}`
            );

            if (!notebookResult.success) {
                throw new Error(notebookResult.error || 'NotebookLM processing failed');
            }

            // Save summary to file
            const summaryFilePath = saveSummaryToFile(notebookResult.summary, meetingId);

            // Update recording record with results
            await db.query(
                `UPDATE meeting_recordings
                 SET transcript = $1, summary = $2, summary_file_path = $3,
                     status = 'completed', processed_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [notebookResult.summary, notebookResult.summary, summaryFilePath, recordingId]
            );

            // Update meeting with recording and summary URLs
            await db.query(
                `UPDATE meetings
                 SET recording_url = $1, summary_url = $2, recording_status = 'completed'
                 WHERE id = $3`,
                [`/uploads/recordings/${fileName}`, summaryFilePath, meetingId]
            );

            res.json({
                success: true,
                data: {
                    recordingId,
                    summary: notebookResult.summary,
                    summaryFilePath,
                    audioFilePath: `/uploads/recordings/${fileName}`,
                    audioOverviewFile: notebookResult.audioFile,
                    quizFile: notebookResult.quizFile
                },
                message: 'Recording processed successfully with NotebookLM'
            });

        } catch (processingError) {
            // Mark recording as failed
            await db.query(
                `UPDATE meeting_recordings SET status = 'failed' WHERE id = $1`,
                [recordingId]
            );

            throw processingError;
        }

    } catch (error) {
        console.error('[NotebookLM] Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/notebooklm/recording/:meetingId
 * Get recording and summary for a meeting
 */
router.get('/recording/:meetingId', async (req, res, next) => {
    try {
        const { meetingId } = req.params;

        const result = await db.query(
            `SELECT mr.*, 
                    u.first_name || ' ' || u.last_name as created_by_name
             FROM meeting_recordings mr
             LEFT JOIN users u ON mr.created_by = u.id
             WHERE mr.meeting_id = $1
             ORDER BY mr.created_at DESC
             LIMIT 1`,
            [meetingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No recording found for this meeting'
            });
        }

        const recording = result.rows[0];

        // Read summary file if exists
        let summaryContent = null;
        if (recording.summary_file_path) {
            const fullPath = path.join(__dirname, '..', recording.summary_file_path);
            if (fs.existsSync(fullPath)) {
                summaryContent = fs.readFileSync(fullPath, 'utf8');
            }
        }

        res.json({
            success: true,
            data: {
                ...recording,
                summary: summaryContent || recording.summary
            }
        });
    } catch (error) {
        console.error('[NotebookLM] Get recording error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/notebooklm/status/:meetingId
 * Get processing status for a meeting
 */
router.get('/status/:meetingId', async (req, res, next) => {
    try {
        const { meetingId } = req.params;

        const result = await db.query(
            `SELECT status, transcript, summary, summary_file_path, 
                    created_at, processed_at
             FROM meeting_recordings 
             WHERE meeting_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [meetingId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    hasRecording: false,
                    status: null
                }
            });
        }

        const recording = result.rows[0];

        res.json({
            success: true,
            data: {
                hasRecording: true,
                status: recording.status,
                createdAt: recording.created_at,
                processedAt: recording.processed_at
            }
        });
    } catch (error) {
        console.error('[NotebookLM] Status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * DELETE /api/notebooklm/recording/:recordingId
 * Delete a recording
 */
router.delete('/recording/:recordingId', async (req, res, next) => {
    try {
        const { recordingId } = req.params;

        // Get recording first
        const result = await db.query(
            'SELECT * FROM meeting_recordings WHERE id = $1',
            [recordingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found'
            });
        }

        const recording = result.rows[0];

        // Delete file if exists
        if (recording.file_path && fs.existsSync(recording.file_path)) {
            fs.unlinkSync(recording.file_path);
        }

        // Delete summary file if exists
        if (recording.summary_file_path) {
            const summaryPath = path.join(__dirname, '..', recording.summary_file_path);
            if (fs.existsSync(summaryPath)) {
                fs.unlinkSync(summaryPath);
            }
        }

        // Delete from database
        await db.query('DELETE FROM meeting_recordings WHERE id = $1', [recordingId]);

        res.json({
            success: true,
            message: 'Recording deleted successfully'
        });
    } catch (error) {
        console.error('[NotebookLM] Delete recording error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

