import React, { useEffect, useRef, useState } from "react";

export const Receiver = () => {
    const [play, setPlay] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://192.168.0.4:4000');
        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        }

        startReceiving(socket);

        return () => {
            socket.close();
            if (pcRef.current) {
                pcRef.current.close();
            }
        };
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.ontrack = (event) => {
            console.log("Track received:", event.track);
            if (event.track.kind === 'video' && videoRef.current) {
                videoRef.current.srcObject = new MediaStream([event.track]);
            } else if (event.track.kind === 'audio' && audioRef.current) {
                audioRef.current.srcObject = new MediaStream([event.track]);
            }
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                console.log("Candidates added");
                pc.addIceCandidate(message.candidate);
            }
        };
    }

    const handlePlay = () => {
        setPlay(true);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.play().catch((error) => {
                console.error('Error playing video:', error);
            });
        }
        if (audioRef.current && audioRef.current.srcObject) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    // Autoplay started!
                }).catch(error => {
                    console.error('Autoplay error:', error);
                    // Autoplay was prevented.
                    // Show a "Play" button so user can start playback manually.
                });
            }
        }
    };

    return (
        <div>
            <button onClick={handlePlay}>Play Video and Audio</button>
            <video ref={videoRef} autoPlay controls />
            <audio ref={audioRef} />
            <p>Receiver</p>
        </div>
    );
};
