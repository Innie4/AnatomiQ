CREATE INDEX IF NOT EXISTS "Course_department_code_idx" ON "Course"("department", "code");
CREATE INDEX IF NOT EXISTS "Material_courseId_status_createdAt_idx" ON "Material"("courseId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Material_topicId_status_idx" ON "Material"("topicId", "status");
CREATE INDEX IF NOT EXISTS "Material_subtopicId_status_idx" ON "Material"("subtopicId", "status");
CREATE INDEX IF NOT EXISTS "Topic_courseId_level_idx" ON "Topic"("courseId", "level");
CREATE INDEX IF NOT EXISTS "Topic_parentTopicId_idx" ON "Topic"("parentTopicId");
