// Entry point for deployment
// This file starts the backend server

const path = require('path');
const { spawn } = require('child_process');

// Change to backend directory and start the server
process.chdir(path.join(__dirname, 'backend'));

// Start the backend server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env }
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    server.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.kill('SIGTERM');
});
