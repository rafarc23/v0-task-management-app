-- Performance optimization indexes for the database
-- Run this script to improve query performance

-- Sessions table indexes (critical for every authenticated request)
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Tasks table indexes (heavily queried)
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_requested_by_id ON tasks(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);

-- Composite index for the main tasks query (archived + created_at)
CREATE INDEX IF NOT EXISTS idx_tasks_archived_created ON tasks(is_archived, created_at DESC);

-- Employees table indexes
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Task attachments index
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- Task comments index
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- Task history index
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);

-- Analyze tables to update statistics
ANALYZE sessions;
ANALYZE users;
ANALYZE tasks;
ANALYZE employees;
ANALYZE projects;
ANALYZE notifications;
ANALYZE task_attachments;
ANALYZE task_comments;
ANALYZE task_history;
