import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, Trash2, Bell, Info, AlertCircle } from "lucide-react"; 
import useNotificationStore from "@/store/useNotificationStore";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day"
  ); 
}

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    hasFetched,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (!hasFetched) fetchNotifications();
  }, [hasFetched, fetchNotifications]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your latest trade activity.</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <CheckCheck size={18} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 animate-pulse">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border-2 border-dashed p-12 text-center">
          <div className="bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
          <p className="text-gray-500">You don't have any new notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`group relative flex items-start gap-4 p-5 rounded-xl border transition-all duration-200 ${
                item.isRead 
                ? "bg-white border-gray-100 hover:border-gray-300 shadow-sm" 
                : "bg-blue-50/50 border-blue-100 hover:border-blue-200 shadow-sm"
              }`}
            >
              {/* Status Indicator Dot */}
              {!item.isRead && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
              )}

              {/* Icon Based on Type (Fallback to Bell) */}
              <div className={`p-2 rounded-lg ${item.isRead ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-600"}`}>
                <Info size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div 
                    className="cursor-pointer"
                    onClick={() => !item.isRead && markAsRead(item._id)}
                  >
                    {item.linkTo ? (
                      <Link to={item.linkTo} className="block group-hover:text-blue-700">
                         <h3 className={`font-semibold ${item.isRead ? "text-gray-700" : "text-gray-900"}`}>
                          {item.title}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className={`font-semibold ${item.isRead ? "text-gray-700" : "text-gray-900"}`}>
                        {item.title}
                      </h3>
                    )}
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    <span className="text-xs text-gray-400 mt-2 block font-medium uppercase tracking-wider">
                      {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  {/* Action Buttons (Visible on hover) */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.isRead && (
                      <button
                        onClick={() => markAsRead(item._id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Mark as read"
                      >
                        <CheckCheck size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(item._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}