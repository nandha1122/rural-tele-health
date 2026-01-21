import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// ⚠️ CHANGE THIS IF NEEDED:
// If testing on phone, use your Laptop's IP: http://192.168.1.X:5000
// If testing on same laptop, use: http://localhost:5000
const socket = io('http://localhost:5000');

const ContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [me, setMe] = useState('');
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) myVideo.current.srcObject = currentStream;
      })
      .catch((err) => console.error("Failed to get stream:", err));

    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  const answerCall = () => {
    setCallAccepted(true);
    
    // ★ FIX: ADD GOOGLE STUN SERVERS ★
    const peer = new Peer({ 
        initiator: false, 
        trickle: false, 
        stream,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, 
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (currentStream) => {
      console.log("Remote Stream Received!");
      setRemoteStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;
    });

    // ★ FIX: LOG ERRORS TO CONSOLE ★
    peer.on('error', (err) => {
        console.error("Peer Connection Error:", err);
        alert("Connection Failed. See Console.");
    });

    peer.on('close', () => {
        console.log("Call ended by peer");
        setCallEnded(true);
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const callUser = (id) => {
    // ★ FIX: ADD GOOGLE STUN SERVERS HERE TOO ★
    const peer = new Peer({ 
        initiator: true, 
        trickle: false, 
        stream,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, 
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });

    peer.on('stream', (currentStream) => {
      console.log("Remote Stream Received!");
      setRemoteStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;
    });

    peer.on('error', (err) => {
        console.error("Peer Connection Error:", err);
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if(connectionRef.current) connectionRef.current.destroy();
    window.location.reload(); 
  };

  return (
    <SocketContext.Provider value={{
      call, callAccepted, myVideo, userVideo, stream, name, setName, 
      callEnded, me, callUser, leaveCall, answerCall, remoteStream 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };