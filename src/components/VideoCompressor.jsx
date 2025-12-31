import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function VideoCompressor({ file, onCompressed, onCancel }) {
    const [status, setStatus] = useState('loading'); // loading, ready, compressing, done, error
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('Loading video engine...');
    const ffmpegRef = useRef(new FFmpeg());
    const messageRef = useRef(null);

    // Load FFmpeg
    useEffect(() => {
        load();
    }, []);

    const [logs, setLogs] = useState([]);

    const load = async () => {
        // Fallback to CDN if local files fail, but local is priority
        const localBaseURL = `${window.location.origin}/ffmpeg`;
        const cdnBaseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on('log', ({ message }) => {
            if (messageRef.current) messageRef.current.innerHTML = message;
            setLogs(prev => [...prev.slice(-19), message]);
        });

        ffmpeg.on('progress', ({ progress }) => {
            setProgress(Math.round(progress * 100));
        });

        if (!window.crossOriginIsolated) {
            setStatus('error');
            setMessage('Security Error: SharedArrayBuffer is not available.');
            return;
        }

        try {
            // First attempt: Local files
            try {
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${localBaseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${localBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
            } catch (localErr) {
                console.warn("Local FFmpeg load failed, trying CDN...", localErr);
                // Second attempt: CDN
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${cdnBaseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${cdnBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
            }
            setStatus('ready');
            setMessage('Ready to compress');
        } catch (error) {
            console.error('FFmpeg Load Error:', error);
            setStatus('error');
            setMessage(`Engine Error: ${error.message || 'Check connection'}.`);
        }
    };

    const compress = async () => {
        if (!file) return;
        setStatus('compressing');
        setMessage('Initializing...');
        setLogs([]);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input_${Date.now()}.mp4`;
        const outputName = `output_${Date.now()}.mp4`;

        try {
            const fileData = await fetchFile(file);
            await ffmpeg.writeFile(inputName, fileData);

            const ret = await ffmpeg.exec([
                '-y',
                '-i', inputName,
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', '32',
                '-tune', 'zerolatency',
                '-c:a', 'aac',
                '-b:a', '96k',
                '-movflags', '+faststart',
                outputName
            ]);

            if (ret !== 0) throw new Error(`FFmpeg error code: ${ret}`);

            const data = await ffmpeg.readFile(outputName);
            if (data.byteLength === 0) {
                throw new Error('Compression produced an empty file.');
            }

            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const compressedFile = new File([blob], file.name, { type: 'video/mp4' });

            setStatus('done');
            setMessage(`Done! Reduced to ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
            onCompressed(compressedFile);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage(`Compression failed: ${error.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/10 relative">
                <button
                    onClick={() => {
                        if (status === 'compressing') {
                            try { ffmpegRef.current.terminate(); } catch (e) { }
                        }
                        onCancel();
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h3 className="text-2xl font-black text-center mb-6 dark:text-white">In-App Compressor</h3>

                <div className="text-center mb-8">
                    {status === 'loading' && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <div className="text-blue-500 font-bold animate-pulse">{message}</div>
                            <p className="text-xs text-gray-400">This might take a few seconds if it's your first time.</p>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div>
                            <p className="mb-4 text-gray-600 dark:text-gray-300">
                                Reduce <span className="font-bold">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(1)}MB) to fit the 100MB limit.
                            </p>
                            <button
                                onClick={compress}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
                            >
                                Start Compression
                            </button>
                        </div>
                    )}

                    {status === 'compressing' && (
                        <div className="space-y-4">
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div className="bg-blue-600 h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-sm font-bold text-gray-500">{progress}% - {message}</p>
                            <p className="text-xs text-mono text-gray-400 truncate max-w-xs mx-auto mb-4" ref={messageRef}></p>

                            <div className="bg-black/5 dark:bg-black/40 p-2 rounded text-[9px] font-mono text-left max-h-24 overflow-y-auto mb-2 text-gray-500 custom-scrollbar">
                                {logs.map((log, i) => <div key={i} className="truncate">{log}</div>)}
                            </div>
                            <button
                                onClick={() => {
                                    try {
                                        ffmpegRef.current.terminate();
                                    } catch (e) { }
                                    onCancel();
                                }}
                                className="mt-4 px-6 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            >
                                Cancel Compression
                            </button>
                        </div>
                    )}

                    {status === 'done' && (
                        <div className="text-green-500 font-bold">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            <p className="mb-4">{message}</p>
                            <p className="text-sm text-gray-500">Uploading automatically...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-red-500">
                            <p className="font-bold mb-4">{message}</p>
                            <div className="bg-black/10 dark:bg-black/50 p-2 rounded text-[10px] font-mono text-left max-h-32 overflow-y-auto mb-4 text-gray-600 dark:text-gray-400">
                                {logs.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                            <button onClick={load} className="text-sm underline">Retry</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
