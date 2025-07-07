export default function ChatUsers({ admins, users }) {
  return (
    <aside className="chat-sidebar">
      <h3>Adminok</h3>
      <div className="chat-user-list">
        {admins.length === 0 && <div className="chat-user admin">Nincs admin</div>}
        {admins.map(u => (
          <div key={u.neptun} className="chat-user admin">
            {u.name} <span>({u.neptun})</span>
          </div>
        ))}
      </div>
      <h3>Felhasználók</h3>
      <div className="chat-user-list">
        {users.length === 0 && <div className="chat-user">Nincs felhasználó</div>}
        {users.map(u => (
          <div key={u.neptun} className="chat-user">
            {u.name} <span>({u.neptun})</span>
          </div>
        ))}
      </div>
    </aside>
  );
}