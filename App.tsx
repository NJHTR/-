import React, { useState, useEffect, useCallback } from 'react';
import Layout from 'antd/es/layout';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Menu from 'antd/es/menu';
import message from 'antd/es/message';
import Tooltip from 'antd/es/tooltip';
import Popconfirm from 'antd/es/popconfirm';
import { PlusOutlined, SearchOutlined, DeleteOutlined, StarOutlined, StarFilled, EditOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
    };
  }
}

const { Sider, Content } = Layout;

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  isStarred: boolean;
  color: string;
}

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'starred'>('all');

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await window.electron.ipcRenderer.invoke('load-notes');
        if (savedNotes) {
          setNotes(savedNotes);
        }
      } catch (error) {
        console.error('加载便签失败:', error);
        message.error('加载便签失败');
      }
    };
    loadNotes();
  }, []);

  useEffect(() => {
    const saveNotes = async () => {
      try {
        await window.electron.ipcRenderer.invoke('save-notes', notes);
      } catch (error) {
        console.error('保存便签失败:', error);
        message.error('保存便签失败');
      }
    };
    saveNotes();
  }, [notes]);

  const addNote = useCallback(() => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `便签 ${notes.length + 1}`,
      content: '',
      lastModified: new Date().toISOString(),
      isStarred: false,
      color: '#ffffff'
    };
    setNotes(prevNotes => [...prevNotes, newNote]);
    setSelectedNote(newNote);
    setEditingContent('');
    setIsEditingTitle(true);
    message.success('新建便签成功');
  }, [notes.length]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setEditingContent('');
    }
    message.success('便签已删除');
  }, [selectedNote]);

  const updateNoteContent = useCallback((id: string, content: string) => {
    setNotes(prevNotes => prevNotes.map(note =>
      note.id === id ? { ...note, content, lastModified: new Date().toISOString() } : note
    ));
  }, []);

  const updateNoteTitle = useCallback((id: string, title: string) => {
    setNotes(prevNotes => prevNotes.map(note =>
      note.id === id ? { ...note, title, lastModified: new Date().toISOString() } : note
    ));
  }, []);

  const toggleStar = useCallback((id: string) => {
    setNotes(prevNotes => prevNotes.map(note =>
      note.id === id ? { ...note, isStarred: !note.isStarred, lastModified: new Date().toISOString() } : note
    ));
  }, []);

  const updateNoteColor = useCallback((id: string, color: string) => {
    setNotes(prevNotes => prevNotes.map(note =>
      note.id === id ? { ...note, color, lastModified: new Date().toISOString() } : note
    ));
  }, []);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchText.toLowerCase()) ||
      note.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesView = viewMode === 'all' || (viewMode === 'starred' && note.isStarred);
    return matchesSearch && matchesView;
  });

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setEditingContent(note.content);
    setIsEditingTitle(false);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  const handleContentChange = (content: string) => {
    setEditingContent(content);
    if (selectedNote) {
      updateNoteContent(selectedNote.id, content);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (selectedNote) {
      updateNoteTitle(selectedNote.id, newTitle);
      setSelectedNote(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    }
  };

  return (
    <Layout className="app-layout">
      <Sider width={300} className="note-list-sidebar">
        <div className="note-list-header">
          <Input
            className="search-input"
            placeholder="搜索便签..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type={viewMode === 'all' ? 'primary' : 'default'}
              onClick={() => setViewMode('all')}
              style={{ flex: 1 }}
            >
              全部
            </Button>
            <Button
              type={viewMode === 'starred' ? 'primary' : 'default'}
              onClick={() => setViewMode('starred')}
              style={{ flex: 1 }}
            >
              已收藏
            </Button>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addNote}
            className="add-note-button"
          >
            新建便签
          </Button>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedNote ? [selectedNote.id] : []}
          className="note-list"
          style={{ 
            height: 'calc(100vh - 180px)', // 与CSS保持一致
            overflowY: 'auto' 
          }}
        >
          {filteredNotes.map(note => (
            <Menu.Item
              key={note.id}
              onClick={() => handleNoteSelect(note)}
              className="note-list-item"
              style={{ backgroundColor: note.color }}
            >
              <div className="note-list-item-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4>{note.title}</h4>
                  <Tooltip title={note.isStarred ? '取消收藏' : '收藏'}>
                    <Button
                      type="text"
                      icon={note.isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(note.id);
                      }}
                    />
                  </Tooltip>
                </div>
                <p>{note.content.substring(0, 50)}...</p>
                <span className="note-list-item-time">
                  {new Date(note.lastModified).toLocaleString()}
                </span>
              </div>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Content className="note-detail-content">
          {selectedNote ? (
            <div className="note-detail" style={{ backgroundColor: selectedNote.color }}>
              <div className="note-detail-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  {isEditingTitle ? (
                    <Input
                      value={selectedNote.title}
                      onChange={handleTitleChange}
                      onBlur={handleTitleBlur}
                      onKeyPress={handleTitleKeyPress}
                      autoFocus
                      style={{ flex: 1, fontSize: '24px', border: 'none', borderBottom: '2px solid #e8e8e8' }}
                    />
                  ) : (
                    <h2 
                      onClick={() => setIsEditingTitle(true)} 
                      style={{ 
                        flex: 1, 
                        cursor: 'pointer',
                        margin: 0,
                        fontSize: '24px',
                        color: '#262626',
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {selectedNote.title}
                    </h2>
                  )}
                  <Tooltip title="编辑标题">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditingTitle(true)}
                    />
                  </Tooltip>
                </div>
                <Popconfirm
                  title="确定要删除这个便签吗？"
                  onConfirm={() => deleteNote(selectedNote.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </div>
              <div className="note-detail-editor">
                <ReactQuill
                  value={editingContent}
                  onChange={handleContentChange}
                  modules={modules}
                  formats={formats}
                  placeholder="在这里输入内容..."
                  theme="snow"
                />
              </div>
              <div className="note-detail-footer">
                <span>最后修改时间：{new Date(selectedNote.lastModified).toLocaleString()}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    type="text"
                    onClick={() => updateNoteColor(selectedNote.id, '#ffffff')}
                    style={{ backgroundColor: '#ffffff', width: '24px', height: '24px', padding: 0 }}
                  />
                  <Button
                    type="text"
                    onClick={() => updateNoteColor(selectedNote.id, '#f6ffed')}
                    style={{ backgroundColor: '#f6ffed', width: '24px', height: '24px', padding: 0 }}
                  />
                  <Button
                    type="text"
                    onClick={() => updateNoteColor(selectedNote.id, '#fff7e6')}
                    style={{ backgroundColor: '#fff7e6', width: '24px', height: '24px', padding: 0 }}
                  />
                  <Button
                    type="text"
                    onClick={() => updateNoteColor(selectedNote.id, '#fff1f0')}
                    style={{ backgroundColor: '#fff1f0', width: '24px', height: '24px', padding: 0 }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="note-detail-empty">
              <p>选择一个便签或创建新便签</p>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default React.memo(App);
