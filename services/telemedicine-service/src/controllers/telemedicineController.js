/**
 * Telemedicine Controller
 * Generates Agora tokens for secure real-time video consultations.
 */

const { RtcTokenBuilder, RtcRole } = require('agora-token');
const Session = require('../models/Session');

// @desc    Generate Video Token and Create Session
// @route   POST /api/sessions/token
exports.generateToken = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Configuration from .env
        const appId = process.env.AGORA_APP_ID;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE;
        const channelName = appointmentId; // Using appointment ID as the room name
        const uid = 0; // Standard UID for Agora
        const role = RtcRole.PUBLISHER; // Participant role
        
        // Token expiry: 1 Hour (3600 seconds)
        const expirationTimeInSeconds = 3600;
        const privilegeExpireTime = Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

        // Build the token using Agora SDK
        const token = RtcTokenBuilder.buildTokenWithUid(
            appId, appCertificate, channelName, uid, role, privilegeExpireTime
        );

        // Save session metadata to DB
        const newSession = new Session({
            appointmentId,
            channelName,
            token
        });
        await newSession.save();

        return res.status(201).json({
            token,
            channelName,
            message: 'Video token generated successfully'
        });

    } catch (error) {
        console.error('Token Generation Error:', error.message);
        res.status(500).json({ message: 'Failed to generate video session token' });
    }
};
// @desc    End a video session
// @route   POST /api/sessions/:id/end
exports.endSession = async (req, res) => {
    try {
        const { id } = req.params; // Session MongoDB ID

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        session.endedAt = new Date();
        // Calculate duration in minutes
        const diffInMs = session.endedAt - session.startedAt;
        session.duration = Math.floor(diffInMs / 1000 / 60);

        await session.save();
        res.status(200).json({ message: 'Session ended', duration: session.duration });
    } catch (error) {
        res.status(500).json({ message: 'Error ending session' });
    }
};