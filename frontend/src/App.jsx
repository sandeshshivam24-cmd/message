import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import { AuthModal } from './components/auth/AuthModal';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { CallModal } from './components/call/CallModal';
import { FloatingVideo } from './components/call/FloatingVideo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { RefreshCw, WifiOff } from 'lucide-react';

const MainLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const { activeConversation, selectConversation, connectionStatus } = useSocket();

  // On mobile: if activeConversation is set, show chat view, else sidebar
  const [isMobileChatActive, setIsMobileChatActive] = useState(false);

  // Dynamic visualViewport adaptation for mobile keyboards (Android Chrome)
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      const vh = window.visualViewport.height;
      document.documentElement.style.setProperty('--visual-viewport-height', `${vh}px`);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();
    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    if (activeConversation) {
      setIsMobileChatActive(true);
    }
  }, [activeConversation]);

  const handleBackToSidebar = () => {
    setIsMobileChatActive(false);
    selectConversation(null);
  };

  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'var(--bg-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          fontWeight: 600
        }}
      >
        Loading Messenger...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="app-container">
      {/* Network Connection Status Banner */}
      {connectionStatus !== 'connected' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: connectionStatus === 'connecting' ? '#f59e0b' : '#f43f5e',
            color: 'white',
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textAlign: 'center',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {connectionStatus === 'connecting' ? (
            <>
              <RefreshCw size={14} className="spin" /> Connecting to server...
            </>
          ) : (
            <>
              <WifiOff size={14} /> Connection lost. Attempting to reconnect...
            </>
          )}
        </div>
      )}

      <Sidebar isMobileHidden={isMobileChatActive} />
      <ChatArea
        isMobileHidden={!isMobileChatActive}
        onBackMobile={handleBackToSidebar}
      />
      <CallModal />
      <FloatingVideo />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <MainLayout />
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
