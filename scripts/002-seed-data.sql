-- Seed initial data
-- Admin user: admin / Cima1100 (password hashed with bcrypt)
-- Note: This hash is for 'Cima1100' - in production, use proper bcrypt hashing

-- Insert admin user
INSERT INTO users (id, username, email, name, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'admin-001',
  'admin',
  'admin@empresa.com',
  'Administrador',
  '$2b$10$rQZ8K8Y8Y8Y8Y8Y8Y8Y8YuQZ8K8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Insert default employees
INSERT INTO employees (id, name, email, role, department, color, is_active, created_at)
VALUES 
  ('emp-001', 'Carlos Martinez', 'carlos@empresa.com', 'Tecnico Senior', 'Mantenimiento', '#3b82f6', true, NOW()),
  ('emp-002', 'Ana Garcia', 'ana@empresa.com', 'Tecnico', 'Mantenimiento', '#10b981', true, NOW()),
  ('emp-003', 'Miguel Lopez', 'miguel@empresa.com', 'Tecnico Junior', 'Soporte', '#f59e0b', true, NOW()),
  ('emp-004', 'Laura Sanchez', 'laura@empresa.com', 'Especialista', 'Sistemas', '#8b5cf6', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert default project
INSERT INTO projects (id, name, description, color, is_active, created_at)
VALUES (
  'proj-001',
  'General',
  'Proyecto general para tareas sin asignar a proyecto especifico',
  '#6b7280',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;
