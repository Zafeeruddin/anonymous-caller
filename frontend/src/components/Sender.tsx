import { useEffect, useState } from "react"
import * as Tone from "tone"
export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [pitchShift, setPitchShift] = useState<Tone.PitchShift | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://192.168.0.4:4000');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
    }, []);

    const initiateConn = async () => {
        if (!socket) {
            alert("Socket not found");
            return;
        }

        const pc = new RTCPeerConnection();
        setPC(pc);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                await pc.addIceCandidate(message.candidate);
            }
        }

        try {
            await getMicAndSend(pc);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        } catch (error) {
            console.error("Error in initiateConn:", error);
        }
    }
    
    const getMicAndSend = async (pc: RTCPeerConnection) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            
            // Set up Tone.js audio processing
            await Tone.start();
            console.log("Tone started");
    
            const microphone = new Tone.UserMedia();
            await microphone.open();
            console.log("Microphone opened");
    
            const pitchShift = new Tone.PitchShift().toDestination();
            setPitchShift(pitchShift);
    
            // Create a new MediaStream for the processed audio
            const toneContext = Tone.getContext();
            const destination = toneContext.createMediaStreamDestination();
            
            // Connect the audio processing chain
            microphone.chain(pitchShift, destination);
            console.log("Audio chain connected");
    
            // Get the processed audio track
            const processedAudioTrack = destination.stream.getAudioTracks()[0];
            
            // Add the processed audio track to the peer connection
            if (processedAudioTrack) {
                pc.addTrack(processedAudioTrack, stream);
                console.log("Processed audio track added to peer connection");
            } else {
                console.error("No processed audio track available");
            }
    
            // Add the video track directly
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                pc.addTrack(videoTrack, stream);
                console.log("Video track added to peer connection");
            }
    
            // Display local video
            const localVideo = document.createElement('video');
            localVideo.srcObject = new MediaStream([videoTrack]);
            localVideo.muted = true; // Mute local video to prevent feedback
            localVideo.play();
            document.body.appendChild(localVideo);
            console.log("Local video display set up");
    
        } catch (error) {
            console.error("Error in getMicAndSend:", error);
            throw error;
        }
    }
    const changePitch = (semitones: number) => {
        if (pitchShift) {
            pitchShift.pitch = semitones;
        }
    }
    return (
        <div>
            Sender
            <button onClick={initiateConn}>Send data</button>
            <input 
                type="range" 
                min="-12" 
                max="12" 
                defaultValue="0" 
                onChange={(e) => changePitch(parseInt(e.target.value))}
            />
        </div>
    )
}