// components/teleconsulta/VideoFeed.tsx
import React, { useEffect, useRef } from 'react';
import { User, VideoOff } from 'lucide-react';

interface VideoFeedProps {
    stream: MediaStream | null;
    isMuted: boolean;
    isCameraOn: boolean;
    username: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ stream, isMuted, isCameraOn, username }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
            {isCameraOn ? (
                <video ref={videoRef} autoPlay playsInline muted={isMuted} className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center text-slate-400">
                    <User className="w-16 h-16" />
                    <p className="mt-2 font-semibold">{username}</p>
                    <div className="mt-1 flex items-center text-xs bg-slate-700 px-2 py-1 rounded-full">
                        <VideoOff className="w-3 h-3 mr-1.5" />
                        Câmera desligada
                    </div>
                </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                {username}
            </div>
        </div>
    );
};

export default VideoFeed;
