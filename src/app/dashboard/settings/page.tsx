'use client';

import { useState } from 'react';
import { IconBell, IconLock, IconMail } from '@tabler/icons-react';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'event-notifications',
      title: 'Event Notifications',
      description: 'Receive notifications about upcoming events and activities',
      enabled: true
    },
    {
      id: 'email-updates',
      title: 'Email Updates',
      description: 'Receive email updates about NSA ULM news and announcements',
      enabled: true
    },
    {
      id: 'reminder-notifications',
      title: 'Event Reminders',
      description: 'Get reminders before events you\'ve shown interest in',
      enabled: false
    }
  ]);

  const toggleNotification = (id: string) => {
    setNotificationSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center gap-2 mb-6">
              <IconBell className="h-6 w-6 text-crimson-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
            </div>

            <div className="space-y-4">
              {notificationSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{setting.title}</h3>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(setting.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      setting.enabled ? 'bg-crimson-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        setting.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center gap-2 mb-6">
              <IconMail className="h-6 w-6 text-crimson-600" />
              <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Manage your email preferences and communication settings.
              </p>
              <button className="text-sm text-crimson-600 hover:text-crimson-700">
                Change Email Address
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center gap-2 mb-6">
              <IconLock className="h-6 w-6 text-crimson-600" />
              <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
            </div>

            <div className="space-y-4">
              <button className="text-sm text-crimson-600 hover:text-crimson-700">
                Change Password
              </button>
              <button className="text-sm text-crimson-600 hover:text-crimson-700">
                Two-Factor Authentication
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 