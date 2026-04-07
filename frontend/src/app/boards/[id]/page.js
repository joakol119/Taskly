'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../../../lib/api';
import TaskModal from '../../../components/TaskModal';
import MembersPanel from '../../../components/MembersPanel';

const s = {
  page: { minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column' },
  header: { padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  backBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 },
  boardTitle: { margin: 0, color: '#fff', fontSize: 18, fontWeight: 700, flex: 1 },
  membersBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 },
  board: { flex: 1, display: 'flex', alignItems: 'flex-start', gap: 16, padding: 24, overflowX: 'auto' },
  column: { background: '#1e293b', borderRadius: 12, width: 280, minWidth: 280, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' },
  columnHeader: { padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  columnName: { margin: 0, color: '#f1f5f9', fontWeight: 700, fontSize: 14 },
  columnDeleteBtn: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, padding: '2px 4px' },
  taskList: { padding: '0 10px 10px', flex: 1, overflowY: 'auto', minHeight: 8 },
  task: { background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' },
  taskTitle: { margin: 0, fontSize: 14, color: '#0f172a', fontWeight: 500 },
  taskDesc: { margin: '4px 0 0', fontSize: 12, color: '#64748b' },
  addTaskForm: { padding: '0 10px 10px' },
  addTaskInput: { width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', fontSize: 13, background: '#0f172a', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' },
  addTaskBtn: { width: '100%', marginTop: 6, padding: '8px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  newColumnForm: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, width: 280, minWidth: 280, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start' },
  newColumnInput: { padding: '10px 12px', borderRadius: 8, border: 'none', background: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none' },
  newColumnBtn: { padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  draggingOver: { background: '#263548' },
};

export default function BoardPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const router = useRouter();
  const params = useParams();

  const fetchBoard = useCallback(() => {
    api.getBoard(params.id).then(setBoard).catch(console.error);
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
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
    if (!confirm('¿Eliminar esta columna y todas sus tareas?')) return;
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

  if (loading) return <div style={{ color: '#fff', padding: 32 }}>Cargando...</div>;
  if (!board) return <div style={{ color: '#fff', padding: 32 }}>Tablero no encontrado</div>;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => router.push('/boards')}>← Tableros</button>
        <h1 style={s.boardTitle}>{board.name}</h1>
        <button style={s.membersBtn} onClick={() => setShowMembers(true)}>
          👥 Miembros ({1 + board.members.length})
        </button>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={s.board}>
          {board.columns.map((col) => (
            <div key={col.id} style={s.column}>
              <div style={s.columnHeader}>
                <p style={s.columnName}>{col.name} <span style={{ color: '#475569', fontWeight: 400 }}>({col.tasks.length})</span></p>
                <button style={s.columnDeleteBtn} onClick={() => handleDeleteColumn(col.id)}>✕</button>
              </div>

              <Droppable droppableId={String(col.id)}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ ...s.taskList, ...(snapshot.isDraggingOver ? s.draggingOver : {}) }}
                  >
                    {col.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...s.task,
                              ...(snapshot.isDragging ? { boxShadow: '0 8px 24px rgba(0,0,0,0.2)', opacity: 0.95 } : {}),
                              ...provided.draggableProps.style,
                            }}
                            onClick={() => !snapshot.isDragging && setSelectedTask(task)}
                          >
                            <p style={s.taskTitle}>{task.title}</p>
                            {task.description && <p style={s.taskDesc}>{task.description}</p>}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div style={s.addTaskForm}>
                <input
                  style={s.addTaskInput}
                  placeholder="+ Agregar tarea..."
                  value={newTaskInputs[col.id] || ''}
                  onChange={(e) => setNewTaskInputs({ ...newTaskInputs, [col.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask(col.id)}
                />
                {newTaskInputs[col.id] && (
                  <button style={s.addTaskBtn} onClick={() => handleAddTask(col.id)}>Agregar</button>
                )}
              </div>
            </div>
          ))}

          <form onSubmit={handleAddColumn} style={s.newColumnForm}>
            <input
              style={s.newColumnInput}
              placeholder="Nueva columna..."
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
            />
            <button style={s.newColumnBtn} type="submit">+ Agregar columna</button>
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
