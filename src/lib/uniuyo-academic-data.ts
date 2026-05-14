export type UniuyoProgrammeLevel =
  | "Certificate"
  | "Diploma"
  | "Undergraduate"
  | "Postgraduate Diploma"
  | "Masters"
  | "MPhil/PhD"
  | "Doctorate";

export type UniuyoAcademicCourse = {
  name: string;
  levels: UniuyoProgrammeLevel[];
};

export type UniuyoAcademicDepartment = {
  name: string;
  courses: UniuyoAcademicCourse[];
};

export type UniuyoAcademicFaculty = {
  name: string;
  departments: UniuyoAcademicDepartment[];
};

const undergraduate = (name: string): UniuyoAcademicCourse => ({
  name,
  levels: ["Undergraduate"],
});

const pg = (name: string, levels: UniuyoProgrammeLevel[] = ["Masters", "MPhil/PhD", "Doctorate"]): UniuyoAcademicCourse => ({
  name,
  levels,
});

const department = (name: string, courses: UniuyoAcademicCourse[]): UniuyoAcademicDepartment => ({
  name,
  courses,
});

export const UNIUYO_ACADEMIC_STRUCTURE: UniuyoAcademicFaculty[] = [
  {
    name: "Faculty of Agriculture",
    departments: [
      department("Agricultural Economics", [
        undergraduate("Agricultural Economics and Extension"),
        pg("Agricultural Economics"),
      ]),
      department("Agricultural Extension", [
        undergraduate("Agricultural Economics and Extension"),
        pg("Agricultural Extension"),
      ]),
      department("Animal Science", [undergraduate("Animal Science"), pg("Animal Science")]),
      department("Crop Science", [undergraduate("Crop Science"), pg("Crop Science")]),
      department("Fisheries and Aquatic Environmental Management", [
        undergraduate("Fisheries and Aquatic Environmental Management"),
        pg("Fisheries and Aquaculture"),
      ]),
      department("Food Science and Technology", [
        undergraduate("Food Science and Technology"),
        pg("Food Science and Technology"),
      ]),
      department("Forestry and Natural Environmental Management", [
        undergraduate("Forestry and Natural Environmental Management"),
        pg("Forestry and Wildlife"),
      ]),
      department("Home Economics", [undergraduate("Home Economics"), pg("Home Economics")]),
      department("Soil Science and Land Resources Management", [
        undergraduate("Soil Science and Land Resources Management"),
        pg("Soil Science"),
      ]),
      department("Centre for Wetlands and Waste Management Studies", [
        pg("Environmental Health Management", ["Masters"]),
      ]),
    ],
  },
  {
    name: "Faculty of Arts",
    departments: [
      department("English", [undergraduate("English"), pg("English")]),
      department("Foreign Languages", [undergraduate("Foreign Languages (French)"), pg("French Language and Linguistics")]),
      department("History and International Studies", [
        undergraduate("History and International Studies"),
        pg("History and International Studies"),
      ]),
      department("Linguistics and Nigerian Languages", [
        undergraduate("Linguistics and Nigerian Languages"),
        pg("Linguistics"),
        pg("Computational Language Technology"),
      ]),
      department("Music", [undergraduate("Music"), pg("Music")]),
      department("Philosophy", [undergraduate("Philosophy"), pg("Philosophy")]),
      department("Religious and Cultural Studies", [
        undergraduate("Religious and Cultural Studies"),
        pg("Religious Studies"),
      ]),
      department("Theatre and Film Studies", [undergraduate("Theatre Arts"), pg("Theatre and Film Studies")]),
    ],
  },
  {
    name: "Faculty of Basic Medical Sciences",
    departments: [
      department("Human Anatomy", [undergraduate("Human Anatomy"), pg("Anatomy")]),
      department("Human Nutrition and Dietetics", [undergraduate("Human Nutrition and Dietetics")]),
      department("Medical Biochemistry", [undergraduate("Medical Biochemistry"), pg("Medical Biochemistry")]),
      department("Physiology", [pg("Human Physiology")]),
    ],
  },
  {
    name: "Faculty of Basic Clinical Sciences",
    departments: [
      department("Medical Laboratory Science", [undergraduate("Medical Laboratory Science")]),
      department("Medical Microbiology and Parasitology", [pg("Medical Microbiology", ["Masters"])]),
      department("Physiotherapy", [undergraduate("Physiotherapy")]),
      department("Radiography and Radiation Sciences", [undergraduate("Radiography and Radiation Sciences")]),
    ],
  },
  {
    name: "Faculty of Clinical Sciences",
    departments: [
      department("Community Medicine", [pg("Public Health"), pg("Family Medicine")]),
      department("Dental Surgery", [undergraduate("Dental Surgery")]),
      department("Internal Medicine", [pg("Internal Medicine")]),
      department("Medicine and Surgery", [undergraduate("Medicine and Surgery")]),
      department("Nursing Science", [undergraduate("Nursing Science")]),
      department("Obstetrics and Gynaecology", [pg("Obstetrics and Gynaecology")]),
      department("Paediatrics", [pg("Paediatrics")]),
      department("Surgery", [pg("Surgery")]),
    ],
  },
  {
    name: "Faculty of Communication and Media Studies",
    departments: [
      department("Advertising and Marketing Communication", [undergraduate("Advertising and Marketing Communication")]),
      department("Development Communication", [undergraduate("Development Communication")]),
      department("Film and Multimedia Studies", [undergraduate("Film and Multimedia Studies")]),
      department("Information and Media Studies", [undergraduate("Information and Media Studies")]),
      department("Journalism", [undergraduate("Journalism")]),
      department("Public Relations", [undergraduate("Public Relations")]),
      department("Strategic and Corporate Communication", [undergraduate("Strategic and Corporate Communication")]),
    ],
  },
  {
    name: "Faculty of Education",
    departments: [
      department("Curriculum Studies, Educational Management and Planning", [
        undergraduate("English Education"),
        undergraduate("Efik-Ibibio Education"),
        undergraduate("French Education"),
        undergraduate("History Education"),
        undergraduate("Music Education"),
        undergraduate("Religion Education"),
        pg("Curriculum Studies"),
        pg("Educational Management and Planning"),
      ]),
      department("Early Childhood and Special Education", [
        undergraduate("Pre-Primary and Primary Education"),
        undergraduate("Special Education"),
        pg("Early Childhood and Special Education"),
      ]),
      department("Educational Foundations, Guidance and Counselling", [
        undergraduate("Economics Education"),
        undergraduate("Geography Education"),
        undergraduate("Guidance and Counselling"),
        undergraduate("Political Science Education"),
        undergraduate("Social Studies Education"),
        pg("Educational Foundations"),
        pg("Guidance and Counselling"),
        pg("Psychological Foundations of Education"),
        pg("Sociological Foundations of Education"),
        pg("Social Studies and Citizenship Education"),
      ]),
      department("Educational Technology", [pg("Educational Technology")]),
      department("Physical and Health Education", [
        undergraduate("Health Education"),
        undergraduate("Physical Education"),
        pg("Physical Education"),
        pg("Health Education"),
      ]),
      department("Science Education", [
        undergraduate("Biology Education"),
        undergraduate("Chemistry Education"),
        undergraduate("Integrated Science Education"),
        undergraduate("Mathematics Education"),
        undergraduate("Physics Education"),
        pg("Science Education"),
      ]),
    ],
  },
  {
    name: "Faculty of Vocational Education, Library and Information Science",
    departments: [
      department("Agricultural Education", [undergraduate("Agricultural Science Education"), pg("Agricultural Education")]),
      department("Business Education", [undergraduate("Business Education"), pg("Business Education")]),
      department("Home Economics Education", [undergraduate("Home Economics Education"), pg("Home Economics Education")]),
      department("Industrial Technology Education", [
        undergraduate("Industrial Technology Education"),
        pg("Industrial Technology Education"),
      ]),
      department("Library and Information Science", [
        undergraduate("Library and Information Science"),
        pg("Library and Information Science"),
      ]),
      department("Robotics and Computer Education", [
        undergraduate("Computer and Robotics"),
        pg("Computer Education"),
      ]),
    ],
  },
  {
    name: "Faculty of Engineering",
    departments: [
      department("Agricultural Engineering", [undergraduate("Agricultural Engineering"), pg("Agricultural Engineering")]),
      department("Chemical Engineering", [
        undergraduate("Chemical Engineering"),
        pg("Chemical Engineering", ["Postgraduate Diploma", "Masters", "MPhil/PhD", "Doctorate"]),
      ]),
      department("Civil Engineering", [
        undergraduate("Civil Engineering"),
        pg("Civil Engineering", ["Postgraduate Diploma", "Masters", "MPhil/PhD", "Doctorate"]),
      ]),
      department("Computer Engineering", [
        undergraduate("Computer Engineering"),
        pg("Computer Engineering", ["Postgraduate Diploma", "Masters", "MPhil/PhD", "Doctorate"]),
      ]),
      department("Electrical and Electronics Engineering", [
        undergraduate("Electrical and Electronics Engineering"),
        pg("Electrical and Electronics Engineering", ["Postgraduate Diploma", "Masters", "MPhil/PhD", "Doctorate"]),
      ]),
      department("Food Engineering", [undergraduate("Food Engineering"), pg("Food Engineering", ["Postgraduate Diploma", "Masters", "MPhil/PhD", "Doctorate"])]),
      department("Mechanical Engineering", [
        undergraduate("Mechanical Engineering"),
        pg("Mechanical Engineering", ["Postgraduate Diploma", "Masters", "MPhil/PhD", "Doctorate"]),
      ]),
      department("Petroleum Engineering", [
        undergraduate("Petroleum Engineering"),
        pg("Petroleum Engineering", ["Postgraduate Diploma", "Masters", "MPhil/PhD", "Doctorate"]),
      ]),
    ],
  },
  {
    name: "Faculty of Environmental Studies",
    departments: [
      department("Architecture", [undergraduate("Architecture"), pg("Architecture")]),
      department("Building", [undergraduate("Building"), pg("Building")]),
      department("Estate Management", [undergraduate("Estate Management"), pg("Estate Management")]),
      department("Fine and Industrial Arts", [pg("Fine and Industrial Arts"), pg("Art Education", ["Masters"])]),
      department("Geoinformatics and Surveying", [
        undergraduate("Geoinformatics and Surveying"),
        pg("Geoinformatics and Surveying"),
      ]),
      department("Quantity Surveying", [undergraduate("Quantity Surveying"), pg("Quantity Surveying")]),
      department("Urban and Regional Planning", [
        undergraduate("Urban and Regional Planning"),
        pg("Urban and Regional Planning"),
      ]),
    ],
  },
  {
    name: "Faculty of Management Sciences",
    departments: [
      department("Accounting", [undergraduate("Accounting"), pg("Accounting")]),
      department("Banking and Finance", [undergraduate("Banking and Finance"), pg("Banking and Finance")]),
      department("Business Management", [undergraduate("Business Management"), pg("Business Management")]),
      department("Insurance", [undergraduate("Insurance"), pg("Insurance and Risk Management")]),
      department("Marketing", [undergraduate("Marketing"), pg("Marketing")]),
    ],
  },
  {
    name: "Faculty of Pharmacy",
    departments: [
      department("Clinical Pharmacy and Biopharmacy", [pg("Clinical Pharmacy")]),
      department("Pharmaceutical and Medicinal Chemistry", [pg("Pharmaceutical and Medicinal Chemistry")]),
      department("Pharmaceutical Microbiology and Biotechnology", [pg("Pharmaceutical Microbiology and Biotechnology")]),
      department("Pharmaceutics and Pharmaceutical Technology", [
        pg("Pharmaceutics and Pharmaceutical Technology"),
        pg("Pharmaceutical Microbiology"),
      ]),
      department("Pharmacognosy and Natural Medicine", [pg("Pharmacognosy and Natural Medicine")]),
      department("Pharmacology and Toxicology", [pg("Pharmacology")]),
      department("Pharmacy", [undergraduate("Pharmacy")]),
    ],
  },
  {
    name: "Faculty of Biological Sciences",
    departments: [
      department("Animal and Environmental Biology", [
        undergraduate("Animal Science and Environmental Biology"),
        pg("Animal and Environmental Biology"),
      ]),
      department("Biochemistry", [undergraduate("Biochemistry"), pg("Biochemistry")]),
      department("Botany and Ecological Studies", [
        undergraduate("Botany and Ecological Studies"),
        pg("Botany"),
      ]),
      department("Microbiology", [undergraduate("Microbiology"), pg("Microbiology")]),
    ],
  },
  {
    name: "Faculty of Physical Sciences",
    departments: [
      department("Chemistry", [undergraduate("Chemistry"), pg("Chemistry")]),
      department("Geology", [undergraduate("Geology")]),
      department("Geophysics", [undergraduate("Geophysics")]),
      department("Mathematics", [undergraduate("Mathematics"), pg("Mathematics")]),
      department("Physics", [undergraduate("Physics"), pg("Physics"), pg("Applied Physics")]),
      department("Statistics", [undergraduate("Statistics"), pg("Statistics")]),
    ],
  },
  {
    name: "Faculty of Computing",
    departments: [
      department("Computer Science", [
        undergraduate("Computer Science"),
        pg("Computer Science"),
        pg("Computational Intelligence"),
        pg("Data Science", ["Masters"]),
        pg("Cyber Security", ["Masters"]),
      ]),
    ],
  },
  {
    name: "Faculty of Law",
    departments: [
      department("Law", [
        undergraduate("Law"),
        pg("Humanitarian Law and Social Justice", ["Postgraduate Diploma"]),
        pg("Law", ["Masters", "MPhil/PhD", "Doctorate"]),
      ]),
    ],
  },
  {
    name: "Faculty of Social Sciences",
    departments: [
      department("Economics", [undergraduate("Economics"), pg("Economics")]),
      department("Geography and Natural Resources Management", [
        undergraduate("Geography and Natural Resources Management"),
        pg("Geography and Natural Resources Management"),
        pg("Environment and Development", ["Masters", "Doctorate"]),
      ]),
      department("Political Science and Public Administration", [
        undergraduate("Political Science and Public Administration"),
        pg("Political Science"),
        pg("International Relations"),
        pg("Comparative Politics", ["Doctorate"]),
      ]),
      department("Public Administration", [pg("Public Administration")]),
      department("Psychology", [undergraduate("Psychology"), pg("Clinical Psychology"), pg("Industrial/Organizational Psychology and Social Psychology")]),
      department("Sociology and Anthropology", [
        undergraduate("Sociology and Anthropology"),
        pg("Sociology and Anthropology"),
      ]),
    ],
  },
  {
    name: "Faculty of Dentistry",
    departments: [
      department("Dentistry", [undergraduate("Dental Surgery")]),
    ],
  },
  {
    name: "Faculty of Allied Health Sciences",
    departments: [
      department("Medical Laboratory Science", [undergraduate("Medical Laboratory Science")]),
      department("Nursing Science", [undergraduate("Nursing Science")]),
      department("Physiotherapy", [undergraduate("Physiotherapy")]),
      department("Radiography and Radiation Sciences", [undergraduate("Radiography and Radiation Sciences")]),
    ],
  },
  {
    name: "School of Continuing Education and Professional Studies",
    departments: [
      department("Certificate Programmes", [
        { name: "Certificate in French", levels: ["Certificate"] },
        { name: "Certificate in Fine and Industrial Arts", levels: ["Certificate"] },
        { name: "Certificate in Music", levels: ["Certificate"] },
      ]),
      department("Diploma Programmes", [
        { name: "Diploma in Music", levels: ["Diploma"] },
        { name: "Diploma in Theatre Arts", levels: ["Diploma"] },
        { name: "Diploma in Religious Studies", levels: ["Diploma"] },
        { name: "Diploma in International History and Diplomacy", levels: ["Diploma"] },
        { name: "Diploma in Mass Communication", levels: ["Diploma"] },
        { name: "Diploma in Physical Education", levels: ["Diploma"] },
        { name: "Diploma in Library Science", levels: ["Diploma"] },
      ]),
      department("Postgraduate Programmes", [
        pg("Business Administration (Executive)", ["Postgraduate Diploma", "Masters"]),
        pg("Education", ["Postgraduate Diploma"]),
        pg("Educational Management and Planning", ["Masters"]),
        pg("Environmental Management", ["Postgraduate Diploma"]),
        pg("Public Administration", ["Postgraduate Diploma"]),
        pg("International Relations", ["Postgraduate Diploma"]),
        pg("Local Government and Rural Development", ["Postgraduate Diploma"]),
        pg("Public Order and Information Management", ["Masters"]),
      ]),
    ],
  },
];

