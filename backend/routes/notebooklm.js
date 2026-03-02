/**
 * NotebookLM Integration Routes
 * Handles audio recording upload and Gemini AI summary generation
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configuration - will be fetched from VPS
let notebookLMConfig = null;
let configLastFetched = null;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ==================
// Helper Functions
// ==================

/**
 * Fetch NotebookLM/Gemini configuration from remote VPS
 * This keeps credentials secure on the server side
 */
async function getNotebookLMConfig() {
    const now = Date.now();
    
    // Return cached config if still valid
    if (notebookLMConfig && configLastFetched && 
        (now - configLastFetched) < CONFIG_CACHE_DURATION) {
        return notebookLMConfig;
    }

    try {
        // Call to your VPS to get credentials
        // The VPS should return API key, project ID, etc.
        // Format: { apiKey: '...', projectId: '...', location: '...' }
        const vpsUrl = process.env.NOTEBOOKLM_VPS_URL || 'http://103.179.191.109:3001/api/notebooklm/config';
        
        const response = await axios.get(vpsUrl, {
            timeout: 10000,
            headers: {
                'X-Internal-Key': process.env.NOTEBOOKLM_INTERNAL_KEY || 'digihub-secret-key'
            }
        });

        notebookLMConfig = response.data;
        configLastFetched = now;

        console.log('[NotebookLM] Configuration fetched successfully');
        return notebookLMConfig;
    } catch (error) {
        console.error('[NotebookLM] Failed to fetch config from VPS:', error.message);
        
        // Return fallback config for development
        if (process.env.NODE_ENV === 'development') {
            return {
                apiKey: process.env.GEMINI_API_KEY || '',
                projectId: process.env.GEMINI_PROJECT_ID || '',
                location: process.env.GEMINI_LOCATION || 'us-central1'
            };
        }
        
        throw new Error('Unable to connect to NotebookLM configuration server');
    }
}

/**
 * Clear cached config (call after session completes)
 */
function clearNotebookLMConfig() {
    notebookLMConfig = null;
    configLastFetched = null;
    console.log('[NotebookLM] Configuration cache cleared');
}

/**
 * Transcribe audio using Gemini API
 */
async function transcribeAudioWithGemini(audioBuffer, config) {
    const { apiKey } = config;
    
    // Gemini 2.0 Flash with audio understanding
    // Note: This uses the File API - adjust based on actual Gemini API capabilities
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // For now, we'll use a simple transcription approach
    // In production, you might use Google Cloud Speech-to-Text instead
    
    const base64Audio = audioBuffer.toString('base64');
    
    const requestBody = {
        contents: [{
            parts: [{
                text: "Transcribe this audio recording of a meeting. Include all speakers if identifiable. Provide a detailed transcript."
            }, {
                inline_data: {
                    mime_type: 'audio/webm',
                    data: base64Audio
                }
            }]
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 32000
        }
    };

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        console.error('[NotebookLM] Gemini transcription error:', error.response?.data || error.message);
        throw new Error('Failed to transcribe audio');
    }
}

/**
 * Generate summary from transcript using Gemini
 */
async function generateSummaryWithGemini(transcript, config) {
    const { apiKey } = config;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const prompt = `You are a professional meeting summarizer. Please analyze this meeting transcript and create:
1. A brief executive summary (2-3 sentences)
2. Key discussion points (bullet list)
3. Action items with owners (if mentioned)
4. Decisions made (if any)

Meeting Transcript:
${transcript}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096
        }
    };

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        console.error('[NotebookLM] Gemini summary error:', error.response?.data || error.message);
        throw new Error('Failed to generate summary');
    }
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
 * Get NotebookLM configuration (validates connection to VPS)
 */
router.get('/config', async (req, res, next) => {
    try {
        const config = await getNotebookLMConfig();
        
        res.json({
            success: true,
            data: {
                connected: true,
                hasApiKey: !!config?.apiKey,
                projectId: config?.projectId
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
 * POST /api/notebooklm/session/start
 * Start a NotebookLM session - fetches credentials from VPS
 */
router.post('/session/start', async (req, res, next) => {
    try {
        const config = await getNotebookLMConfig();
        
        if (!config?.apiKey) {
            return res.status(401).json({
                success: false,
                message: 'NotebookLM credentials not available'
            });
        }

        // Session started - credentials fetched and cached
        res.json({
            success: true,
            message: 'NotebookLM session started',
            expiresIn: CONFIG_CACHE_DURATION
        });
    } catch (error) {
        console.error('[NotebookLM] Session start error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/notebooklm/session/end
 * End NotebookLM session - clear cached credentials
 */
router.post('/session/end', async (req, res, next) => {
    clearNotebookLMConfig();
    
    res.json({
        success: true,
        message: 'NotebookLM session ended'
    });
});

/**
 * POST /api/notebooklm/upload
 * Upload audio recording and generate summary
 */
router.post('/upload', async (req, res, next) => {
    try {
        const { meetingId, audioData, duration } = req.body;

        if (!meetingId || !audioData) {
            return res.status(400).json({
                success: false,
                message: 'Missing meetingId or audioData'
            });
        }

        // Get configuration (starts session if not active)
        const config = await getNotebookLMConfig();
        
        if (!config?.apiKey) {
            return res.status(401).json({
                success: false,
                message: 'NotebookLM session not active. Please start session first.'
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
            // Step 1: Transcribe audio
            console.log('[NotebookLM] Transcribing audio...');
            const transcript = await transcribeAudioWithGemini(audioBuffer, config);

            // Step 2: Generate summary
            console.log('[NotebookLM] Generating summary...');
            const summary = await generateSummaryWithGemini(transcript, config);

            // Step 3: Save summary to file
            const summaryFilePath = saveSummaryToFile(summary, meetingId);

            // Update recording record with results
            await db.query(
                `UPDATE meeting_recordings 
                 SET transcript = $1, summary = $2, summary_file_path = $3, 
                     status = 'completed', processed_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [transcript, summary, summaryFilePath, recordingId]
            );

            // Update meeting with recording and summary URLs
            await db.query(
                `UPDATE meetings 
                 SET recording_url = $1, summary_url = $2, recording_status = 'completed'
                 WHERE id = $3`,
                [`/uploads/recordings/${fileName}`, summaryFilePath, meetingId]
            );

            // End session after completion
            clearNotebookLMConfig();

            res.json({
                success: true,
                data: {
                    recordingId,
                    transcript,
                    summary,
                    summaryFilePath,
                    audioFilePath: `/uploads/recordings/${fileName}`
                },
                message: 'Recording processed successfully'
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

module.exports = router;

