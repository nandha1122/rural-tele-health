import React, { useContext, useState, useEffect, useRef } from 'react';
import { 
  Button, TextField, Typography, Container, Paper, Box, IconButton, Fab, Tooltip, Grid, CircularProgress 
} from '@mui/material';
import { 
  Videocam, Person, LocalHospital, CallEnd, ContentCopy, Mic, MicOff, VideocamOff 
} from '@mui/icons-material';
import { SocketContext } from './SocketContext';

const App = () => {
  const { 
    name, callAccepted, myVideo, userVideo, callEnded, stream, call, 
    setName, callUser, leaveCall, answerCall, me, remoteStream 
  } = useContext(SocketContext);

  const [idToCall, setIdToCall] = useState('');
  const [role, setRole] = useState(null); 
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  // --- 🔧 CRITICAL FIX: FORCE VIDEO TO PLAY ---
  // This watches the stream and plugs it into the HTML element immediately
  useEffect(() => {
    // 1. Remote Video (The Doctor)
    if (remoteStream && userVideo.current) {
        console.log("✅ Remote Stream Attached to Video Player");
        userVideo.current.srcObject = remoteStream;
        userVideo.current.play().catch(e => console.error("Remote play error:", e));
    }
    // 2. Local Video (The Patient/Self)
    if (stream && myVideo.current) {
        myVideo.current.srcObject = stream;
    }
  }, [remoteStream, stream, callAccepted]); // Run whenever these change

  // --- TOGGLES ---
  const toggleMic = () => {
    setMicOn(!micOn);
    if(stream) stream.getAudioTracks()[0].enabled = !micOn;
  };

  const toggleCamera = () => {
    setCameraOn(!cameraOn);
    if(stream) stream.getVideoTracks()[0].enabled = !cameraOn;
  };

  const copyId = () => {
    navigator.clipboard.writeText(me);
    alert("ID Copied!");
  };

  // --- STYLES ---
  const styles = {
    fullScreenContainer: {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: '#121212', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    remoteVideo: {
        width: '100%', height: '100%', objectFit: 'cover', 
        zIndex: 0, // Background layer
        position: 'absolute',
        // Only show if call is accepted
        display: (callAccepted && !callEnded) ? 'block' : 'none'
    },
    statusOverlay: {
        position: 'absolute', zIndex: 5, color: 'white', textAlign: 'center',
        background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '10px',
        backdropFilter: 'blur(5px)'
    },
    localVideoContainer: {
        position: 'absolute', top: '20px', right: '20px', 
        width: '180px', height: '120px', 
        borderRadius: '12px', overflow: 'hidden', 
        border: '2px solid rgba(255,255,255,0.5)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        zIndex: 10, backgroundColor: '#000'
    },
    localVideo: {
        width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)'
    },
    controlsBar: {
        position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '20px', zIndex: 20,
        padding: '15px 30px', borderRadius: '30px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    panelGlass: {
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '30px', borderRadius: '20px',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
        maxWidth: '400px', width: '90%', textAlign: 'center', zIndex: 50
    }
  };

  // --- SCREEN 1: ROLE SELECTION ---
  if (!role) {
    return (
        <Container maxWidth="md" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#e3f2fd' }}>
            <Typography variant="h3" style={{fontWeight: 'bold', marginBottom: '40px', color: '#1565c0'}}>
                Rural Tele-Health
            </Typography>
            <Grid container spacing={4} justifyContent="center">
                <Grid item>
                    <Paper elevation={6} style={{padding: '40px', cursor: 'pointer', borderRadius: '20px', textAlign: 'center'}} onClick={() => setRole('doctor')}>
                        <LocalHospital style={{fontSize: 80, color: '#1976d2', marginBottom: '10px'}}/>
                        <Typography variant="h5">Doctor</Typography>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper elevation={6} style={{padding: '40px', cursor: 'pointer', borderRadius: '20px', textAlign: 'center'}} onClick={() => setRole('patient')}>
                        <Person style={{fontSize: 80, color: '#2E7D32', marginBottom: '10px'}}/>
                        <Typography variant="h5">Patient</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
  }

  // --- SCREEN 2: MAIN INTERFACE ---
  return (
    <div style={styles.fullScreenContainer}>
      
      {/* 1. REMOTE VIDEO (Background) */}
      {/* IMPORTANT: playsInline and autoPlay are REQUIRED for video to start */}
      <video playsInline ref={userVideo} autoPlay style={styles.remoteVideo} />

      {/* 2. LOADING STATUS (Debug Info) */}
      {/* If call is connected, but video is missing, show this message */}
      {callAccepted && !callEnded && !remoteStream && (
        <div style={styles.statusOverlay}>
            <CircularProgress style={{color: 'white', marginBottom: '15px'}} />
            <Typography variant="h6">WAITING FOR VIDEO STREAM...</Typography>
            <Typography variant="caption" style={{display:'block', marginTop:'5px', color:'#aaa'}}>
                Connection Established. Loading Media...
            </Typography>
        </div>
      )}

      {/* 3. LOCAL VIDEO (PIP) */}
      {stream && (
        <div style={styles.localVideoContainer}>
            <video playsInline muted ref={myVideo} autoPlay style={styles.localVideo} />
        </div>
      )}

      {/* 4. WAITING ROOM (Visible only before call connects) */}
      {!callAccepted && (
          <div style={styles.panelGlass}>
                <Typography variant="h5" style={{color: '#333', marginBottom: '10px', fontWeight: 'bold'}}>
                    {role === 'doctor' ? "Doctor Console" : "Patient Portal"}
                </Typography>
                
                {role === 'doctor' && (
                    <>
                        <Box bgcolor="#e3f2fd" p={2} borderRadius={2} mb={2}>
                            <Typography variant="caption" color="textSecondary">SHARE THIS ID:</Typography>
                            <Box display="flex" alignItems="center" justifyContent="center">
                                <Typography variant="h6" style={{color: '#1565c0', fontWeight: 'bold', marginRight: '10px', wordBreak: 'break-all'}}>
                                    {me || "Connecting..."}
                                </Typography>
                                <IconButton onClick={copyId} size="small"><ContentCopy/></IconButton>
                            </Box>
                        </Box>

                        {call.isReceivingCall ? (
                             <Box p={2} bgcolor="#fff3e0" borderRadius={2} border="1px solid #ff9800">
                                <Typography style={{color: '#e65100', fontWeight: 'bold'}}>📞 Patient Incoming...</Typography>
                                <Button variant="contained" color="warning" fullWidth onClick={answerCall} style={{marginTop: '10px'}}>
                                    ANSWER CALL
                                </Button>
                            </Box>
                        ) : (
                            <div style={{display:'flex', alignItems:'center', justifyContent:'center', color:'#666'}}>
                                <CircularProgress size={20} style={{marginRight: 10}}/> Waiting for patient...
                            </div>
                        )}
                    </>
                )}

                {role === 'patient' && (
                    <>
                        <TextField 
                            label="Doctor ID" 
                            variant="outlined" 
                            fullWidth 
                            value={idToCall} 
                            onChange={(e) => setIdToCall(e.target.value)} 
                            placeholder="Paste ID here..."
                            style={{marginBottom: '20px'}}
                        />
                        <Button 
                            variant="contained" 
                            color="success" 
                            fullWidth 
                            size="large"
                            onClick={() => callUser(idToCall)}
                            disabled={!idToCall}
                            startIcon={<Videocam />}
                            style={{padding: '12px'}}
                        >
                            CONNECT TO DOCTOR
                        </Button>
                    </>
                )}
                
                <Button onClick={() => window.location.reload()} style={{marginTop: '20px', color: '#888'}}>EXIT</Button>
          </div>
      )}

      {/* 5. CONTROLS BAR (Only during call) */}
      {callAccepted && !callEnded && (
        <div style={styles.controlsBar}>
            <Tooltip title="Mute/Unmute">
                <Fab color={micOn ? "default" : "secondary"} onClick={toggleMic} size="medium">
                    {micOn ? <Mic /> : <MicOff />}
                </Fab>
            </Tooltip>
            <Tooltip title="End Call">
                <Fab color="error" onClick={leaveCall} size="large">
                    <CallEnd fontSize="large" />
                </Fab>
            </Tooltip>
            <Tooltip title="Camera On/Off">
                <Fab color={cameraOn ? "default" : "secondary"} onClick={toggleCamera} size="medium">
                    {cameraOn ? <Videocam /> : <VideocamOff />}
                </Fab>
            </Tooltip>
        </div>
      )}
    </div>
  );
};

export default App;