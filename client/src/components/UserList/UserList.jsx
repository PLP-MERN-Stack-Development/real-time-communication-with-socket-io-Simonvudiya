// src/components/UserList/UserList.jsx
import './UserList.css';

const UserList = ({ users, typingUsers }) => {
  return (
    <div className="user-list">
      <h4>Users</h4>
      <ul>
        {users.map((u) => (
          <li key={u.id || u.username}>
            {u.username || u}
            {typingUsers.includes(u.username || u) && <span className="typing"> • typing</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
