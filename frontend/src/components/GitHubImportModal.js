'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from './Toast';

export default function GitHubImportModal({ board, onClose, onTasksImported }) {
  const toast = useToast();
  const [repoInput, setRepoInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [issues, setIssues] = useState(null); // null = pre-search, [] = no results
  const [selected, setSelected] = useState(new Set());
  const [columnId, setColumnId] = useState(board?.columns?.[0]?.id || null);
  const [importing, setImporting] = useState(false);
  const [searchedRepo, setSearchedRepo] = useState(null);

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const parseRepo = (input) => {
    const cleaned = input.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = cleaned.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    return { owner: parts[0], repo: parts[1] };
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    setError('');
    setIssues(null);
    setSelected(new Set());

    const parsed = parseRepo(repoInput);
    if (!parsed) {
      setError('Use the format owner/repo (e.g. joakol119/Taskly).');
      return;
    }

    setSearching(true);
    try {
      const result = await api.getGithubIssues(parsed.owner, parsed.repo);
      setIssues(result.issues || []);
      setSearchedRepo(parsed);
    } catch (err) {
      setError(err.message || 'Failed to fetch issues.');
    } finally {
      setSearching(false);
    }
  };

  const toggleIssue = (issueId) => {
    const newSet = new Set(selected);
    if (newSet.has(issueId)) newSet.delete(issueId);
    else newSet.add(issueId);
    setSelected(newSet);
  };

  const toggleAll = () => {
    if (selected.size === issues.length) setSelected(new Set());
    else setSelected(new Set(issues.map((i) => i.id)));
  };

  const handleImport = async () => {
    if (!selected.size || !columnId) return;
    const issuesToImport = issues.filter((i) => selected.has(i.id));
    setImporting(true);
    try {
      const result = await api.importGithubIssues(columnId, issuesToImport);
      onTasksImported(columnId, result.tasks);
      toast({ message: `Imported ${result.tasks.length} issue${result.tasks.length > 1 ? 's' : ''}` });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-lg bg-surface border border-border shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.34-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
            <h2 className="text-base font-medium tracking-tight">Import from GitHub</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        {/* Search form */}
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="repo-input" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5">
                Repository
              </label>
              <input
                id="repo-input"
                type="text"
                placeholder="owner/repo (e.g. joakol119/Taskly)"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !repoInput.trim()}
              className="self-end px-4 py-2 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && (
            <div className="mt-3 px-3 py-2 text-sm rounded-md bg-danger/10 border border-danger/30 text-danger">
              {error}
            </div>
          )}
        </div>

        {/* Body: issues list */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {issues === null && !searching && (
            <p className="text-sm text-text-muted text-center py-12">
              Enter a public repository above to see its open issues.
            </p>
          )}

          {searching && (
            <div className="flex items-center justify-center gap-3 py-12">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-text-muted">Fetching issues...</span>
            </div>
          )}

          {issues !== null && !searching && issues.length === 0 && (
            <p className="text-sm text-text-muted text-center py-12">
              No open issues found in <span className="font-mono">{searchedRepo?.owner}/{searchedRepo?.repo}</span>.
            </p>
          )}

          {issues !== null && issues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  className="text-xs font-mono uppercase tracking-wider text-accent hover:text-accent-hover transition-colors"
                >
                  {selected.size === issues.length ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-xs font-mono text-text-subtle">
                  {selected.size} / {issues.length} selected
                </span>
              </div>

              <ul className="space-y-2">
                {issues.map((issue) => {
                  const isSelected = selected.has(issue.id);
                  return (
                    <li
                      key={issue.id}
                      onClick={() => toggleIssue(issue.id)}
                      className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-accent/5 border-accent/40'
                          : 'bg-bg border-border hover:border-border-strong'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-accent' : 'bg-transparent border border-border-strong'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42L8 12.59l7.29-7.3a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-mono text-text-subtle">#{issue.number}</span>
                          <h3 className="text-sm font-medium text-text truncate">{issue.title}</h3>
                        </div>
                        {issue.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {issue.labels.map((lbl, i) => (
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
                        {issue.author && (
                          <p className="text-xs text-text-muted mt-1.5">
                            by <span className="font-mono">{issue.author.login}</span>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        {issues !== null && issues.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <label htmlFor="col-select" className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Import to
              </label>
              <select
                id="col-select"
                value={columnId || ''}
                onChange={(e) => setColumnId(parseInt(e.target.value, 10))}
                className="px-2 py-1.5 text-sm bg-bg border border-border rounded-md text-text focus:outline-none focus:border-accent transition-colors"
              >
                {board.columns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !selected.size || !columnId}
                className="px-4 py-2 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : `Import ${selected.size}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
