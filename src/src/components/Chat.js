import React, { useState, useRef } from 'react';
import '../styles/Chat.css';



function playAudio(audioBase64) {
    const audioBytes = new Uint8Array(atob(audioBase64).split("").map(char => char.charCodeAt(0)));
    const audioBlob = new Blob([audioBytes], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
}



function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);

    const handleStartRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };
        mediaRecorderRef.current.onstop = handleAudioData;
        mediaRecorderRef.current.start();
        setIsRecording(true);
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioData = () => {
        sendAudioToBackend();
    };

    const sendAudioToBackend = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', blob);
// http://127.0.0.1:8001
        try {
            const response = await fetch('http://flask-backend-production-6aa9.up.railway.app/send_audio', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setMessages([...messages, { type: 'user', content: data.transcription }, { type: 'bot', content: data.response }]);
            setInput('');

            
        // Play the audio response if it exists
        if (data.audio) {
            playAudio(data.audio);
        }



        } catch (error) {
            console.error('Error sending text:', error);
        }
    };

    const handleSendText = async () => {
        try {
            const response = await fetch('http://flask-backend-production-6aa9.up.railway.app/send_text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });
            const data = await response.json();
            setMessages([...messages, { type: 'user', content: input }, { type: 'bot', content: data.response }]);
            setInput('');

            
        // Play the audio response if it exists
        if (data.audio) {
            playAudio(data.audio);
        }



        } catch (error) {
            console.error('Error sending text:', error);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                        {message.content}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendText}>Send</button>
                <button onClick={handleStartRecording}>Start Recording</button>
                <button onClick={handleStopRecording} disabled={!isRecording}>Stop & Send</button>
            </div>
        </div>
    );
}

export default Chat;
