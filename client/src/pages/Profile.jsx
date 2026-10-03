import React from 'react';
import Settings from './Settings';

export default function Profile({ user, setUser }) {
  return <Settings user={user} setUser={setUser} />;
}
