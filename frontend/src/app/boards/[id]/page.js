'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../../../lib/api';
import { useTheme, themes } from '../../../lib/theme';
import TaskModal from '../../../components/TaskModal';
import { useToast } from '../../../components/Toast';
import MembersPanel from '../../../components/MembersPanel';

export default function BoardPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [editingColName, setEditingColName] = useState('');
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [boardNameValue, setBoardNameValue] = useState('');
  const router = useRouter();
  const params = useParams();
  const { dark, toggle } = useTheme();
  const toast = useToast();
  const t = dark ? themes.dark : themes.light;

  const fetchBoard = useCallback(() => {
    api.getBoard(params.id).then(setBoard).catch(console.error);
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserId(user.id);
    api.getBoard(params.id).then(setBoard).catch(console.error).finally(() => setLoading(false));
  }, [params.id]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const col = await api.createColumn({ name: newColName.trim(), boardId: board.id });
      setBoard({ ...board, columns: [...board.columns, { ...col, tasks: [] }] });
      setNewColName('');
    } catch (err) { console.error(err); }
  };

  const handleDeleteColumn = async (colId) => {
    
    try {
      await api.deleteColumn(colId);
      setBoard({ ...board, columns: board.columns.filter((c) => c.id !== colId) });
    } catch (err) { console.error(err); }
  };

  const handleAddTask = async (colId) => {
    const title = (newTaskInputs[colId] || '').trim();
    if (!title) return;
    try {
      const task = await api.createTask({ title, columnId: colId });
      setBoard({
        ...board,
        columns: board.columns.map((c) =>
          c.id === colId ? { ...c, tasks: [...c.tasks, task] } : c
        ),
      });
      setNewTaskInputs({ ...newTaskInputs, [colId]: '' });
    } catch (err) { console.error(err); }
  };

  const handleTaskUpdated = (updatedTask) => {
    setBoard({
      ...board,
      columns: board.columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      })),
    });
  };

  const handleTaskDeleted = (taskId) => {
    setBoard({
      ...board,
      columns: board.columns.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== taskId),
      })),
    });
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColId = parseInt(source.droppableId);
    const destColId = parseInt(destination.droppableId);
    const taskId = parseInt(draggableId);

    const newColumns = board.columns.map((c) => ({ ...c, tasks: [...c.tasks] }));
    const sourceCol = newColumns.find((c) => c.id === sourceColId);
    const destCol = newColumns.find((c) => c.id === destColId);
    const [movedTask] = sourceCol.tasks.splice(source.index, 1);
    destCol.tasks.splice(destination.index, 0, movedTask);
    setBoard({ ...board, columns: newColumns });

    try {
      await api.moveTask(taskId, { columnId: destColId, order: destination.index });
    } catch (err) { console.error(err); }
  };

  const startEditCol = (col) => {
    setEditingColId(col.id);
    setEditingColName(col.name);
  };

  const saveEditCol = async (colId) => {
    if (!editingColName.trim()) { setEditingColId(null); return; }
    try {
      await api.renameColumn(colId, editingColName.trim());
      setBoard({
        ...board,
        columns: board.columns.map(c => c.id === colId ? { ...c, name: editingColName.trim() } : c),
      });
    } catch (err) { console.error(err); }
    setEditingColId(null);
  };

  const startEditBoard = () => {
    setBoardNameValue(board.name);
    setEditingBoardName(true);
  };

  const saveEditBoard = async () => {
    if (!boardNameValue.trim()) { setEditingBoardName(false); return; }
    try {
      await api.renameBoard(board.id, boardNameValue.trim());
      setBoard({ ...board, name: boardNameValue.trim() });
    } catch (err) { console.error(err); }
    setEditingBoardName(false);
  };

  if (loading) return <div style={{ color: t.text, padding: 32, background: t.bg, minHeight: '100vh' }}>Cargando...</div>;
  if (!board) return <div style={{ color: t.text, padding: 32, background: t.bg, minHeight: '100vh' }}>Tablero no encontrado</div>;

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#0f172a' : '#1e293b', display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>
      <header style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16,
        background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button onClick={() => router.push('/boards')} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
        }}>← Tableros</button>

        {editingBoardName ? (
          <input
            autoFocus
            value={boardNameValue}
            onChange={(e) => setBoardNameValue(e.target.value)}
            onBlur={saveEditBoard}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEditBoard(); if (e.key === 'Escape') setEditingBoardName(false); }}
            style={{
              margin: 0, color: '#fff', fontSize: 18, fontWeight: 700, flex: 1,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 6, padding: '4px 10px', outline: 'none',
            }}
          />
        ) : (
          <h1
            onDoubleClick={startEditBoard}
            title="Doble click para renombrar"
            style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700, flex: 1, cursor: 'text' }}
          >
            {board.name}
          </h1>
        )}

        <button onClick={toggle} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 16,
        }}>
          {dark ? '☀️' : '🌙'}
        </button>
        <button onClick={() => setShowMembers(true)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
        }}>
          👥 Miembros ({1 + board.members.length})
        </button>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 16, padding: 24, overflowX: 'auto' }}>
          {board.columns.map((col) => (
            <div key={col.id} style={{
              background: dark ? '#1e293b' : '#243447',
              borderRadius: 12, width: 280, minWidth: 280,
              display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)',
              transition: 'background 0.3s',
            }}>
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {editingColId === col.id ? (
                  <input
                    autoFocus
                    value={editingColName}
                    onChange={(e) => setEditingColName(e.target.value)}
                    onBlur={() => saveEditCol(col.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEditCol(col.id); if (e.key === 'Escape') setEditingColId(null); }}
                    style={{
                      flex: 1, fontSize: 14, fontWeight: 700, color: '#f1f5f9',
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 6, padding: '2px 8px', outline: 'none',
                    }}
                  />
                ) : (
                  <p
                    onDoubleClick={() => startEditCol(col)}
                    title="Doble click para renombrar"
                    style={{ margin: 0, color: '#f1f5f9', fontWeight: 700, fontSize: 14, flex: 1, cursor: 'text' }}
                  >
                    {col.name} <span style={{ color: '#475569', fontWeight: 400 }}>({col.tasks.length})</span>
                  </p>
                )}
                <button onClick={() => handleDeleteColumn(col.id)} style={{
                  background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, padding: '2px 4px',
                }}>✕</button>
              </div>

              <Droppable droppableId={String(col.id)}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      padding: '0 10px 10px', flex: 1, overflowY: 'auto', minHeight: 8,
                      background: snapshot.isDraggingOver ? (dark ? '#263548' : '#2d4a6b') : 'transparent',
                      borderRadius: 8, transition: 'background 0.2s',
                    }}
                  >
                    {col.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              background: dark ? '#0f172a' : '#1a2d42',
                              borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                              boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.2)',
                              cursor: 'pointer', border: `1px solid ${dark ? '#1e293b' : '#243447'}`,
                              ...provided.draggableProps.style,
                            }}
                            onClick={() => !snapshot.isDragging && setSelectedTask(task)}
                          >
                            {task.labels && task.labels.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{task.labels.map((lbl, i) => (<span key={i} style={{ background: lbl.color + "30", border: `1px solid ${lbl.color}`, color: lbl.color, borderRadius: 999, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{lbl.text}</span>))}</div>)}<p style={{ margin: 0, fontSize: 14, color: "#f1f5f9", fontWeight: 500 }}>{task.title}</p>
                            {task.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{task.description}</p>}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div style={{ padding: '0 10px 10px' }}>
                <input
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none',
                    fontSize: 13, background: dark ? '#0f172a' : '#1a2d42',
                    color: '#f1f5f9', outline: 'none', boxSizing: 'border-box',
                  }}
                  placeholder="+ Agregar tarea..."
                  value={newTaskInputs[col.id] || ''}
                  onChange={(e) => setNewTaskInputs({ ...newTaskInputs, [col.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask(col.id)}
                />
                {newTaskInputs[col.id] && (
                  <button onClick={() => handleAddTask(col.id)} style={{
                    width: '100%', marginTop: 6, padding: '8px', borderRadius: 8, border: 'none',
                    background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                  }}>Agregar</button>
                )}
              </div>
            </div>
          ))}

          <form onSubmit={handleAddColumn} style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 12, width: 280, minWidth: 280,
            padding: 16, display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start',
          }}>
            <input
              style={{
                padding: '10px 12px', borderRadius: 8, border: 'none',
                background: dark ? '#1e293b' : '#243447', color: '#f1f5f9', fontSize: 14, outline: 'none',
              }}
              placeholder="Nueva columna..."
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
            />
            <button style={{
              padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6',
              color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }} type="submit">+ Agregar columna</button>
          </form>
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {showMembers && (
        <MembersPanel
          board={board}
          currentUserId={currentUserId}
          onClose={() => setShowMembers(false)}
          onMembersUpdated={fetchBoard}
        />
      )}
    </div>
  );
}
