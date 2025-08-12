import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './authcontext';
import toast from 'react-hot-toast';

const NotificationContext = createContext({});

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    telegram: true,
    browser: true,
    winAlerts: true,
    gameReminders: true,
    promotions: false
  });

  // Real-time listener for user notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsList);
      
      // Count unread notifications
      const unread = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      setLoading(false);

      // Show toast for new notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !change.doc.data().read) {
          const notification = change.doc.data();
          showNotificationToast(notification);
        }
      });
    }, (error) => {
      console.error('Notifications listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show notification toast
  const showNotificationToast = (notification) => {
    const { type, title, message } = notification;

    switch (type) {
      case 'win':
        toast.success(
          <div>
            <strong>🎉 {title}</strong>
            <p className="text-sm">{message}</p>
          </div>,
          { duration: 6000 }
        );
        break;
      
      case 'game_reminder':
        toast(
          <div>
            <strong>🏈 {title}</strong>
            <p className="text-sm">{message}</p>
          </div>,
          { duration: 5000 }
        );
        break;
      
      case 'consolation':
        toast(
          <div>
            <strong>🎁 {title}</strong>
            <p className="text-sm">{message}</p>
          </div>,
          { duration: 5000, icon: '🎁' }
        );
        break;
      
      case 'payout':
        toast.success(
          <div>
            <strong>💰 {title}</strong>
            <p className="text-sm">{message}</p>
          </div>,
          { duration: 6000 }
        );
        break;
      
      default:
        toast(message, { duration: 4000 });
    }

    // Show browser notification if permitted
    if (notificationPreferences.browser && Notification.permission === 'granted') {
      showBrowserNotification(notification);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const { title, message, type } = notification;
      const icons = {
        win: '🎉',
        game_reminder: '🏈',
        consolation: '🎁',
        payout: '💰',
        info: 'ℹ️'
      };

      new Notification(`${icons[type] || ''} ${title}`, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: type === 'win' || type === 'payout'
      });
    } catch (error) {
      console.error('Browser notification error:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!user) return;

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: serverTimestamp()
        })
      );

      await Promise.all(updatePromises);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Update notification preferences
  const updatePreferences = async (newPreferences) => {
    if (!user) return;

    try {
      // Update local state
      setNotificationPreferences(newPreferences);

      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        'notifications': newPreferences
      });

      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Update preferences error:', error);
      toast.error('Failed to update preferences');
    }
  };

  // Send test notification
  const sendTestNotification = () => {
    const testNotification = {
      id: 'test-' + Date.now(),
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification to check your settings.',
      createdAt: new Date(),
      read: false
    };

    showNotificationToast(testNotification);
  };

  // Get notification badge color based on type
  const getNotificationColor = (type) => {
    const colors = {
      win: 'bg-green-100 text-green-800',
      game_reminder: 'bg-blue-100 text-blue-800',
      consolation: 'bg-purple-100 text-purple-800',
      payout: 'bg-yellow-100 text-yellow-800',
      warning: 'bg-red-100 text-red-800',
      info: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.info;
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      win: '🎉',
      game_reminder: '🏈',
      consolation: '🎁',
      payout: '💰',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    notificationPreferences,
    
    // Functions
    markAsRead,
    markAllAsRead,
    updatePreferences,
    requestNotificationPermission,
    sendTestNotification,
    getNotificationColor,
    getNotificationIcon
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}