export interface User {
  id: string; name: string; email: string; role: string;
  grade: 'Unranked' | 'Bronze' | 'Silver' | 'Gold'; createdAt: string;
}
export interface Skill { id: string; skillName: string; proficiencyScore: number; }
export interface CvResult { matchScore: number; grade: string; skills: Array<{ name: string; confidence: number }>; }
export interface Course { id: string; title: string; category: string; requiredSkillsJson: string; modules?: CourseModule[]; }
export interface RecommendedCourse extends Course { gapScore: number; missingSkills: string[]; }
export interface CourseModule { id: string; courseId: string; orderIndex: number; moduleType: 'mcq' | 'multi_select' | 'drag_drop'; title: string; questions?: Question[]; }
export interface Question { id: string; moduleId: string; questionText: string; questionType: string; options: QuestionOption[]; }
export interface QuestionOption { id: string; questionId?: string; optionText: string; isCorrect?: boolean; position: number; }
export interface Job { id: string; title: string; location: string; requiredSkillsJson: string; minGrade: string; description?: string; company?: string; matchScore?: number; }
export interface QuizSubmitRequest { answers: Array<{ questionId: string; selectedOptionIds: string[]; dragDropMapping?: Record<string, string>; }>; }
export interface QuizResult { score: number; grade: string; xpGained: number; passed: boolean; correctCount?: number; totalCount?: number; }
export interface AuthResponse { token: string; userId: string; name: string; email: string; grade: string; role: string; }

// ── Feature 3: Job Detail ─────────────────────────────────────────────────────
export interface JobDetail extends Job {
  matchedSkills: string[];
  missingSkills: string[];
  userMeetsGrade: boolean;
}

// ── Feature 5: Course Progress ────────────────────────────────────────────────
export interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  moduleType: string;
  orderIndex: number;
  completed: boolean;
  score: number;
  completedAt: string | null;
}
export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  totalModules: number;
  completedModules: number;
  completionPercent: number;
  averageScore: number;
  modules: ModuleProgress[];
}

// ── Feature 8: Learning Path ──────────────────────────────────────────────────
export interface LearningPathStep {
  step: number;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  skillsGained: string[];
  missingSkills: string[];
  gapScore: number;
  reasonForOrder: string | null;
}
export interface LearningPath {
  targetJobId: string;
  targetJobTitle: string;
  currentGrade: string;
  alreadyEligible: boolean;
  allMissingSkills: string[];
  steps: LearningPathStep[];
}
