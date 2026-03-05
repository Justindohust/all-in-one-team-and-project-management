/**
 * AI Summary Routes
 * Uses Browser Automation to open AI chat with meeting notes
 * User manually generates summary (no API key required)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

// ==================
// Helper Functions
// ==================

/**
 * Open browser with meeting notes - triggers browser automation
 */
async function openBrowserWithNotes(notes, meetingTitle) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'meeting_summary_helper.js');

        // Create a temp file with the notes
        const tempDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const notesFile = path.join(tempDir, 'temp_notes.txt');
        fs.writeFileSync(notesFile, notes, 'utf8');

        console.log('[Summary] Opening browser with notes...');

        const python = spawn('node', [scriptPath, notesFile, meetingTitle], {
            cwd: path.join(__dirname, '..'),
            detached: true,
            stdio: 'ignore'
        });

        python.unref();

        resolve({
            success: true,
            message: 'Browser opened with meeting notes. Follow instructions to generate AI summary.'
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
 * Check if AI API is configured
 */
router.get('/config', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;

        res.json({
            success: true,
            data: {
                connected: !!apiKey,
                provider: 'Google AI Studio (Free)',
                message: apiKey
                    ? 'AI summarization is enabled. Add meeting notes and click "Generate Summary" to get AI-powered insights.'
                    : 'Please configure GOOGLE_AI_API_KEY in backend/.env to enable AI summarization.'
            }
        });
    } catch (error) {
        console.error('[AI Summary] Config error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/notebooklm/summarize
 * Open browser with meeting notes for AI summarization
 */
router.post('/summarize', async (req, res) => {
    try {
        const { meetingId, text, meetingTitle } = req.body;

        if (!meetingId || !text) {
            return res.status(400).json({
                success: false,
                message: 'Missing meetingId or text content'
            });
        }

        if (text.length < 50) {
            return res.status(400).json({
                success: false,
                message: 'Text content is too short. Please provide more detailed meeting notes.'
            });
        }

        console.log(`[AI Summary] Opening browser for meeting ${meetingId}...`);

        // Open browser with notes - user will generate summary manually
        const result = await openBrowserWithNotes(text, meetingTitle || `Meeting ${meetingId}`);

        res.json({
            success: true,
            data: {
                message: 'Browser opened! Follow the instructions on screen to generate AI summary.',
                instructions: [
                    '1. Google AI Studio opened with your meeting notes',
                    '2. Click "Send" to generate summary',
                    '3. Copy the AI response',
                    '4. Paste back into DigiHub Summary tab'
                ]
            },
            message: result.message
        });

    } catch (error) {
        console.error('[AI Summary] Generate error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/notebooklm/save-summary
 * Save the user-generated summary from AI chat
 */
router.post('/save-summary', async (req, res) => {
    try {
        const { meetingId, summary } = req.body;

        if (!meetingId || !summary) {
            return res.status(400).json({
                success: false,
                message: 'Missing meetingId or summary content'
            });
        }

        // Save summary to file
        const summaryFilePath = saveSummaryToFile(summary, meetingId);

        // Update meeting record
        await db.query(
            `UPDATE meetings
             SET summary_url = $1, recording_status = 'completed'
             WHERE id = $2`,
            [summaryFilePath, meetingId]
        );

        res.json({
            success: true,
            data: {
                summaryFilePath: summaryFilePath
            },
            message: 'Summary saved successfully!'
        });

    } catch (error) {
        console.error('[AI Summary] Save error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

        res.json({
            success: true,
            data: {
                summary: summary,
                summaryFilePath: summaryFilePath
            },
            message: 'Summary generated successfully!'
        });

    } catch (error) {
        console.error('[AI Summary] Generate error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/notebooklm/upload
 * Upload audio recording (store only, no AI processing)
 */
router.post('/upload', async (req, res) => {
    try {
        const { meetingId, audioData, duration } = req.body;

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
        try {
            await db.query(
                `INSERT INTO meeting_recordings
                 (meeting_id, file_name, file_path, file_size, duration_seconds, mime_type, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                 RETURNING id`,
                [meetingId, fileName, filePath, audioBuffer.length, duration || 0, 'audio/webm']
            );
        } catch (e) {
            console.log('[AI Summary] Recording table not available');
        }

        // Update meeting
        await db.query(
            `UPDATE meetings
             SET recording_url = $1, recording_status = 'pending'
             WHERE id = $2`,
            [`/uploads/recordings/${fileName}`, meetingId]
        );

        res.json({
            success: true,
            data: {
                audioFilePath: `/uploads/recordings/${fileName}`,
                message: 'Audio recorded successfully. Add meeting notes and use AI to generate summary.'
            }
        });

    } catch (error) {
        console.error('[AI Summary] Upload error:', error);
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
router.get('/recording/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;

        // Get from meetings table first
        const meetingResult = await db.query(
            'SELECT recording_url, summary_url FROM meetings WHERE id = $1',
            [meetingId]
        );

        let summaryContent = null;
        let summaryFilePath = meetingResult.rows[0]?.summary_url;

        // Read summary file if exists
        if (summaryFilePath) {
            const fullPath = path.join(__dirname, '..', summaryFilePath);
            if (fs.existsSync(fullPath)) {
                summaryContent = fs.readFileSync(fullPath, 'utf8');
            }
        }

        res.json({
            success: true,
            data: {
                recordingUrl: meetingResult.rows[0]?.recording_url,
                summaryUrl: summaryFilePath,
                summary: summaryContent
            }
        });
    } catch (error) {
        console.error('[AI Summary] Get recording error:', error);
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
router.get('/status/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;

        const result = await db.query(
            `SELECT recording_status FROM meetings WHERE id = $1`,
            [meetingId]
        );

        res.json({
            success: true,
            data: {
                status: result.rows[0]?.recording_status || 'no_recording'
            }
        });
    } catch (error) {
        res.json({
            success: true,
            data: { status: 'unknown' }
        });
    }
});

module.exports = router;

