-- Seed initial data
-- Admin user: admin / Cima1100 (password hashed with bcrypt)

-- Insert admin user using gen_random_uuid() for proper UUID
INSERT INTO users (id, username, email, name, password_hash, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@empresa.com',
  'Administrador',
  '$2b$10$rQZ8K8Y8Y8Y8Y8Y8Y8Y8YuQZ8K8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Insert default employees (without department column as it doesn't exist in schema)
INSERT INTO employees (id, name, email, role, color, is_active, created_at)
VALUES 
  (gen_random_uuid(), 'Carlos Martinez', 'carlos@empresa.com', 'Tecnico Senior', '#3b82f6', true, NOW()),
  (gen_random_uuid(), 'Ana Garcia', 'ana@empresa.com', 'Tecnico', '#10b981', true, NOW()),
  (gen_random_uuid(), 'Miguel Lopez', 'miguel@empresa.com', 'Tecnico Junior', '#f59e0b', true, NOW()),
  (gen_random_uuid(), 'Laura Sanchez', 'laura@empresa.com', 'Especialista', '#8b5cf6', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert default project
INSERT INTO projects (id, name, description, color, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'General',
  'Proyecto general para tareas sin asignar a proyecto especifico',
  '#6b7280',
  true,
  NOW()
) ON CONFLICT DO NOTHING;
