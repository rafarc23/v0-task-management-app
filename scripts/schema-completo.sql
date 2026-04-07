-- =============================================================================
-- ESQUEMA POSTGRESQL COMPLETO PARA APLICACION DE GESTION DE TAREAS
-- Compatible con: PostgreSQL 12+
-- Conexion: postgresql://admin@192.168.10.203:5432/tareasbd
-- =============================================================================

-- =============================================================================
-- PASO 0: CREAR BASE DE DATOS (ejecutar como superusuario postgres)
-- =============================================================================
-- Ejecutar esto SOLO si la base de datos no existe:
-- CREATE DATABASE tareasbd OWNER admin;

-- =============================================================================
-- PASO 1: EXTENSION UUID (necesaria para generar IDs)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PASO 2: ELIMINAR TABLAS EXISTENTES (en orden correcto por dependencias)
-- =============================================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_attachments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- PASO 3: CREAR TABLAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabla: users
-- Almacena usuarios del sistema (admin, empleados, solicitantes)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'requester')),
    avatar TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: sessions
-- Sesiones de usuario para autenticacion con cookies HTTP-only
-- -----------------------------------------------------------------------------
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: employees
-- Empleados que pueden ser asignados a tareas
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Empleado',
    avatar TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: projects
-- Proyectos para agrupar tareas
-- -----------------------------------------------------------------------------
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: tasks
-- Tareas/solicitudes del sistema
-- -----------------------------------------------------------------------------
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
    priority VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
    due_date DATE,
    due_time TIME,
    assigned_to_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    requested_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: task_attachments
-- Archivos adjuntos de las tareas (imagenes, audio, documentos)
-- -----------------------------------------------------------------------------
CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'audio', 'document')),
    url TEXT NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: task_comments
-- Comentarios en las tareas
-- -----------------------------------------------------------------------------
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: task_history
-- Historial de cambios de las tareas
-- -----------------------------------------------------------------------------
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Tabla: notifications
-- Notificaciones para usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PASO 4: CREAR INDICES PARA OPTIMIZAR CONSULTAS
-- =============================================================================

-- Indices para users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Indices para sessions
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Indices para employees
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_is_active ON employees(is_active);

-- Indices para projects
CREATE INDEX idx_projects_is_active ON projects(is_active);

-- Indices para tasks
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX idx_tasks_requested_by_id ON tasks(requested_by_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

-- Indices para task_attachments
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);

-- Indices para task_comments
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

-- Indices para task_history
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_user_id ON task_history(user_id);

-- Indices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =============================================================================
-- PASO 5: CREAR TRIGGER PARA ACTUALIZAR updated_at AUTOMATICAMENTE
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tasks
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PASO 6: DATOS SEED - USUARIO ADMIN
-- =============================================================================

-- Usuario admin (password: Cima1100)
-- NOTA: En produccion, usar bcrypt para hashear la contrasena
INSERT INTO users (id, username, email, name, password_hash, role, is_active, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'admin',
    'admin@empresa.com',
    'Administrador',
    'Cima1100',  -- En produccion: usar bcrypt hash
    'admin',
    true,
    NOW(),
    NOW()
);

-- =============================================================================
-- PASO 7: DATOS SEED - EMPLEADOS DE EJEMPLO
-- =============================================================================

-- Obtener el ID del admin para vincularlo como empleado
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    
    -- Crear empleado vinculado al admin
    INSERT INTO employees (id, user_id, name, email, role, color, is_active, created_at)
    VALUES (
        uuid_generate_v4(),
        admin_user_id,
        'Administrador',
        'admin@empresa.com',
        'Administrador',
        '#ef4444',
        true,
        NOW()
    );
END $$;

-- Empleados adicionales de ejemplo (sin usuario vinculado)
INSERT INTO employees (id, user_id, name, email, role, color, is_active, created_at)
VALUES 
    (uuid_generate_v4(), NULL, 'Juan Garcia', 'juan.garcia@empresa.com', 'Desarrollador', '#3b82f6', true, NOW()),
    (uuid_generate_v4(), NULL, 'Maria Lopez', 'maria.lopez@empresa.com', 'Disenadora', '#8b5cf6', true, NOW()),
    (uuid_generate_v4(), NULL, 'Carlos Rodriguez', 'carlos.rodriguez@empresa.com', 'Analista', '#10b981', true, NOW());

-- =============================================================================
-- PASO 8: DATOS SEED - PROYECTO DE EJEMPLO
-- =============================================================================

INSERT INTO projects (id, name, description, color, is_active, created_at)
VALUES (
    uuid_generate_v4(),
    'Proyecto General',
    'Proyecto por defecto para tareas generales',
    '#3b82f6',
    true,
    NOW()
);

-- =============================================================================
-- PASO 9: PERMISOS PARA EL USUARIO admin DE POSTGRESQL
-- =============================================================================

-- Otorgar permisos completos al usuario admin sobre todas las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT USAGE ON SCHEMA public TO admin;

-- Permisos para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO admin;

-- =============================================================================
-- PASO 10: VERIFICACION DE INSTALACION
-- =============================================================================

-- Verificar que todas las tablas fueron creadas
DO $$
DECLARE
    tabla_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tabla_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('users', 'sessions', 'employees', 'projects', 'tasks', 
                       'task_attachments', 'task_comments', 'task_history', 'notifications');
    
    IF tabla_count = 9 THEN
        RAISE NOTICE '✓ Todas las 9 tablas fueron creadas correctamente';
    ELSE
        RAISE WARNING '✗ Error: Solo se crearon % de 9 tablas', tabla_count;
    END IF;
END $$;

-- Verificar usuario admin
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin' AND role = 'admin') INTO admin_exists;
    
    IF admin_exists THEN
        RAISE NOTICE '✓ Usuario admin creado correctamente';
    ELSE
        RAISE WARNING '✗ Error: Usuario admin no encontrado';
    END IF;
END $$;

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================
-- 
-- Para ejecutar este script en tu servidor Ubuntu:
--
-- psql -h 192.168.10.203 -U admin -d tareasbd -f schema-completo.sql
--
-- O conectandote primero:
--
-- psql -h 192.168.10.203 -U admin -d tareasbd
-- \i schema-completo.sql
--
-- Credenciales de acceso a la aplicacion:
-- Usuario: admin
-- Contrasena: Cima1100
-- =============================================================================
