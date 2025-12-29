// Backend API Configuration
// This file is loaded before preview.html
// For production, update the API_URL below to your deployed backend URL

(function() {
    // Try to get API URL from environment variable (for Vercel)
    // Or use the default localhost for development
    const getApiUrl = function() {
        // Check if we're in a browser environment with config
        if (typeof window !== 'undefined' && window.location) {
            // In production, you can set this via Vercel environment variables
            // and inject it during build, or update this file directly
            const hostname = window.location.hostname;
            
            // If running on Vercel (production), use your backend URL
            if (hostname.includes('vercel.app') || hostname !== 'localhost') {
                // TODO: Replace with your actual backend URL after deployment
                // Example: return 'https://your-backend.railway.app';
                return 'http://localhost:3001'; // Change this after deploying backend
            }
        }
        return 'http://localhost:3001';
    };
    
    window.APP_CONFIG = {
        API_URL: getApiUrl()
    };
    
    console.log('App Config loaded. API URL:', window.APP_CONFIG.API_URL);
})();
