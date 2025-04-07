import React, { useEffect, useState, useCallback } from 'react';
import Button from 'antd/es/button';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import './StickyNote.css';

interface StickyNoteProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onSizeChange: (id: string, size: { width: number; height: number }) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  content,
  position,
  size,
  color,
  onDelete,
  onUpdate,
  onPositionChange,
  onSizeChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleDrag = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onPositionChange(id, { x: newX, y: newY });
    }
  }, [id, isDragging, dragStart, onPositionChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  const handleSave = () => {
    onUpdate(id, editContent);
    setIsEditing(false);
  };

  return (
    <div
      className="sticky-note"
      style={{
        backgroundColor: color,
        width: size.width,
        height: size.height,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleDragStart}
    >
      <div className="note-header">
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => setIsEditing(true)}
        />
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(id)}
        />
      </div>
      {isEditing ? (
        <div className="note-edit">
          <Input.TextArea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoSize={{ minRows: 3 }}
          />
          <Button type="primary" size="small" onClick={handleSave}>
            保存
          </Button>
        </div>
      ) : (
        <div className="note-content">{content}</div>
      )}
      <div className="note-resize">
        <InputNumber
          size="small"
          min={100}
          value={size.width}
          onChange={(value) => onSizeChange(id, { ...size, width: value || 200 })}
        />
        <InputNumber
          size="small"
          min={100}
          value={size.height}
          onChange={(value) => onSizeChange(id, { ...size, height: value || 200 })}
        />
      </div>
    </div>
  );
};

export default React.memo(StickyNote); 