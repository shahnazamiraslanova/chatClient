import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonComponent from '../../core/shared/button/button.component';
import axiosInstance from '../../core/configs/axios.config';
import { Routes } from '../../router/routes';
import { useHomeMainStyle } from './home.style';
import * as signalR from '@microsoft/signalr';

interface UserModel {
  id: string;
  name: string;
  avatar: string;
  status: string;
}

interface ChatModel {
  id: string;
  userId: string;
  date: string;
  message: string;
}

const HomeComponent: React.FC = () => {
  const navigate = useNavigate();
  const { homeMain, titleHome, userName, homeChild } = useHomeMainStyle();
  const [userNamefromLocal, setUsernamefromLocal] = useState<string | null>(localStorage.getItem('userName'));
  const [users, setUsers] = useState<UserModel[]>([]);
  const [chats, setChats] = useState<ChatModel[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get<UserModel[]>('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    const hub = new signalR.HubConnectionBuilder().withUrl("https://localhost:7123/chat-hub").build();
    hub.start().then(() => {
      console.log("Connection is started...");
      hub.invoke("Connect", localStorage.getItem('userId'));

      hub.on("Users", (user: UserModel) => {
        setUsers(users => users.map(u => u.id === user.id ? { ...u, status: user.status } : u));
      });

      hub.on("Messages", (chat: ChatModel) => {
        if (selectedUser && selectedUser.id === chat.userId) {
          setChats(chats => [...chats, chat]);
        }
      });
    });

    return () => {
      hub.stop();
    };
  }, [selectedUser]);

  const handleLogOut = () => {
    localStorage.clear();
    navigate('/' + Routes.signin);
  };

  const changeUser = async (user: UserModel) => {
    setSelectedUser(user);
    try {
      const response = await axiosInstance.get<ChatModel[]>(`/chats?userId=${localStorage.getItem('userId')}&toUserId=${user.id}`);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const sendMessage = async () => {
    if (selectedUser) {
      try {
        const response = await axiosInstance.post<ChatModel>('/chats/send', { userId: localStorage.getItem('userId'), toUserId: selectedUser.id, message });
        setChats(chats => [...chats, response.data]);
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  return (
    <div className={homeMain}>
      <div className={homeChild}>
        <h2 className={titleHome}>Welcome</h2>
        <h2 className={userName}>{userNamefromLocal}</h2>
        <ButtonComponent
          content="Log out"
          btnClassName='buttonMain'
          type="button"
          onClick={handleLogOut}
        />
        {/* Chat UI */}
        <div className="chat-app">
          <div className="people-list">
            <div className="input-group" style={{ position: 'relative' }}>
              <input type="text" className="form-control" placeholder="Search..." style={{ paddingLeft: '35px' }} />
              <i className="fa fa-search" style={{ position: 'absolute', top: '10px', left: '15px' }}></i>
            </div>
            <ul className="list-unstyled chat-list mt-2 mb-0">
              {users.map(user => (
                <li
                  key={user.id}
                  className={`clearfix ${selectedUser && selectedUser.id === user.id ? 'active' : ''}`}
                  onClick={() => changeUser(user)}
                >
                  <img src={`https://localhost:7123/avatar/${user.avatar}`} alt="avatar" />
                  <div className="about">
                    <div className="name">{user.name}</div>
                    <div className="status">
                      <i className={`fa fa-circle ${user.status === 'online' ? 'online' : 'offline'}`}></i> {user.status}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {selectedUser && (
            <div className="chat">
              <div className="chat-header clearfix">
                <div className="row">
                  <div className="col-lg-6">
                    <a href="javascript:void(0);">
                      <img src={`https://localhost:7123/avatar/${selectedUser.avatar}`} alt="avatar" />
                    </a>
                    <div className="chat-about">
                      <h6 className="m-b-0">{selectedUser.name}</h6>
                      <small>{selectedUser.status}</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="chat-history" style={{ height: '600px' }}>
                <ul className="m-b-0">
                  {chats.map(chat => (
                    <li
                      key={chat.id}
                      className={`clearfix ${selectedUser.id === chat.userId ? 'd-flex' : ''}`}
                      style={{ flexDirection: 'column', width: '100%', alignItems: selectedUser.id === chat.userId ? 'flex-end' : 'flex-start' }}
                    >
                      <div className="message-data">
                        <span className="message-data-time">{chat.date}</span>
                      </div>
                      <div className={`message ${selectedUser.id === chat.userId ? 'my-message' : 'other-message'}`}>
                        {chat.message}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="chat-message clearfix">
                <div className="input-group mb-0">
                  <div className="input-group-prepend" onClick={sendMessage}>
                    <span className="input-group-text"><i className="fa fa-send"></i></span>
                  </div>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    type="text"
                    className="form-control"
                    placeholder="Enter text here..."
                    style={{ height: '30px' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeComponent;
