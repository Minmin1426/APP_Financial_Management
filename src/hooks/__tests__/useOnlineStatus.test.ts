import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('Kiểm thử Hook useOnlineStatus', () => {
  test('Trả về trạng thái mặc định là một giá trị boolean', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(typeof result.current).toBe('boolean');
  });

  test('Cập nhật trạng thái thành false khi hệ thống mất kết nối (offline)', () => {
    const { result } = renderHook(() => useOnlineStatus());

    // Bắn sự kiện offline nhân tạo
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });

  test('Cập nhật trạng thái thành true khi hệ thống có kết nối lại (online)', () => {
    const { result } = renderHook(() => useOnlineStatus());

    // Đưa về trạng thái offline trước
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    // Bắn sự kiện online nhân tạo
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
