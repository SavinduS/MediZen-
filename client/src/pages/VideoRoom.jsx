/**
 * VideoRoom Component - Integrated Telemedicine Interface
 * Purpose: Provides a secure environment for real-time video consultations.
 * Member 2 Responsibility: Telemedicine Token Logic (5006) & Agora RTC UI.
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
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react"; // Access auth state
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, User, ShieldCheck } from 'lucide-react';

// Agora Client Global Configuration
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const VideoRoom = () => {
  const { user } = useUser(); // Get logged-in user data
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract Context from URL: Appointment ID and current User Role (passed from Dashboard/History)
  const appointmentId = searchParams.get("aptId"); 
  const userRole = searchParams.get("role") || "patient"; 
  
  const [token, setToken] = useState(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    /**
     * Fetch a unique security token for this session from the Telemedicine backend
     */
    const fetchToken = async () => {
      try {
        const response = await generateVideoToken(appointmentId);
        setToken(response.data.token);
      } catch (err) {
        console.error("Clinical System: Token retrieval failed", err);
      }
    };
    if (appointmentId) fetchToken();
  }, [appointmentId]);

  // Loading state while securing the connection
  if (!token) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck size={20} className="text-blue-500" />
        </div>
      </div>
      <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Securing Medical Feed...</p>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 overflow-hidden font-sans">
      <AgoraRTCProvider client={client}>
        {!inCall ? (
          /* PRE-CALL / LOBBY SCREEN */
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 shadow-2xl max-w-md w-full text-center">
              <div className="mb-8">
                <div className="bg-blue-600/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-8 ring-blue-600/5">
                   <VideoIcon size={40} className="text-blue-500" />
                </div>
              </div>
              <h2 className="text-white text-3xl font-black tracking-tight mb-2 uppercase italic">Consultation Room</h2>
              <p className="text-slate-500 text-sm mb-10 font-medium">Hello {user?.firstName}, please click below to enter the private channel for session <span className="text-blue-500">{appointmentId}</span></p>
              
              <button 
                onClick={() => setInCall(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl shadow-blue-900/40"
              >
                Enter Consultation Now
              </button>
            </div>
          </div>
        ) : (
          /* LIVE CALL UI: Pass context to manage UI labels dynamically */
          <CallInterface channelName={appointmentId} token={token} role={userRole} />
        )}
      </AgoraRTCProvider>
    </div>
  );
};

/**
 * CallInterface Component
 * Manages RTC streams and Role-based Viewports.
 */
const CallInterface = ({ channelName, token, role }) => {
  const navigate = useNavigate();
  const { isLoading: micLoading, localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { isLoading: camLoading, localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const toggleMic = async () => {
    if (localMicrophoneTrack) {
      await localMicrophoneTrack.setMuted(micOn); // setMuted(true) mutes the track
      setMicOn(!micOn);
    }
  };

  const toggleCamera = async () => {
    if (localCameraTrack) {
      await localCameraTrack.setMuted(cameraOn);
      setCameraOn(!cameraOn);
    }
  };

  // JOIN CHANNEL: Uses local development AppID. Role is publisher by default.
  useJoin({ 
      appid: "abc123456789def0123456789abcdef0", 
      channel: channelName, 
      token: token, 
      uid: null 
  });
  
  // Publish tracks to the channel for other participants to see
  usePublish([localMicrophoneTrack, localCameraTrack]);

  if (micLoading || camLoading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center text-white italic font-bold">
      Configuring clinical hardware...
    </div>
  );

  return (
    <div className="p-6 md:p-10 h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        
        {/* LOCAL FEED (YOU) - Dynamic Label based on Role */}
        <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-blue-500/30 group shadow-2xl ring-1 ring-blue-500/20">
          <LocalVideoTrack track={localCameraTrack} play className="h-full w-full object-cover" />
          <div className="absolute bottom-8 left-8 bg-blue-600/90 backdrop-blur-xl px-6 py-2.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg">
            {role === 'doctor' ? 'Clinical Lead (You)' : 'Patient (You)'}
          </div>
        </div>

        {/* REMOTE FEED (THE OTHER PARTY) */}
        <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden border-2 border-slate-800 flex items-center justify-center group shadow-2xl">
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <div key={user.uid} className="h-full w-full">
                <RemoteUser user={user} play />
                <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-xl px-6 py-2.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg italic">
                    {role === 'doctor' ? 'Connected Patient' : 'Medical Specialist'}
                </div>
              </div>
            ))
          ) : (
            /* WAITING STATE */
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-700 animate-pulse">
                 <User className="text-slate-600" size={32} />
              </div>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">
                Waiting for the {role === 'doctor' ? 'patient' : 'doctor'}...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CALL CONTROLS */}
      <div className="py-10 flex justify-center gap-6">
        <button 
          onClick={toggleMic}
          className={`${micOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'} text-white p-5 rounded-full transition`}
        >
          {micOn ? <Mic size={24}/> : <MicOff size={24}/>}
        </button>
        <button 
          onClick={() => window.location.href = (role === 'doctor' ? '/doctor-dashboard' : '/my-appointments')}
          className="bg-red-500 hover:bg-red-400 text-white px-12 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 transition shadow-2xl shadow-red-900/40 active:scale-95"
        >
          <PhoneOff size={20} /> End Session
        </button>
        <button 
          onClick={toggleCamera}
          className={`${cameraOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'} text-white p-5 rounded-full transition`}
        >
          {cameraOn ? <VideoIcon size={24}/> : <VideoOff size={24}/>}
        </button>
      </div>
    </div>
  );
};

export default VideoRoom;