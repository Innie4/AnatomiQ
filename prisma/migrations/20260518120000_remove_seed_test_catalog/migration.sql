CREATE TEMP TABLE "_cleanup_material_ids" AS
SELECT m."id"
FROM "Material" m
JOIN "Course" c ON c."id" = m."courseId"
WHERE c."code" ILIKE 'TEST%'
   OR c."code" ILIKE 'PROBE%'
   OR c."slug" ILIKE '%integration%'
   OR c."slug" ILIKE '%probe%'
   OR m."title" ILIKE 'E2E Test Material%'
   OR m."title" ILIKE 'Integration Material%'
   OR m."title" ILIKE 'Codex % Repro%'
   OR m."fileName" ILIKE 'e2e-test-material%'
   OR m."fileName" ILIKE 'integration-%'
   OR m."fileName" ILIKE 'prod-process-repro%';

DELETE FROM "Question"
WHERE "materialId" IN (SELECT "id" FROM "_cleanup_material_ids");

DELETE FROM "Material"
WHERE "id" IN (SELECT "id" FROM "_cleanup_material_ids");

CREATE TEMP TABLE "_cleanup_course_ids" AS
SELECT c."id"
FROM "Course" c
WHERE c."code" IN ('GEN101', 'MAT101')
   OR c."code" ILIKE 'TEST%'
   OR c."code" ILIKE 'PROBE%'
   OR c."slug" IN (
     'general-science',
     'mathematics',
     'production-upload-probe',
     'production-pdf-upload-probe'
   )
   OR c."slug" ILIKE '%integration%'
   OR c."slug" ILIKE '%probe%'
   OR NOT EXISTS (
     SELECT 1
     FROM "Material" m
     WHERE m."courseId" = c."id"
   );

CREATE TEMP TABLE "_cleanup_topic_ids" AS
SELECT t."id"
FROM "Topic" t
WHERE t."courseId" IN (SELECT "id" FROM "_cleanup_course_ids");

DELETE FROM "AnalyticsCounter"
WHERE "topicId" IN (SELECT "id" FROM "_cleanup_topic_ids");

DELETE FROM "Question"
WHERE "courseId" IN (SELECT "id" FROM "_cleanup_course_ids")
   OR "topicId" IN (SELECT "id" FROM "_cleanup_topic_ids")
   OR "subtopicId" IN (SELECT "id" FROM "_cleanup_topic_ids");

DELETE FROM "ConceptFact"
WHERE "conceptId" IN (
  SELECT "id"
  FROM "Concept"
  WHERE "topicId" IN (SELECT "id" FROM "_cleanup_topic_ids")
     OR "subtopicId" IN (SELECT "id" FROM "_cleanup_topic_ids")
);

DELETE FROM "Concept"
WHERE "topicId" IN (SELECT "id" FROM "_cleanup_topic_ids")
   OR "subtopicId" IN (SELECT "id" FROM "_cleanup_topic_ids");

DELETE FROM "ContentChunk"
WHERE "topicId" IN (SELECT "id" FROM "_cleanup_topic_ids")
   OR "subtopicId" IN (SELECT "id" FROM "_cleanup_topic_ids")
   OR "materialId" IN (
     SELECT "id"
     FROM "Material"
     WHERE "courseId" IN (SELECT "id" FROM "_cleanup_course_ids")
   );

DELETE FROM "Material"
WHERE "courseId" IN (SELECT "id" FROM "_cleanup_course_ids");

DELETE FROM "Topic"
WHERE "id" IN (SELECT "id" FROM "_cleanup_topic_ids")
  AND "level" > 0;

DELETE FROM "Topic"
WHERE "id" IN (SELECT "id" FROM "_cleanup_topic_ids");

DELETE FROM "Course"
WHERE "id" IN (SELECT "id" FROM "_cleanup_course_ids");

DROP TABLE "_cleanup_topic_ids";
DROP TABLE "_cleanup_course_ids";
DROP TABLE "_cleanup_material_ids";