export type AcademicOption = {
  id: string;
  value: string;
  label: string;
  faculty: string;
  department: string;
  course: string;
  levels: UniuyoProgrammeLevel[];
  searchText: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function optionId(...parts: string[]) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const AUTH_FACULTIES = UNIUYO_ACADEMIC_STRUCTURE.map((faculty) => faculty.name);

export const AUTH_DEPARTMENTS = Array.from(
  new Set(UNIUYO_ACADEMIC_STRUCTURE.flatMap((faculty) => faculty.departments.map((item) => item.name))),
).sort((first, second) => first.localeCompare(second));

export const AUTH_COURSES = Array.from(
  new Set(
    UNIUYO_ACADEMIC_STRUCTURE.flatMap((faculty) =>
      faculty.departments.flatMap((item) => item.courses.map((course) => course.name)),
    ),
  ),
).sort((first, second) => first.localeCompare(second));

export const UNIUYO_ACADEMIC_OPTIONS: AcademicOption[] = Array.from(
  UNIUYO_ACADEMIC_STRUCTURE.reduce((options, faculty) => {
    for (const item of faculty.departments) {
      for (const course of item.courses) {
        const id = optionId(faculty.name, item.name, course.name);
        const existing = options.get(id);
        const levels = existing
          ? Array.from(new Set([...existing.levels, ...course.levels]))
          : course.levels;

        options.set(id, {
          id,
          value: course.name,
          label: `${course.name} - ${item.name}`,
          faculty: faculty.name,
          department: item.name,
          course: course.name,
          levels,
          searchText: normalize(`${faculty.name} ${item.name} ${course.name} ${levels.join(" ")}`),
        });
      }
    }

    return options;
  }, new Map<string, AcademicOption>()).values(),
);

export function isKnownFaculty(value: string) {
  const target = normalize(value);
  return AUTH_FACULTIES.some((faculty) => normalize(faculty) === target);
}

export function isKnownDepartment(value: string) {
  const target = normalize(value);
  return AUTH_DEPARTMENTS.some((departmentName) => normalize(departmentName) === target);
}

export function isKnownCourse(value: string) {
  const target = normalize(value);
  return AUTH_COURSES.some((courseName) => normalize(courseName) === target);
}

export function getDepartmentsForFaculty(facultyName?: string) {
  if (!facultyName) {
    return AUTH_DEPARTMENTS;
  }

  const faculty = UNIUYO_ACADEMIC_STRUCTURE.find((item) => item.name === facultyName);
  return faculty?.departments.map((item) => item.name) ?? [];
}

export function getAcademicOptionsForSelection(facultyName?: string, departmentName?: string) {
  return UNIUYO_ACADEMIC_OPTIONS.filter((option) => {
    if (facultyName && option.faculty !== facultyName) {
      return false;
    }

    if (departmentName && option.department !== departmentName) {
      return false;
    }

    return true;
  });
}

export function findAcademicOptionByCourse(courseName?: string) {
  if (!courseName) {
    return undefined;
  }

  const target = normalize(courseName);
  return UNIUYO_ACADEMIC_OPTIONS.find((option) => normalize(option.course) === target);
}
