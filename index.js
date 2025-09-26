// Entry point for full-stack deployment
// This file builds the frontend and starts the backend server

const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting AgriTrace full-stack deployment...');

// Build frontend first
console.log('📦 Building frontend...');
const buildProcess = exec('cd frontend && npm run build', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Frontend build failed:', error);
        return;
    }
    console.log('✅ Frontend build completed');
    console.log(stdout);
    
    // Start the backend server after frontend is built
    startBackend();
});

function startBackend() {
    console.log('🔧 Starting backend server...');
    
    // Change to backend directory and start the server
    process.chdir(path.join(__dirname, 'backend'));

    // Start the backend server
    const server = spawn('node', ['server.js'], {
        stdio: 'inherit',
        env: { ...process.env }
    });

    server.on('error', (err) => {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    });

    server.on('close', (code) => {
        console.log(`🔴 Server process exited with code ${code}`);
        process.exit(code);
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('🛑 Received SIGINT, shutting down gracefully');
        server.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log('🛑 Received SIGTERM, shutting down gracefully');
        server.kill('SIGTERM');
    });
}
