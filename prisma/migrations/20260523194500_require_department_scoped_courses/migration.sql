DROP INDEX IF EXISTS "Course_department_code_idx";
DROP INDEX IF EXISTS "Course_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Course_department_code_key" ON "Course"("department", "code");
