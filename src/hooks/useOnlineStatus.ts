import { useState, useEffect } from 'react';

/**
 * Custom Hook theo dõi trạng thái kết nối Internet của trình duyệt.
 * 
 * @returns true nếu thiết bị đang trực tuyến (online), ngược lại false (offline)
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Tránh lỗi khi chạy trong môi trường SSR (nếu có)
    if (typeof window !== 'undefined' && 'navigator' in window) {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    // Hàm cập nhật trạng thái khi kết nối thay đổi
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Đăng ký lắng nghe sự kiện của hệ thống
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Hủy đăng ký khi component bị unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
