"use client";

import { useMemo, useState } from "react";
import { Check, GraduationCap, Search } from "lucide-react";

import {
  AUTH_FACULTIES,
  getAcademicOptionsForSelection,
  getDepartmentsForFaculty,
  UNIUYO_ACADEMIC_OPTIONS,
  type AcademicOption,
} from "@/lib/uniuyo-academic-data";

export type AcademicProfileSelection = {
  faculty: string;
  department: string;
  course: string;
};

type AcademicProfileSelectorProps = {
  value: AcademicProfileSelection;
  onChange: (value: AcademicProfileSelection) => void;
  disabled?: boolean;
  required?: boolean;
};

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

function matchesQuery(option: SelectOption, query: string) {
  const target = query.trim().toLowerCase();
  if (!target) {
    return true;
  }

  return `${option.label} ${option.description ?? ""}`.toLowerCase().includes(target);
}

function SelectableSearchList({
  label,
  value,
  options,
  placeholder,
  emptyText,
  onSelect,
  disabled,
  required,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  emptyText: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(
    () => options.filter((option) => matchesQuery(option, query)).slice(0, 80),
    [options, query],
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label} {required ? null : <span className="text-slate-400">(Optional)</span>}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
        {filteredOptions.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={`${label}-${option.value}-${option.description ?? ""}`}
              type="button"
              onClick={() => onSelect(option.value)}
              disabled={disabled}
              className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition ${
                selected
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                }`}
              >
                {selected ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                ) : null}
              </span>
            </button>
          );
        })}
        {!filteredOptions.length ? (
          <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">{emptyText}</div>
        ) : null}
      </div>
    </div>
  );
}

function courseDescription(option: AcademicOption) {
  return `${option.faculty} / ${option.department} / ${option.levels.join(", ")}`;
}

export function AcademicProfileSelector({
  value,
  onChange,
  disabled = false,
  required = true,
}: AcademicProfileSelectorProps) {
  const departmentOptions = useMemo(
    () =>
      getDepartmentsForFaculty(value.faculty).map((department) => ({
        value: department,
        label: department,
        description: value.faculty || undefined,
      })),
    [value.faculty],
  );

  const courseOptions = useMemo(
    () =>
      getAcademicOptionsForSelection(value.faculty, value.department).map((option) => ({
        value: option.course,
        label: option.course,
        description: courseDescription(option),
      })),
    [value.department, value.faculty],
  );

  const handleFacultySelect = (faculty: string) => {
    const nextDepartments = getDepartmentsForFaculty(faculty);
    const keepDepartment = nextDepartments.includes(value.department);
    const nextDepartment = keepDepartment ? value.department : "";
    const nextCourse = getAcademicOptionsForSelection(faculty, nextDepartment).some(
      (option) => option.course === value.course,
    )
      ? value.course
      : "";

    onChange({ faculty, department: nextDepartment, course: nextCourse });
  };

  const handleDepartmentSelect = (department: string) => {
    const selectedOption = UNIUYO_ACADEMIC_OPTIONS.find((option) => option.department === department);
    const faculty = value.faculty || selectedOption?.faculty || "";
    const nextCourse = getAcademicOptionsForSelection(faculty, department).some(
      (option) => option.course === value.course,
    )
      ? value.course
      : "";

    onChange({ faculty, department, course: nextCourse });
  };

  const handleCourseSelect = (course: string) => {
    const selectedOption = getAcademicOptionsForSelection(value.faculty, value.department).find(
      (option) => option.course === course,
    ) ?? UNIUYO_ACADEMIC_OPTIONS.find((option) => option.course === course);

    onChange({
      faculty: selectedOption?.faculty || value.faculty,
      department: selectedOption?.department || value.department,
      course,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        <GraduationCap className="h-4 w-4 text-blue-600" />
        Academic profile
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SelectableSearchList
          label="Faculty"
          value={value.faculty}
          options={AUTH_FACULTIES.map((faculty) => ({ value: faculty, label: faculty }))}
          placeholder="Search faculties..."
          emptyText="No faculty matches that search."
          onSelect={handleFacultySelect}
          disabled={disabled}
          required={required}
        />
        <SelectableSearchList
          label="Department"
          value={value.department}
          options={departmentOptions}
          placeholder="Search departments..."
          emptyText="No department matches that search."
          onSelect={handleDepartmentSelect}
          disabled={disabled}
          required={required}
        />
        <SelectableSearchList
          label="Course"
          value={value.course}
          options={courseOptions}
          placeholder="Search undergraduate or postgraduate courses..."
          emptyText="No course matches that search."
          onSelect={handleCourseSelect}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  );
}
