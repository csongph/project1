import { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Notification } from '../types/googleClassroom';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
}

function NotificationCenter({ notifications, onMarkAsRead, onDismiss }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>(notifications);

  useEffect(() => {
    setDisplayedNotifications(notifications);
  }, [notifications]);

  const unreadCount = displayedNotifications.filter(n => !n.read).length;
  const urgentCount = displayedNotifications.filter(n => n.type === 'URGENT' && !n.read).length;

  const handleMarkAsRead = (id: string) => {
    onMarkAsRead?.(id);
    setDisplayedNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDismiss = (id: string) => {
    onDismiss?.(id);
    setDisplayedNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'URGENT':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'URGENT':
        return 'bg-red-50 border-red-200';
      case 'WARNING':
        return 'bg-amber-50 border-amber-200';
      case 'INFO':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className={`absolute top-0 right-0 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center ${
            urgentCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between border-b border-blue-800">
            <h3 className="font-bold text-lg">แจ้งเตือน</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {displayedNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold">ไม่มีแจ้งเตือน</p>
              <p className="text-sm">คุณติดตามทุกงานแล้ว!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getNotificationBgColor(notification.type)} ${
                    notification.type === 'URGENT' ? 'border-l-red-600' :
                    notification.type === 'WARNING' ? 'border-l-amber-600' :
                    'border-l-blue-600'
                  } hover:shadow-md transition-all cursor-pointer`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm">{notification.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.timestamp).toLocaleTimeString('th-TH')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notification.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {displayedNotifications.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setDisplayedNotifications([]);
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                ล้างแจ้งเตือนทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Urgent Notification Banner */}
      {urgentCount > 0 && !isOpen && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white rounded-lg p-4 shadow-lg animate-pulse max-w-sm z-40">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">มีงานเร่งด่วน!</p>
              <p className="text-sm text-red-100">คุณมีงาน {urgentCount} ชิ้นที่เหลือเวลาไม่ถึง 24 ชั่วโมง</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
