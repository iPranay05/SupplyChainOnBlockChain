import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Flashlight, FlashlightOff, RotateCcw } from 'lucide-react';
import jsQR from 'jsqr';

export default function MobileQRScanner({ onScan, onClose }) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [hasFlash, setHasFlash] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const scanningIntervalRef = useRef(null);

    useEffect(() => {
        // Check camera permissions on component mount
        checkCameraPermissions();
        return () => {
            stopCamera();
        };
    }, []);

    const checkCameraPermissions = async () => {
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' });
                console.log('Camera permission status:', permission.state);
                
                if (permission.state === 'denied') {
                    setError('🚫 Camera access is BLOCKED. Click the camera icon in your address bar and select "Allow", then refresh this page.');
                }
            }
        } catch (err) {
            console.log('Permission API not supported');
        }
    };

    const startCamera = async () => {
        try {
            setError('');
            setScanning(true);

            // Check if device has camera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                
                // Start real QR code scanning
                startQRScanning();
            }

            // Check if device has flash
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            setHasFlash(capabilities.torch === true);

        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please check permissions.');
            setScanning(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scanningIntervalRef.current) {
            clearInterval(scanningIntervalRef.current);
            scanningIntervalRef.current = null;
        }
        setScanning(false);
        setFlashOn(false);
    };

    const toggleFlash = async () => {
        if (!streamRef.current || !hasFlash) return;

        try {
            const track = streamRef.current.getVideoTracks()[0];
            await track.applyConstraints({
                advanced: [{ torch: !flashOn }]
            });
            setFlashOn(!flashOn);
        } catch (err) {
            console.error('Flash error:', err);
        }
    };

    const switchCamera = () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);
        
        if (scanning) {
            stopCamera();
            setTimeout(() => {
                startCamera();
            }, 100);
        }
    };

    const startQRScanning = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const scanQRCode = () => {
            if (!scanning || !video.videoWidth || !video.videoHeight) return;

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data from canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Try to decode QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                console.log('QR Code detected:', code.data);
                onScan(code.data);
                stopCamera();
            }
        };

        // Scan for QR codes every 100ms
        scanningIntervalRef.current = setInterval(scanQRCode, 100);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setError('');
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0);
                    
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        console.log('QR Code detected from file:', code.data);
                        onScan(code.data);
                    } else {
                        setError('No QR code found in the uploaded image.');
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black text-white">
                <h2 className="text-lg font-semibold">QR Scanner</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative">
                {scanning ? (
                    <div className="relative w-full h-full">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />
                        
                        {/* Hidden canvas for QR code processing */}
                        <canvas
                            ref={canvasRef}
                            className="hidden"
                        />
                        
                        {/* QR Scanning Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                {/* Scanning Frame */}
                                <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                                    {/* Corner indicators */}
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                                    
                                    {/* Scanning line animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 animate-pulse"></div>
                                </div>
                                
                                <p className="text-white text-center mt-4 text-sm">
                                    Position QR code within the frame
                                </p>
                            </div>
                        </div>

                        {/* Camera Controls */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                            {hasFlash && (
                                <button
                                    onClick={toggleFlash}
                                    className={`p-3 rounded-full ${flashOn ? 'bg-yellow-500' : 'bg-gray-800'} text-white`}
                                >
                                    {flashOn ? <FlashlightOff className="w-6 h-6" /> : <Flashlight className="w-6 h-6" />}
                                </button>
                            )}
                            
                            <button
                                onClick={switchCamera}
                                className="p-3 rounded-full bg-gray-800 text-white"
                            >
                                <RotateCcw className="w-6 h-6" />
                            </button>
                            
                            <button
                                onClick={stopCamera}
                                className="px-6 py-3 bg-red-600 text-white rounded-full font-medium"
                            >
                                Stop Camera
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white space-y-6">
                        <Camera className="w-24 h-24 text-gray-400" />
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">Ready to Scan</h3>
                            <p className="text-gray-300">
                                Scan QR codes on product packaging to view supply chain information
                            </p>
                        </div>
                        
                        <div className="space-y-3 w-full max-w-xs px-4">
                            <button
                                onClick={startCamera}
                                className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium"
                            >
                                <Camera className="w-5 h-5" />
                                <span>Start Camera</span>
                            </button>
                            
                            <button
                                onClick={checkCameraPermissions}
                                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm"
                            >
                                <span>Check Permissions</span>
                            </button>
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center space-x-2 bg-gray-700 text-white py-3 px-6 rounded-lg font-medium"
                            >
                                <Upload className="w-5 h-5" />
                                <span>Upload Image</span>
                            </button>
                            
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                className="hidden"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="absolute bottom-20 left-4 right-4 bg-red-600 text-white p-3 rounded-lg">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-900 text-white p-4 text-center">
                <p className="text-sm text-gray-300">
                    📱 Hold your phone steady and ensure good lighting for best results
                </p>
            </div>
        </div>
    );
}