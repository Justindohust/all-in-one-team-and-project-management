/**
 * AI Summary Routes
 * Uses Google AI Studio (free tier) for text summarization
 * No credit card required - free API access
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ==================
// Helper Functions
// ==================

/**
 * Call Google AI Studio API for summarization
 */
async function generateSummaryWithAI(text, meetingTitle = 'Meeting') {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
        throw new Error('Google AI API key not configured. Please add GOOGLE_AI_API_KEY to .env file.');
    }

    const prompt = `You are a professional meeting summarizer. Please analyze the following meeting notes/transcript and create a comprehensive summary.

Meeting Title: ${meetingTitle}

Please provide:
1. **Key Topics Discussed**: Main subjects covered in the meeting
2. **Important Decisions**: Any decisions made during the meeting
3. **Action Items**: Tasks assigned with owners if mentioned
4. **Next Steps**: Suggested follow-up actions

Meeting Notes:
${text}

Please provide a well-structured summary in markdown format:`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    topP: 0.95,
                    topK: 40
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google AI API error: ${error}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Failed to generate summary');
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
 * Generate AI summary from text (notes/transcript)
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

        console.log(`[AI Summary] Generating summary for meeting ${meetingId}...`);

        // Generate summary using Google AI
        const summary = await generateSummaryWithAI(text, meetingTitle || `Meeting ${meetingId}`);

        // Save summary to file
        const summaryFilePath = saveSummaryToFile(summary, meetingId);

        // Update meeting record
        await db.query(
            `UPDATE meetings
             SET summary_url = $1, recording_status = 'completed'
             WHERE id = $2`,
            [summaryFilePath, meetingId]
        );

        // Save to meeting_recordings table if exists
        try {
            await db.query(
                `INSERT INTO meeting_recordings
                 (meeting_id, transcript, summary, summary_file_path, status, created_at)
                 VALUES ($1, $2, $3, $4, 'completed', CURRENT_TIMESTAMP)`,
                [meetingId, text, summary, summaryFilePath]
            );
        } catch (e) {
            // Table might not exist, ignore
            console.log('[AI Summary] Recording table not available');
        }

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

