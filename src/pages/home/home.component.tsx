import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import ButtonComponent from '../../core/shared/button/button.component';
import InputComponent from '../../core/shared/input/input.component';
import { useHomeMainStyle } from './home.style';
import { Routes } from '../../router/routes';

// Type definitions
interface UserModel {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

interface ChatModel {
  userId: string;
  message: string;
  date: string;
}

const HomeComponent: React.FC = () => {
  const navigate = useNavigate();
  const { homeMain, titleHome, userName, homeChild } = useHomeMainStyle();

  const [users, setUsers] = useState<UserModel[]>([]);
  const [chats, setChats] = useState<ChatModel[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
  const [message, setMessage] = useState<string>('');
  const [connection, setConnection] = useState<HubConnection | null>(null);

  const user = JSON.parse(localStorage.getItem('accessToken') || '{}') as UserModel;

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7123/chat-hub') 
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        console.log('SignalR Connected.');
        newConnection.invoke('Connect', user.id);

        newConnection.on('Users', (res: UserModel) => {
          setUsers(prevUsers =>
            prevUsers.map(user => (user.id === res.id ? { ...user, status: res.status } : user))
          );
        });

        newConnection.on('Messages', (res: ChatModel) => {
          if (selectedUserId === res.userId) {
            setChats(prevChats => [...prevChats, res]);
          }
        });
      })
      .catch(err => console.error('SignalR Connection Error: ', err));


    return () => {
      newConnection.stop().catch(err => console.error('SignalR Disconnection Error: ', err));
    };
  }, [user.id, selectedUserId]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch('https://localhost:7123/api/Chats/GetUsers');
      const data = await response.json();
      setUsers(data.filter((p: UserModel) => p.id !== user.id));
    };
    fetchUsers();
  }, [user.id]);

  const handleUserClick = (user: UserModel) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);

    fetch(`https://localhost:7123/api/Chats/GetChats?userId=${user.id}&toUserId=${selectedUserId}`)
      .then(response => response.json())
      .then(data => setChats(data));
  };

  const handleLogOut = () => {
    localStorage.clear();
    navigate('/' + Routes.signin);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (selectedUser && message.trim() && connection) {
      const data = {
        userId: user.id,
        toUserId: selectedUserId,
        message: message,
      };

      await fetch('https://localhost:7123/api/Chats/SendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => response.json())
      .then((res: ChatModel) => {
        setChats(prevChats => [...prevChats, res]);
        setMessage('');
      });
    }
  };

  return (
    <div className={homeMain}>
      <div className={homeChild}>
        <h1 className={titleHome}>TS ChatAPP</h1>
        <ButtonComponent
          content="Log out"
          btnClassName='buttonMain'
          type="button"
          onClick={handleLogOut}
        />
        <div style={{ display: 'flex' }}>
          <div style={{ width: '300px', borderRight: '1px solid #ddd' }}>
            <InputComponent
              type="text"
              placeholder="Search..."
              style={{ width: '100%', padding: '8px' }}
            />
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {users.map(user => (
                <li
                  key={user.id}
                  style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #ddd' }}
                  onClick={() => handleUserClick(user)}
                >
                  <img
                    src={`https://localhost:7123/avatar/${user.avatar}`}
                    alt="avatar"
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  />
                  <div>
                    <div>{user.name}</div>
                    <div>{user.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flexGrow: 1, padding: '10px' }}>
            {selectedUser && (
              <div>
                <div>
                  <img
                    src={`https://localhost:7123/avatar/${selectedUser.avatar}`}
                    alt="avatar"
                    style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                  />
                  <div>
                    <h6>{selectedUser.name}</h6>
                    <small>{selectedUser.status}</small>
                  </div>
                </div>
                <div style={{ height: '600px', overflowY: 'scroll' }}>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {chats.map((chat, index) => (
                      <li
                        key={index}
                        style={{
                          display: 'flex',
                          flexDirection: chat.userId === user.id ? 'row-reverse' : 'row',
                          padding: '5px',
                        }}
                      >
                        <div style={{ padding: '5px' }}>
                          <span style={{ fontSize: '0.8em', color: '#888' }}>{chat.date}</span>
                        </div>
                        <div
                          style={{
                            backgroundColor: chat.userId === user.id ? '#dcf8c6' : '#fff',
                            borderRadius: '5px',
                            padding: '10px',
                            maxWidth: '70%',
                          }}
                        >
                          {chat.message}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <InputComponent
                    type="text"
                    placeholder="Enter text here..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{ width: '80%', marginRight: '10px' }}
                  />
                  <ButtonComponent
                    content="Send"
                    btnClassName='buttonMain'
                    type="button"
                    onClick={handleSendMessage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeComponent;
