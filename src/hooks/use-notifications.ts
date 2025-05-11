import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  reminder_id: string | null;
  type: string;
  title: string;
  message: string;
  data: { path?: string; [key: string]: unknown } | null; // Reverted to original specific object type or null
  is_read: boolean;
  created_at: string;
}

const NOTIFICATIONS_QUERY_KEY = 'notifications';

export const useNotifications = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[], Error>({
    queryKey: [NOTIFICATIONS_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Fetch a reasonable number of recent notifications

      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications.');
        throw error;
      }
      return (data || []) as Notification[]; // Explicit cast
    },
    enabled: !!user && !authLoading,
  });

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user || !queryClient) {
      return;
    }

    const channel = supabase
      .channel(`realtime-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          queryClient.setQueryData<Notification[]>([NOTIFICATIONS_QUERY_KEY, user.id], (oldData) => {
            if (oldData && oldData.find(n => n.id === newNotification.id)) {
              return oldData; // Avoid duplicates
            }
            // Add new notification to the beginning of the list
            return [newNotification, ...(oldData || [])]; 
          });

          toast.info(newNotification.title, { 
            description: newNotification.message,
            // Example: Add an action to navigate, if you have a router instance available here
            // action: { label: 'View', onClick: () => router.push(newNotification.data?.path || '/notifications') }
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to realtime notifications channel.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime notifications channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.warn('Realtime notifications channel timed out.');
        } else if (status === 'CLOSED') {
          console.log('Realtime notifications channel closed.');
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
          .then(() => console.log('Unsubscribed from realtime notifications channel.'))
          .catch(err => console.error('Error unsubscribing from realtime notifications:', err));
      }
    };
  }, [user, queryClient]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Mark a single notification as read
  const markAsReadMutation = useMutation<Notification, Error, string>({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id || '') // Ensure user can only update their own
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Notification not found or not authorized to update.');
      return data as Notification; // Explicit cast
    },
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<Notification[]>([NOTIFICATIONS_QUERY_KEY, user?.id], (oldData) =>
        oldData ? oldData.map(n => n.id === updatedNotification.id ? updatedNotification : n) : []
      );
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read.');
    },
  });

  // Mark all unread notifications as read
  const markAllAsReadMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false); // Only update unread ones

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>([NOTIFICATIONS_QUERY_KEY, user?.id], (oldData) =>
        oldData ? oldData.map(n => ({ ...n, is_read: true })) : []
      );
      toast.success('All notifications marked as read.');
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read.');
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading: authLoading || notificationsLoading,
    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutate,
    markAllAsReadAsync: markAllAsReadMutation.mutateAsync,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};
