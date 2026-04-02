/**
 * Telemedicine Controller - Fixed with Upsert Logic
 */
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const Session = require('../models/Session');

exports.generateToken = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appId = process.env.AGORA_APP_ID;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE;
        const channelName = appointmentId;
        const uid = 0;
        const role = RtcRole.PUBLISHER;
        const expirationTimeInSeconds = 3600;
        const privilegeExpireTime = Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

        // Generate Token
        const token = RtcTokenBuilder.buildTokenWithUid(
            appId, appCertificate, channelName, uid, role, privilegeExpireTime
        );

        // --- FIXED LOGIC: Find existing or Create new ---
        // This prevents the "E11000 duplicate key error"
        const session = await Session.findOneAndUpdate(
            { appointmentId }, // Search criteria
            { 
                channelName, 
                token, 
                startedAt: new Date() 
            }, // Data to update
            { upsert: true, new: true } // Create if doesn't exist, return the updated document
        );

        console.log(`✅ Token Generated for Appointment: ${appointmentId}`);

        return res.status(201).json({
            token,
            channelName,
            message: 'Video token generated successfully'
        });

    } catch (error) {
        console.error('❌ Token Generation Error:', error.message);
        res.status(500).json({ message: 'Failed to generate token' });
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