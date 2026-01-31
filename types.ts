
export interface UserPreferences {
  nebulaIntensity: number; // 0.1 to 1.0
  glassStrength: 'none' | 'low' | 'high';
  fontStyle: 'modern' | 'technical';
  startTab: AppTab;
  reducedMotion: boolean;
  // New visual options
  enableTexture: boolean;
  interfaceRoundness: 'none' | 'modern' | 'full'; // 'none' = sharp, 'modern' = xl, 'full' = 2xl/3xl
  sidebarPosition: 'left' | 'right';
  lowPowerMode: boolean; // Disables heavy effects for mobile performance
  compactMode: boolean; // NEW: Increases information density on mobile
}

export interface User {
  name: string;
  email?: string;
  semester: number;
  university?: string;
  logoUrl?: string;
  career?: string;
  targetGrade: number;
  maxGrade: number;
  minGrade: number;
  theme: 'dark' | 'light';
  accentColor: 'cortex' | 'emerald' | 'royal' | 'rose' | 'amber';
  gradingMode: 'simple' | 'detailed';
  
  // Customization
  preferences: UserPreferences;

  // AI & Gamification
  selectedModel: 'flash' | 'pro';
  unlockedModels: ('flash' | 'pro')[];
  completedAchievements: string[]; // IDs of completed achievements
}

export type AiModelId = 'flash' | 'pro';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any; // Lucide Icon name is handled in component
  condition: (user: User, tasks: Task[], courses: Course[]) => boolean;
  reward: string;
}

export interface GradeActivity {
  id: number;
  name: string;
  weight: number; // Percentage relative to the Cut
  grade: string;
}

export interface GradeCut {
  id: number;
  name: string;
  weight: number; // 0-100 relative to Course
  grade: string;
  activities?: GradeActivity[]; // Optional sub-grades
}

export interface Resource {
  id: number;
  title: string;
  url: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
  professor: string;
  semester: number;
  modality: 'presencial' | 'virtual';
  location: string;
  color: string;
  average: string;
  progress: number;
  cuts: GradeCut[];
  resources: Resource[];
  schedule?: {
    day: string;
    time: string;
  };
}

export interface Task {
  id: number;
  text: string;
  date: string;
  done: boolean; 
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'high' | 'medium' | 'low';
  description?: string;
}

export interface NexusDocument {
  id: string;
  title: string;
  content: string; // The raw text
  type: 'text' | 'code' | 'summary';
  createdAt: string;
  tags?: string[];
  summary?: string; // Cache auto-generated summary
}

export interface UniversityDBEntry {
  k: string[];
  name: string;
  domain: string;
  isGuess?: boolean;
}

export type AuthState = 'LOGIN' | 'ONBOARDING' | 'APP';
export type AppTab = 'dashboard' | 'courses' | 'cronos' | 'oracle' | 'nexus' | 'settings';
