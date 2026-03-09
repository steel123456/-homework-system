import { pgTable, serial, timestamp, varchar, text, boolean, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

// 健康检查表（系统表，不要删除）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户信息表（扩展 Supabase Auth）
export const profiles = pgTable(
	"profiles",
	{
		id: varchar("id", { length: 36 }).primaryKey(), // 关联 Supabase Auth User ID
		email: varchar("email", { length: 255 }).notNull().unique(),
		name: varchar("name", { length: 100 }).notNull(),
		role: varchar("role", { length: 20 }).notNull().default("student"), // 'teacher' | 'student'
		avatarUrl: text("avatar_url"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("profiles_email_idx").on(table.email),
		index("profiles_role_idx").on(table.role),
	]
);

// 班级表
export const classes = pgTable(
	"classes",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		code: varchar("code", { length: 10 }).notNull().unique(), // 班级邀请码
		teacherId: varchar("teacher_id", { length: 36 }).notNull(), // 教师 ID
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("classes_teacher_id_idx").on(table.teacherId),
		index("classes_code_idx").on(table.code),
	]
);

// 班级成员关系表
export const classMembers = pgTable(
	"class_members",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		classId: varchar("class_id", { length: 36 }).notNull(),
		userId: varchar("user_id", { length: 36 }).notNull(),
		role: varchar("role", { length: 20 }).notNull().default("student"), // 'teacher' | 'student'
		joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("class_members_class_id_idx").on(table.classId),
		index("class_members_user_id_idx").on(table.userId),
	]
);

// 作业表
export const assignments = pgTable(
	"assignments",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		title: varchar("title", { length: 200 }).notNull(),
		description: text("description").notNull(),
		classId: varchar("class_id", { length: 36 }).notNull(),
		teacherId: varchar("teacher_id", { length: 36 }).notNull(),
		dueDate: timestamp("due_date", { withTimezone: true }),
		attachments: jsonb("attachments").default([]), // 附件列表
		status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'closed'
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("assignments_class_id_idx").on(table.classId),
		index("assignments_teacher_id_idx").on(table.teacherId),
		index("assignments_status_idx").on(table.status),
	]
);

// 作业提交表
export const submissions = pgTable(
	"submissions",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		assignmentId: varchar("assignment_id", { length: 36 }).notNull(),
		studentId: varchar("student_id", { length: 36 }).notNull(),
		content: text("content"), // 文字内容
		attachments: jsonb("attachments").default([]), // 图片附件列表 [{ url: string, key: string }]
		status: varchar("status", { length: 20 }).notNull().default("submitted"), // 'submitted' | 'graded'
		score: integer("score"), // 分数
		feedback: text("feedback"), // AI 评价或教师评价
		gradedBy: varchar("graded_by", { length: 36 }), // 批改者 ID（AI 或教师）
		gradedAt: timestamp("graded_at", { withTimezone: true }),
		submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("submissions_assignment_id_idx").on(table.assignmentId),
		index("submissions_student_id_idx").on(table.studentId),
		index("submissions_status_idx").on(table.status),
	]
);

// Schema factory with date coercion
const { createInsertSchema, createSelectSchema } = createSchemaFactory({
	coerce: { date: true },
});

// Zod schemas for validation
export const insertProfileSchema = createInsertSchema(profiles);
export const updateProfileSchema = createInsertSchema(profiles).partial();

export const insertClassSchema = createInsertSchema(classes);
export const updateClassSchema = createInsertSchema(classes).partial();

export const insertClassMemberSchema = createInsertSchema(classMembers);

export const insertAssignmentSchema = createInsertSchema(assignments);
export const updateAssignmentSchema = createInsertSchema(assignments).partial();

export const insertSubmissionSchema = createInsertSchema(submissions);
export const updateSubmissionSchema = createInsertSchema(submissions).partial();

// TypeScript types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type UpdateClass = z.infer<typeof updateClassSchema>;

export type ClassMember = typeof classMembers.$inferSelect;
export type InsertClassMember = z.infer<typeof insertClassMemberSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type UpdateSubmission = z.infer<typeof updateSubmissionSchema>;
