import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AUTH_COURSES,
  AUTH_DEPARTMENTS,
  AUTH_FACULTIES,
  getAcademicOptionsForSelection,
  isKnownCourse,
  isKnownDepartment,
  isKnownFaculty,
  UNIUYO_ACADEMIC_OPTIONS,
} from "@/lib/uniuyo-academic-data";

describe("UNIUYO academic data", () => {
  it("covers the current faculty, department, and course selectors", () => {
    assert.ok(AUTH_FACULTIES.includes("Faculty of Agriculture"));
    assert.ok(AUTH_FACULTIES.includes("Faculty of Computing"));
    assert.ok(AUTH_FACULTIES.includes("School of Continuing Education and Professional Studies"));
    assert.ok(AUTH_DEPARTMENTS.includes("Human Anatomy"));
    assert.ok(AUTH_COURSES.includes("Medicine and Surgery"));
    assert.ok(AUTH_COURSES.includes("Data Science"));
  });

  it("validates known selector values", () => {
    assert.equal(isKnownFaculty("Faculty of Pharmacy"), true);
    assert.equal(isKnownDepartment("Computer Science"), true);
    assert.equal(isKnownCourse("Humanitarian Law and Social Justice"), true);
    assert.equal(isKnownCourse("Totally Unknown Course"), false);
  });

  it("returns postgraduate courses with their owning faculty and department", () => {
    const options = getAcademicOptionsForSelection("Faculty of Computing", "Computer Science");
    const dataScience = options.find((option) => option.course === "Data Science");

    assert.ok(dataScience);
    assert.deepEqual(dataScience.levels, ["Masters"]);
    assert.equal(dataScience.faculty, "Faculty of Computing");
    assert.equal(dataScience.department, "Computer Science");
  });

  it("keeps searchable options unique by faculty, department, and course", () => {
    const ids = new Set(UNIUYO_ACADEMIC_OPTIONS.map((option) => option.id));
    assert.equal(ids.size, UNIUYO_ACADEMIC_OPTIONS.length);
  });
});
