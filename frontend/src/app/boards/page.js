'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';

const BOARD_ACCENTS = [
  { name: 'Red',    value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green',  value: '#22c55e' },
  { name: 'Blue',   value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink',   value: '#ec4899' },
  { name: 'Gray',   value: '#64748b' },
];

function getInitial(name) {
  return name ? name.trim().charAt(0).toUpperCase() : '?';
}

function getBoardAccent(board) {
  if (board.color && board.color.startsWith('#')) return board.color;
  return BOARD_ACCENTS[board.id % BOARD_ACCENTS.length].value;
}

function getRelativeTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [colorPickerId, setColorPickerId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    api
      .getBoards()
      .then((fetched) => setBoards(fetched))
      .catch(() => toast({ message: 'Failed to load boards', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const close = () => {
      setMenuOpenId(null);
      setColorPickerId(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const board = await api.createBoard({ name: newName.trim() });
      setBoards((prev) => [...prev, board]);
      setNewName('');
      toast({ message: `Board "${board.name}" created` });
    } catch (err) {
      toast({ message: err.message || 'Failed to create board', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleDragStart = (i) => setDragIndex(i);
  const handleDragOver = (e, i) => {
    e.preventDefault();
    setOverIndex(i);
  };
  const handleDrop = async (i) => {
    if (dragIndex === null || dragIndex === i) return;
    const reordered = Array.from(boards);
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    setBoards(reordered);
    setDragIndex(null);
    setOverIndex(null);
    try {
      await api.reorderBoards(reordered.map((b) => b.id));
    } catch {
      toast({ message: 'Failed to save order', type: 'error' });
    }
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleCardClick = (board) => {
    if (dragIndex !== null || editingId === board.id || menuOpenId === board.id || colorPickerId === board.id) return;
    router.push(`/boards/${board.id}`);
  };

  const saveEdit = async (boardId) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await api.renameBoard(boardId, editingName.trim());
      setBoards(boards.map((b) => (b.id === boardId ? { ...b, name: editingName.trim() } : b)));
      toast({ message: 'Board renamed' });
    } catch (err) {
      toast({ message: err.message || 'Failed to rename', type: 'error' });
    }
    setEditingId(null);
  };

  const handleDelete = async (boardId) => {
    setConfirmDelete(null);
    try {
      await api.deleteBoard(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
      toast({ message: 'Board deleted', type: 'warning' });
    } catch (err) {
      toast({ message: err.message || 'Failed to delete', type: 'error' });
    }
  };

  const handleDuplicate = async (e, board) => {
    e.stopPropagation();
    setMenuOpenId(null);
    try {
      const newBoard = await api.duplicateBoard(board.id);
      setBoards((prev) => [...prev, newBoard]);
      toast({ message: `"${board.name}" duplicated` });
    } catch (err) {
      toast({ message: err.message || 'Failed to duplicate', type: 'error' });
    }
  };

  const handleRename = (e, board) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setEditingId(board.id);
    setEditingName(board.name);
  };

  const handleColorChange = async (e, boardId, color) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setBoards(boards.map((b) => (b.id === boardId ? { ...b, color } : b)));
    setColorPickerId(null);
    try {
      await api.updateBoardColor(boardId, color);
      toast({ message: 'Color updated' });
    } catch {
      toast({ message: 'Failed to save color', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="h-14 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-accent-soft border border-accent/30 flex items-center justify-center">
              <span className="text-accent font-mono text-sm font-medium">T</span>
            </div>
            <span className="font-medium tracking-tight">Taskly</span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono rounded bg-surface border border-border text-text-muted">
              for developers
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-accent">{getInitial(user.name)}</span>
                </div>
                <span className="text-sm text-text-muted">{user.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight">Your boards</h1>
          <p className="text-sm text-text-muted mt-1">
            Organize your projects in one place.
          </p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 mb-10">
          <input
            type="text"
            placeholder="New board name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 sm:max-w-xs px-3 py-2 text-sm bg-surface border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-4 py-2 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            + New board
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-lg bg-surface border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && boards.length === 0 && (
          <div className="text-center py-20 px-6 rounded-lg border border-dashed border-border">
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
              Empty
            </p>
            <h3 className="text-lg font-medium tracking-tight mb-2">
              No boards yet
            </h3>
            <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
              Create your first board to start organizing tasks. Each board is a
              kanban for one project.
            </p>
            <button
              onClick={() =>
                document.querySelector('input[placeholder="New board name"]')?.focus()
              }
              className="px-4 py-2 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors"
            >
              + Create your first board
            </button>
          </div>
        )}

        {/* Boards grid */}
        {!loading && boards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {boards.map((board, i) => {
              const accent = getBoardAccent(board);
              const isEditing = editingId === board.id;
              const isDragging = dragIndex === i;
              const isOver = overIndex === i && dragIndex !== i;
              const isMenuOpen = menuOpenId === board.id;
              const isPickerOpen = colorPickerId === board.id;

              const taskCount = board.taskCount || 0;
              const doneCount = board.doneCount || 0;
              const columnCount = board.columnCount || 0;
              const memberCount = board.memberCount || 0;
              const totalMembers = memberCount + 1;
              const progress = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;
              const relativeTime = getRelativeTime(board.createdAt);

              return (
                <div
                  key={board.id}
                  draggable={!isEditing}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  onClick={() => !isEditing && handleCardClick(board)}
                  className={`
                    relative group rounded-lg border bg-surface flex flex-col
                    transition-all
                    ${isEditing ? 'cursor-default' : 'cursor-pointer hover:border-border-strong'}
                    ${isDragging ? 'opacity-40' : 'opacity-100'}
                    ${isOver ? 'border-accent' : 'border-border'}
                  `}
                  style={{
                    borderTop: `3px solid ${accent}`,
                  }}
                >
                  {/* Options menu button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setMenuOpenId(isMenuOpen ? null : board.id);
                      setColorPickerId(null);
                    }}
                    className={`absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-all ${
                      isMenuOpen || isPickerOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label="Board options"
                  >
                    <span className="text-base leading-none">⋯</span>
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                      }}
                      className="absolute top-11 right-3 z-30 min-w-[180px] rounded-md bg-bg border border-border shadow-xl overflow-hidden"
                    >
                      <button
                        onClick={(e) => handleRename(e, board)}
                        className="flex items-center w-full px-3 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, board)}
                        className="flex items-center w-full px-3 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          setMenuOpenId(null);
                          setColorPickerId(board.id);
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                      >
                        <span>Change color</span>
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                          setConfirmDelete(board);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors border-t border-border"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {/* Color picker popover (anclado al lado del botón ⋯) */}
                  {isPickerOpen && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                      }}
                      className="absolute top-11 right-3 z-30 p-3 rounded-md bg-bg border border-border shadow-xl"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {BOARD_ACCENTS.map(({ name, value }) => {
                          const isSelected = accent === value;
                          return (
                            <button
                              key={value}
                              onClick={(e) => handleColorChange(e, board.id, value)}
                              className="w-7 h-7 rounded-md transition-transform hover:scale-110 relative flex items-center justify-center"
                              style={{
                                backgroundColor: value,
                                outline: isSelected ? `2px solid ${value}` : 'none',
                                outlineOffset: '2px',
                              }}
                              aria-label={`Set color to ${name}`}
                              title={name}
                            >
                              {isSelected && (
                                <svg className="w-3.5 h-3.5 text-white drop-shadow" viewBox="0 0 20 20" fill="currentColor">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42L8 12.59l7.29-7.3a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Card content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => saveEdit(board.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(board.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                          }}
                          className="w-full px-2 py-1 text-base font-medium tracking-tight bg-bg border border-border rounded text-text focus:outline-none focus:border-accent"
                        />
                      ) : (
                        <h3 className="text-base font-medium tracking-tight pr-7 truncate">
                          {board.name}
                        </h3>
                      )}
                    </div>

                    <p className="text-xs font-mono text-text-subtle mt-2">
                      {columnCount} {columnCount === 1 ? 'col' : 'cols'} · {taskCount} {taskCount === 1 ? 'task' : 'tasks'} · {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
                    </p>

                    {columnCount > 0 && (
                      <div className="flex gap-1 mt-3">
                        {[...Array(Math.min(columnCount, 6))].map((_, idx) => (
                          <div
                            key={idx}
                            className="flex-1 h-8 rounded-sm bg-bg border border-border"
                          />
                        ))}
                        {columnCount > 6 && (
                          <span className="text-xs font-mono text-text-subtle self-center ml-1">
                            +{columnCount - 6}
                          </span>
                        )}
                      </div>
                    )}

                    {taskCount > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-text-subtle">Progress</span>
                          <span className="text-text-muted">{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: accent,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3">
                      <span className="text-xs font-mono text-text-subtle">
                        {isEditing ? 'Enter / Esc' : (relativeTime || `by ${board.owner.name}`)}
                      </span>
                      {!isEditing && (
                        <span className="text-text-muted group-hover:text-text transition-colors">
                          →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="w-full max-w-sm rounded-lg bg-surface border border-border shadow-2xl">
            <div className="p-6 space-y-3">
              <h2 className="text-base font-medium tracking-tight">Delete board?</h2>
              <p className="text-sm text-text-muted">
                All columns and tasks in{' '}
                <span className="text-text font-medium">{confirmDelete.name}</span> will
                be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="px-4 py-2 text-sm font-medium bg-danger text-white rounded-md hover:bg-danger/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
