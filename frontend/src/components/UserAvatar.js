'use client';

import { useState } from 'react';

function getInitial(name) {
  return name ? name.trim().charAt(0).toUpperCase() : '?';
}

export default function UserAvatar({ user, size = 28 }) {
  const [imgError, setImgError] = useState(false);

  const hasAvatar = user?.avatar_url && !imgError;

  if (hasAvatar) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name || 'User avatar'}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="rounded-full border border-border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback: initial in a circle
  return (
    <div
      className="rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="font-medium text-accent" style={{ fontSize: size * 0.4 }}>
        {getInitial(user?.name)}
      </span>
    </div>
  );
}
