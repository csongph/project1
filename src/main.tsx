import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ตรวจสอบว่ามี clientId หรือไม่
if (!clientId) {
  console.error('VITE_GOOGLE_CLIENT_ID is not defined in environment variables');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {clientId ? (
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm bg-white border border-red-200 rounded-2xl p-8">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-neutral-900">Configuration Error</h1>
            <p className="text-sm text-neutral-500 mt-1">ไม่พบ Google Client ID</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">
              กรุณาตรวจสอบไฟล์ <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs">.env</code>
            </p>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            ตรวจสอบว่ามี <code className="bg-neutral-100 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> ในไฟล์ .env
          </p>
        </div>
      </div>
    )}
  </React.StrictMode>,
)