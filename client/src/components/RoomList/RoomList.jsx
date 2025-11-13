// src/components/RoomList/RoomList.jsx
import './RoomList.css';

const RoomList = ({ rooms = [], currentRoom, onJoinRoom }) => {
  return (
    <div className="room-list">
      <h4>Rooms</h4>
      <ul>
        {rooms.map((r) => (
          <li key={r}>
            <button
              className={r === currentRoom ? 'active' : ''}
              onClick={() => onJoinRoom(r)}
            >
              #{r}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomList;
