-- 智能作业管理系统数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 用户信息表（扩展 Supabase Auth）
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,  -- 关联 Supabase Auth User ID
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',  -- 'teacher' | 'student'
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(10) NOT NULL UNIQUE,  -- 班级邀请码
    teacher_id VARCHAR(36) NOT NULL,   -- 教师 ID
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS classes_teacher_id_idx ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS classes_code_idx ON classes(code);

-- 班级成员关系表
CREATE TABLE IF NOT EXISTS class_members (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',  -- 'teacher' | 'student'
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS class_members_class_id_idx ON class_members(class_id);
CREATE INDEX IF NOT EXISTS class_members_user_id_idx ON class_members(user_id);

-- 作业表
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL,
    due_date TIMESTAMPTZ,
    attachments JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active' | 'closed'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS assignments_class_id_idx ON assignments(class_id);
CREATE INDEX IF NOT EXISTS assignments_teacher_id_idx ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS assignments_status_idx ON assignments(status);

-- 作业提交表
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    content TEXT,
    attachments JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'submitted',  -- 'submitted' | 'graded'
    score INTEGER,
    feedback TEXT,
    graded_by VARCHAR(36),
    graded_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS submissions_assignment_id_idx ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS submissions_student_id_idx ON submissions(student_id);
CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions(status);

-- 设置 Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- profiles 表策略
CREATE POLICY "用户可以查看所有资料" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户只能更新自己的资料" ON profiles FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "注册时可以插入自己的资料" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id);

-- classes 表策略
CREATE POLICY "教师可以创建班级" ON classes FOR INSERT WITH CHECK (auth.uid()::text = teacher_id);
CREATE POLICY "教师可以更新自己的班级" ON classes FOR UPDATE USING (auth.uid()::text = teacher_id);
CREATE POLICY "所有人可以查看班级" ON classes FOR SELECT USING (true);

-- class_members 表策略
CREATE POLICY "可以查看班级成员" ON class_members FOR SELECT USING (true);
CREATE POLICY "可以加入班级" ON class_members FOR INSERT WITH CHECK (true);

-- assignments 表策略
CREATE POLICY "教师可以创建作业" ON assignments FOR INSERT WITH CHECK (auth.uid()::text = teacher_id);
CREATE POLICY "教师可以更新自己的作业" ON assignments FOR UPDATE USING (auth.uid()::text = teacher_id);
CREATE POLICY "可以查看班级作业" ON assignments FOR SELECT USING (true);

-- submissions 表策略
CREATE POLICY "学生可以提交作业" ON submissions FOR INSERT WITH CHECK (auth.uid()::text = student_id);
CREATE POLICY "学生可以更新自己的提交" ON submissions FOR UPDATE USING (auth.uid()::text = student_id OR EXISTS (
    SELECT 1 FROM assignments WHERE assignments.id = submissions.assignment_id AND assignments.teacher_id = auth.uid()::text
));
CREATE POLICY "可以查看提交" ON submissions FOR SELECT USING (true);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每个表添加更新时间触发器
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
