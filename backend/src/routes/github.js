const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Color mapping: GitHub uses hex without #, our DB stores with #
function normalizeColor(ghColor) {
  if (!ghColor) return '#64748b';
  return ghColor.startsWith('#') ? ghColor : `#${ghColor}`;
}

// Truncate long descriptions to keep tasks manageable
function truncateDescription(body, issueUrl) {
  if (!body) return `Imported from ${issueUrl}`;
  const MAX_LEN = 800;
  let truncated = body.length > MAX_LEN ? body.slice(0, MAX_LEN) + '...' : body;
  return `${truncated}\n\n---\nOriginal issue: ${issueUrl}`;
}

// GET /github/issues?owner=X&repo=Y
// Returns the list of OPEN issues from the given repo (public only with our scope)
router.get('/issues', auth, async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'owner and repo are required' });
  }

  try {
    // Get the user's GitHub token
    const userRes = await db.query(
      'SELECT github_access_token FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!userRes.rows.length || !userRes.rows[0].github_access_token) {
      return res.status(400).json({
        error: 'You need to sign in with GitHub to import issues. Sign out and sign in again with GitHub.',
      });
    }
    const ghToken = userRes.rows[0].github_access_token;

    // Fetch issues from GitHub
    // state=open: only open issues
    // per_page=50: cap to 50, we don't need more for an MVP
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=50`;
    const ghRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ghToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Taskly',
      },
    });

    if (ghRes.status === 404) {
      return res.status(404).json({ error: 'Repository not found. Check the owner and repo name.' });
    }
    if (ghRes.status === 401) {
      return res.status(401).json({ error: 'Your GitHub token is invalid. Sign out and sign in again with GitHub.' });
    }
    if (!ghRes.ok) {
      const errBody = await ghRes.text();
      console.error('[github] issues fetch failed:', ghRes.status, errBody);
      return res.status(502).json({ error: `GitHub API error (${ghRes.status})` });
    }

    const ghIssues = await ghRes.json();

    // GitHub returns pull requests in /issues too. Filter them out.
    const issues = ghIssues
      .filter((it) => !it.pull_request)
      .map((it) => ({
        id: it.id,
        number: it.number,
        title: it.title,
        body: it.body || '',
        html_url: it.html_url,
        labels: (it.labels || []).map((lbl) => ({
          text: lbl.name,
          color: normalizeColor(lbl.color),
        })),
        author: it.user ? { login: it.user.login, avatar_url: it.user.avatar_url } : null,
        created_at: it.created_at,
      }));

    res.json({ issues });
  } catch (err) {
    console.error('[github] error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch issues' });
  }
});

// POST /github/import
// Body: { columnId: number, issues: [{ number, title, body, html_url, labels }] }
// Creates one task per issue in the given column.
router.post('/import', auth, async (req, res) => {
  const { columnId, issues } = req.body;
  if (!columnId || !Array.isArray(issues) || !issues.length) {
    return res.status(400).json({ error: 'columnId and issues are required' });
  }

  try {
    // Verify column exists and user has access
    const colRes = await db.query(
      `SELECT c.id, c.board_id
       FROM columns c
       WHERE c.id = $1`,
      [columnId]
    );
    if (!colRes.rows.length) {
      return res.status(404).json({ error: 'Column not found' });
    }
    const column = colRes.rows[0];

    const boardRes = await db.query('SELECT owner_id FROM boards WHERE id = $1', [column.board_id]);
    if (!boardRes.rows.length) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const ownerId = boardRes.rows[0].owner_id;
    if (ownerId !== req.user.id) {
      const memberCheck = await db.query(
        'SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2',
        [column.board_id, req.user.id]
      );
      if (!memberCheck.rows.length) {
        return res.status(403).json({ error: 'No access to this board' });
      }
    }

    // Get the current max order in the column
    const orderRes = await db.query(
      'SELECT COALESCE(MAX("order"), -1) AS max_order FROM tasks WHERE column_id = $1',
      [columnId]
    );
    let nextOrder = parseInt(orderRes.rows[0].max_order, 10) + 1;

    const created = [];
    for (const issue of issues) {
      const title = `#${issue.number} ${issue.title}`;
      const description = truncateDescription(issue.body, issue.html_url);

      // Add a "from-github" label automatically
      const fromGithubLabel = { text: 'from-github', color: '#8b5cf6' };
      const allLabels = [fromGithubLabel, ...(issue.labels || [])];
      const labelsJson = JSON.stringify(allLabels);

      const insertRes = await db.query(
        `INSERT INTO tasks (title, description, "order", column_id, labels)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [title, description, nextOrder, columnId, labelsJson]
      );
      nextOrder += 1;
      const task = insertRes.rows[0];

      // Parse labels back into JSON before returning
      try {
        task.labels = JSON.parse(task.labels);
      } catch {
        task.labels = [];
      }
      // Map snake_case columns to the camelCase the frontend expects
      task.columnId = task.column_id;
      task.dueDate = task.due_date;
      delete task.column_id;
      delete task.due_date;

      created.push(task);
    }

    res.status(201).json({ tasks: created });
  } catch (err) {
    console.error('[github] import error:', err);
    res.status(500).json({ error: err.message || 'Failed to import issues' });
  }
});

module.exports = router;
