/**
 * VideoRoom Component - Telemedicine Interface
 * Handles real-time video streaming between Doctor and Patient using Agora SDK.
 */

import React, { useState, useEffect } from 'react';
import AgoraRTC, { 
  AgoraRTCProvider, 
  LocalVideoTrack, 
  RemoteUser, 
  useJoin, 
  useLocalMicrophoneTrack, 
  useLocalCameraTrack, 
  usePublish, 
  useRemoteUsers 
} from "agora-rtc-react";
import { generateVideoToken } from '../services/api';
import { useSearchParams } from 'react-router-dom';

// Initialize Agora Client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const VideoRoom = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("aptId"); // Unique channel name from URL
  const [token, setToken] = useState(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    /**
     * Fetch the secure video token from the Telemedicine Service (Port 5006)
     */
    const fetchToken = async () => {
      try {
        const response = await generateVideoToken(appointmentId);
        setToken(response.data.token);
      } catch (err) {
        console.error("Video Token Error:", err);
      }
    };
    if (appointmentId) fetchToken();
  }, [appointmentId]);

  if (!token) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-slate-400 font-medium tracking-wide">Connecting to Secure Medical Server...</p>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 overflow-hidden">
      <AgoraRTCProvider client={client}>
        {!inCall ? (
          /* PRE-CALL SCREEN */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="bg-slate-900 p-10 rounded-[2rem] border border-slate-800 shadow-2xl max-w-md w-full text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-white text-3xl font-bold mb-2">Video Consultation</h2>
              <p className="text-slate-400 mb-8">Appointment ID: <span className="text-blue-400">{appointmentId}</span></p>
              
              <button 
                onClick={() => setInCall(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-xl shadow-blue-900/20"
              >
                Start Consultation Now
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE CALL SCREEN */
          <CallInterface channelName={appointmentId} token={token} />
        )}
      </AgoraRTCProvider>
    </div>
  );
};

/**
 * CallInterface Component
 * Manages video tracks and rendering local/remote streams.
 */
const CallInterface = ({ channelName, token }) => {
  const { isLoading: micLoading, localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { isLoading: camLoading, localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();

  // JOIN CHANNEL: AppID must match the one used in the backend .env
  useJoin({ 
      appid: "abc123456789def0123456789abcdef0", 
      channel: channelName, 
      token: token, 
      uid: null 
  });
  
  usePublish([localMicrophoneTrack, localCameraTrack]);

  if (micLoading || camLoading) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center text-white">
      <p>Initializing hardware resources...</p>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        
        {/* LOCAL FEED (Patient View) */}
        <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-blue-600/50 group shadow-2xl">
          <LocalVideoTrack track={localCameraTrack} play className="h-full w-full object-cover" />
          <div className="absolute bottom-6 left-6 bg-blue-600/80 backdrop-blur-lg px-5 py-2 rounded-2xl text-white font-bold text-sm">
            Patient (You)
          </div>
        </div>

        {/* REMOTE FEED (Doctor View) */}
        <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-slate-800 group shadow-2xl flex items-center justify-center">
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <div key={user.uid} className="h-full w-full">
                <RemoteUser user={user} play />
                <div className="absolute bottom-6 left-6 bg-slate-800/80 backdrop-blur-lg px-5 py-2 rounded-2xl text-white font-bold text-sm italic">
                  Medical Specialist
                </div>
              </div>
            ))
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                 <span className="text-slate-500 animate-pulse text-4xl">?</span>
              </div>
              <p className="text-slate-500 font-medium">Waiting for doctor to join...</p>
            </div>
          )}
        </div>
      </div>

      {/* END CALL BAR */}
      <div className="py-8 flex justify-center">
        <button 
          onClick={() => window.location.href = '/my-appointments'}
          className="bg-red-500 hover:bg-red-400 text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-3 transition shadow-lg shadow-red-900/20"
        >
          Disconnect Call
        </button>
      </div>
    </div>
  );
};

export default VideoRoom;