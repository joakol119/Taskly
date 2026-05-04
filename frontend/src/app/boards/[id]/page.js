'use client';
import GitHubImportModal from '../../../components/GitHubImportModal';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import TaskModal from '../../../components/TaskModal';
import MembersPanel from '../../../components/MembersPanel';
import { useToast } from '../../../components/Toast';

function getInitial(name) {
  return name ? name.trim().charAt(0).toUpperCase() : '?';
}

function getDueDateStatus(dueDate) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  if (isNaN(due)) return null;
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Overdue', tone: 'danger' };
  if (diffDays === 0) return { text: 'Today', tone: 'warning' };
  if (diffDays <= 2) return { text: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`, tone: 'warning' };
  return { text: `In ${diffDays} days`, tone: 'success' };
}

const DUE_TONE_STYLES = {
  danger: 'bg-danger/10 border-danger/30 text-danger',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  success: 'bg-success/10 border-success/30 text-success',
};

export default function BoardPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showGithubImport, setShowGithubImport] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [editingColName, setEditingColName] = useState('');
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [boardNameValue, setBoardNameValue] = useState('');

  const [draggingTask, setDraggingTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const router = useRouter();
  const params = useParams();
  const toast = useToast();

  const fetchBoard = useCallback(() => {
    api.getBoard(params.id).then(setBoard).catch(console.error);
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserId(user.id);
    api
      .getBoard(params.id)
      .then(setBoard)
      .catch(() => toast({ message: 'Failed to load board', type: 'error' }))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const col = await api.createColumn({ name: newColName.trim(), boardId: board.id });
      setBoard({ ...board, columns: [...board.columns, { ...col, tasks: [] }] });
      setNewColName('');
      toast({ message: 'Column added' });
    } catch (err) {
      toast({ message: err.message || 'Failed to add column', type: 'error' });
    }
  };

  const handleDeleteColumn = async (col) => {
    const taskCount = col.tasks.length;
    const message = taskCount
      ? `Delete "${col.name}" and its ${taskCount} task${taskCount > 1 ? 's' : ''}?`
      : `Delete "${col.name}"?`;
    if (!confirm(message)) return;
    try {
      await api.deleteColumn(col.id);
      setBoard({ ...board, columns: board.columns.filter((c) => c.id !== col.id) });
      toast({ message: 'Column deleted', type: 'warning' });
    } catch (err) {
      toast({ message: err.message || 'Failed to delete column', type: 'error' });
    }
  };

  const startEditCol = (col) => {
    setEditingColId(col.id);
    setEditingColName(col.name);
  };

  const saveEditCol = async (colId) => {
    if (!editingColName.trim()) {
      setEditingColId(null);
      return;
    }
    try {
      await api.renameColumn(colId, editingColName.trim());
      setBoard({
        ...board,
        columns: board.columns.map((c) =>
          c.id === colId ? { ...c, name: editingColName.trim() } : c
        ),
      });
    } catch (err) {
      toast({ message: err.message || 'Failed to rename column', type: 'error' });
    }
    setEditingColId(null);
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
    } catch (err) {
      toast({ message: err.message || 'Failed to add task', type: 'error' });
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      })),
    }));
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

  const handleTasksImported = (columnId, newTasks) => {
  setBoard((prev) => ({
    ...prev,
    columns: prev.columns.map((c) =>
      c.id === columnId ? { ...c, tasks: [...c.tasks, ...newTasks] } : c
    ),
  }));
  };

  const handleToggleDone = async (e, task) => {
    e.stopPropagation();
    const newDone = !task.done;
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, done: newDone } : t)),
      })),
    }));
    try {
      await api.updateTask(task.id, { done: newDone });
    } catch (err) {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) => ({
          ...c,
          tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)),
        })),
      }));
      toast({ message: 'Failed to update task', type: 'error' });
    }
  };

  const startEditBoard = () => {
    setBoardNameValue(board.name);
    setEditingBoardName(true);
  };

  const saveEditBoard = async () => {
    if (!boardNameValue.trim()) {
      setEditingBoardName(false);
      return;
    }
    try {
      await api.renameBoard(board.id, boardNameValue.trim());
      setBoard({ ...board, name: boardNameValue.trim() });
    } catch (err) {
      toast({ message: err.message || 'Failed to rename board', type: 'error' });
    }
    setEditingBoardName(false);
  };

  const handleDragStart = (e, task, colId, index) => {
    setDraggingTask({ taskId: task.id, fromColId: colId, fromIndex: index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverTask = (e, colId, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(colId);
    setDragOverIndex(index);
  };

  const handleDragOverColumn = (e, colId) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
      const col = board.columns.find((c) => c.id === colId);
      setDragOverIndex(col ? col.tasks.length : 0);
    }
  };

  const handleDrop = async (e, destColId, destIndex) => {
    e.preventDefault();
    if (!draggingTask) return;

    const { taskId, fromColId, fromIndex } = draggingTask;

    setDraggingTask(null);
    setDragOverCol(null);
    setDragOverIndex(null);

    if (fromColId === destColId && fromIndex === destIndex) return;
    if (fromColId === destColId && fromIndex + 1 === destIndex) return;

    let actualDestIndex = destIndex;
    if (fromColId === destColId && fromIndex < destIndex) {
      actualDestIndex = destIndex - 1;
    }

    const newColumns = board.columns.map((c) => ({ ...c, tasks: [...c.tasks] }));
    const sourceCol = newColumns.find((c) => c.id === fromColId);
    const destCol = newColumns.find((c) => c.id === destColId);
    const [movedTask] = sourceCol.tasks.splice(fromIndex, 1);
    movedTask.columnId = destColId;
    destCol.tasks.splice(actualDestIndex, 0, movedTask);
    setBoard({ ...board, columns: newColumns });

    try {
      await api.moveTask(taskId, { columnId: destColId, order: actualDestIndex });
    } catch (err) {
      toast({ message: 'Failed to move task', type: 'error' });
      fetchBoard();
    }
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
    setDragOverCol(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-text-muted">Board not found</p>
        <button
          onClick={() => router.push('/boards')}
          className="px-4 py-2 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors"
        >
          Back to boards
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="h-14 px-8 flex items-center gap-4">
          <button
            onClick={() => router.push('/boards')}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
          >
            <span>&larr;</span>
            <span>Boards</span>
          </button>

          <div className="w-px h-5 bg-border" />

          {editingBoardName ? (
            <input
              autoFocus
              value={boardNameValue}
              onChange={(e) => setBoardNameValue(e.target.value)}
              onBlur={saveEditBoard}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditBoard();
                if (e.key === 'Escape') setEditingBoardName(false);
              }}
              className="flex-1 px-2 py-1 text-base font-medium tracking-tight bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
            />
          ) : (
            <h1
              onDoubleClick={startEditBoard}
              title="Double-click to rename"
              className="flex-1 text-base font-medium tracking-tight cursor-text"
            >
              {board.name}
            </h1>
          )}
          <button
            onClick={() => setShowGithubImport(true)}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text bg-surface border border-border hover:border-border-strong rounded-md transition-colors"
          >
            Import from GitHub
          </button>
          <button
            onClick={() => setShowMembers(true)}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text bg-surface border border-border hover:border-border-strong rounded-md transition-colors"
          >
            Members ({1 + board.members.length})
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-start gap-4 px-8 py-6 overflow-x-auto">
        {board.columns.map((col) => {
          const isDragOverHere = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOverColumn(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id, dragOverIndex !== null ? dragOverIndex : col.tasks.length)}
              className={`flex flex-col w-72 flex-shrink-0 rounded-lg border bg-surface transition-colors ${
                isDragOverHere ? 'border-accent/50' : 'border-border'
              }`}
              style={{ maxHeight: 'calc(100vh - 110px)' }}
            >
              <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-border">
                {editingColId === col.id ? (
                  <input
                    autoFocus
                    value={editingColName}
                    onChange={(e) => setEditingColName(e.target.value)}
                    onBlur={() => saveEditCol(col.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditCol(col.id);
                      if (e.key === 'Escape') setEditingColId(null);
                    }}
                    className="flex-1 px-2 py-0.5 text-sm font-medium bg-bg border border-border rounded text-text focus:outline-none focus:border-accent"
                  />
                ) : (
                  <p
                    onDoubleClick={() => startEditCol(col)}
                    title="Double-click to rename"
                    className="flex-1 text-sm font-medium tracking-tight cursor-text"
                  >
                    {col.name}{' '}
                    <span className="text-text-subtle font-mono font-normal">
                      {col.tasks.length}
                    </span>
                  </p>
                )}
                <button
                  onClick={() => handleDeleteColumn(col)}
                  className="w-6 h-6 flex items-center justify-center rounded text-text-subtle hover:text-danger hover:bg-danger/10 transition-colors"
                  aria-label={`Delete column ${col.name}`}
                >
                  <span className="text-base leading-none">×</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[20px]">
                {col.tasks.map((task, index) => {
                  const showDropIndicator =
                    isDragOverHere &&
                    dragOverIndex === index &&
                    !(draggingTask?.fromColId === col.id && draggingTask?.fromIndex === index);
                  const isBeingDragged = draggingTask?.taskId === task.id;
                  const dueStatus = getDueDateStatus(task.dueDate);

                  return (
                    <div key={task.id}>
                      {showDropIndicator && (
                        <div className="h-0.5 bg-accent rounded mb-2" />
                      )}
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, task, col.id, index)}
                        onDragOver={(e) => handleDragOverTask(e, col.id, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedTask(task)}
                        className={`group rounded-md bg-bg border border-border p-3 cursor-pointer hover:border-border-strong transition-colors ${
                          isBeingDragged ? 'opacity-30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => handleToggleDone(e, task)}
                            className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                              task.done
                                ? 'bg-success'
                                : 'bg-transparent border border-border-strong hover:border-text-muted'
                            }`}
                            aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
                          >
                            {task.done && (
                              <svg className="w-3 h-3 text-bg" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42L8 12.59l7.29-7.3a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {task.labels.map((lbl, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium border"
                                    style={{
                                      backgroundColor: `${lbl.color}20`,
                                      borderColor: `${lbl.color}60`,
                                      color: lbl.color,
                                    }}
                                  >
                                    {lbl.text}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p
                              className={`text-sm text-text break-words ${
                                task.done ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p
                                className={`text-xs text-text-muted mt-1 line-clamp-2 ${
                                  task.done ? 'opacity-60' : ''
                                }`}
                              >
                                {task.description}
                              </p>
                            )}
                            {dueStatus && !task.done && (
                              <div
                                className={`inline-flex items-center mt-2 px-1.5 py-0 text-[10px] font-mono uppercase tracking-wider rounded border ${DUE_TONE_STYLES[dueStatus.tone]}`}
                              >
                                {dueStatus.text}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isDragOverHere &&
                  dragOverIndex === col.tasks.length &&
                  !(
                    draggingTask?.fromColId === col.id &&
                    draggingTask?.fromIndex === col.tasks.length - 1
                  ) && <div className="h-0.5 bg-accent rounded" />}
              </div>

              <div className="p-2 border-t border-border">
                <input
                  placeholder="+ Add task..."
                  value={newTaskInputs[col.id] || ''}
                  onChange={(e) =>
                    setNewTaskInputs({ ...newTaskInputs, [col.id]: e.target.value })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask(col.id)}
                  className="w-full px-2 py-1.5 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
                />
                {newTaskInputs[col.id] && (
                  <button
                    onClick={() => handleAddTask(col.id)}
                    className="w-full mt-2 px-3 py-1.5 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <form
          onSubmit={handleAddColumn}
          className="flex flex-col w-72 flex-shrink-0 rounded-lg bg-surface/50 border border-dashed border-border p-3 gap-2 self-start"
        >
          <input
            placeholder="New column name..."
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={!newColName.trim()}
            className="px-3 py-2 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add column
          </button>
        </form>
      </div>

      {selectedTask && (
  <TaskModal
    task={selectedTask}
    onClose={() => setSelectedTask(null)}
    onUpdated={handleTaskUpdated}
    onDeleted={handleTaskDeleted}
    onSubtasksAdded={(newTasks) => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === selectedTask.columnId
            ? { ...c, tasks: [...c.tasks, ...newTasks] }
            : c
        ),
      }));
    }}
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
      {showGithubImport && (
  <GitHubImportModal
        board={board}
        onClose={() => setShowGithubImport(false)}
        onTasksImported={handleTasksImported}
      />
    )}
    </div>
  );
}
