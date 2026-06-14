export default function SettingsNotificationsPage() {
  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-1">Notification Preferences</h1>
      <p className="text-sm text-gray-500 mb-8">Choose what triggers email notifications.</p>

      <div className="space-y-4">
        {[
          { key: 'follow', label: 'New follower', description: 'When someone follows you' },
          { key: 'comment', label: 'Comments', description: 'When someone comments on your devlog' },
          { key: 'reaction', label: 'Reactions', description: 'When someone reacts to your devlog' },
          { key: 'reply', label: 'Replies', description: 'When someone replies to your comment' },
        ].map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <span className="text-xs font-mono text-gray-400">Email preferences coming soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}
