import { useState, useEffect } from 'react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { SyncService, type SyncResult } from './services/syncService';
import { populateDefaultData } from './db/populate';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { BudgetManager } from './features/budget/components/BudgetManager';
import { ReportsPage } from './features/reports/ReportsPage';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Home,
  PieChart,
  Wallet
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'budget' | 'reports';

function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark'; // sleeker default
  });

  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Áp dụng chủ đề sáng/tối
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Khởi chạy mặc định
  useEffect(() => {
    async function initDb() {
      await populateDefaultData();
    }
    initDb();
  }, []);

  const handleSync = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      const result = await SyncService.sync();
      setSyncResult(result);
    } catch (err: any) {
      console.error('Lỗi đồng bộ:', err);
    } finally {
      setSyncing(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Render view tương ứng với tab đang hoạt động
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'budget':
        return <BudgetManager />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* CSS Nhúng cho animation và các lớp bổ trợ */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-custom {
          animation: spin 1.2s linear infinite;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .nav-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }
        .nav-item.active {
          color: #ffffff;
          background: var(--accent-gradient);
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
        }
      `}</style>

      {/* Header chính với Glassmorphic Effect */}
      <header className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        borderRadius: 0,
        boxShadow: 'var(--shadow-sm)',
        padding: '12px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Logo ứng dụng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <div style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: 'var(--radius-sm)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                Antigravity Pay
              </h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Tài Chính Cá Nhân</span>
            </div>
          </div>

          {/* Điều phối Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Home size={16} />
              <span>Tổng quan</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
            >
              <PieChart size={16} />
              <span>Ngân sách</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <RefreshCw size={16} />
              <span>Báo cáo</span>
            </button>
          </nav>

          {/* Công cụ góc phải (Theme switcher, Network status, Sync Button) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Nút chuyển chế độ Sáng / Tối */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)'
              }}
              title={theme === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Chỉ báo mạng */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: '600',
              backgroundColor: isOnline ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
              color: isOnline ? 'var(--color-income)' : 'var(--color-expense)',
              border: `1px solid ${isOnline ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}`
            }}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
            </div>

            {/* Nút đồng bộ Cloud */}
            <button
              className="btn btn-secondary"
              onClick={handleSync}
              disabled={syncing || !isOnline}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                opacity: (!isOnline || syncing) ? 0.6 : 1,
                cursor: (!isOnline || syncing) ? 'not-allowed' : 'pointer'
              }}
              title="Đồng bộ dữ liệu"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin-custom' : ''} />
              <span>Đồng bộ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Banner thông báo đồng bộ thành công/thất bại */}
      {syncResult && (
        <div style={{
          backgroundColor: syncResult.success ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
          borderBottom: `1px solid ${syncResult.success ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}`,
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          {syncResult.success ? (
            <CheckCircle size={16} style={{ color: 'var(--color-income)' }} />
          ) : (
            <AlertCircle size={16} style={{ color: 'var(--color-expense)' }} />
          )}
          <span style={{ fontWeight: 500 }}>
            {syncResult.message} (Gửi lên: {syncResult.sentCount.transactions} gd, Nhận về: {syncResult.receivedCount.transactions} gd)
          </span>
          <button 
            onClick={() => setSyncResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '10px', textDecoration: 'underline' }}
          >
            Đóng
          </button>
        </div>
      )}

      {/* Nội dung chính hiển thị View */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {renderActiveView()}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: 'var(--text-tertiary)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div>&copy; 2026 Ứng dụng Quản lý Tài chính Cá nhân Antigravity.</div>
        <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Bảo lưu mọi quyền. Hoạt động Offline-first & Đồng bộ Neon PostgreSQL.
        </div>
      </footer>
    </div>
  );
}

export default App;
