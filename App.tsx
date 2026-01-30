
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, FileText, ListTodo, Target, Settings, LogOut, Menu, X, Sparkles, Bot, Send, Brain, Search, Bell, Calendar, AlertTriangle, Info, Check, Loader, Paperclip, Image as ImageIcon, BadgeCheck, HelpCircle, Trophy, Clock, Zap, BookOpen, Database, Network, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Trash2, Download, Wifi, WifiOff, RefreshCw, ShieldAlert } from 'lucide-react';
import { User, Course, Task, AppTab, AuthState, Achievement } from './types';
import { AuthScreen } from './components/Auth';
import { OnboardingWizard } from './components/Onboarding';
import { CourseManagerModal } from './components/CourseManager';
import { CronosModule, OracleModule, DashboardModule, SettingsModule, CoursesModule, NexusModule } from './components/Modules';
import { TutorialModal } from './components/Tutorial';
import { MobileNavBar } from './components/MobileNavBar';
import { ACHIEVEMENTS } from './components/modules/Settings';
import { generateText, checkAiConnection } from './services/gemini';
import { isNativeApp, triggerHaptic } from './services/platform';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged, signOut } from './services/firebase';

// @ts-ignore
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkMath from 'remark-math';
// @ts-ignore
import rehypeKatex from 'rehype-katex';
// @ts-ignore
import remarkGfm from 'remark-gfm';

const SidebarItem: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void; collapsed?: boolean }> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick} 
    title={collapsed ? label : undefined}
    className={`group relative flex items-center gap-3 p-3 my-1 rounded-lg transition-all duration-300 w-full outline-none font-medium ${active ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'} ${collapsed ? 'justify-center' : 'justify-start'}`}
  >
    <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
    {!collapsed && <span className="text-sm whitespace-nowrap animate-in fade-in duration-200 origin-left">{label}</span>}
    {active && !collapsed && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--accent)] rounded-r-full animate-in fade-in duration-300"></div>}
    {active && collapsed && <div className="absolute inset-0 rounded-lg border border-[var(--accent)] pointer-events-none"></div>}
  </button>
);

// --- TOOL DEFINITIONS ---
const createCourseTool: FunctionDeclaration = {
  name: 'create_course',
  description: 'Creates a new academic course/subject in the system.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'The name of the course (e.g. Calculus)' },
      credits: { type: Type.NUMBER, description: 'Number of credits (default 3)' },
      semester: { type: Type.NUMBER, description: 'Semester number (1-10)' }
    },
    required: ['name']
  }
};

const addGradeTool: FunctionDeclaration = {
  name: 'add_grade',
  description: 'Adds a grade to a specific course. Can add a main cut grade or a sub-activity grade.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      course_name: { type: Type.STRING, description: 'Name of the course to find (fuzzy match)' },
      cut_name: { type: Type.STRING, description: 'Name of the cut (e.g. "Corte 1", "Parcial", "Final")' },
      grade: { type: Type.NUMBER, description: 'The grade value (e.g. 4.5)' },
      activity_name: { type: Type.STRING, description: 'Name of the sub-activity (e.g. "Quiz 1", "Taller"). Optional. Use this for detailed grading.' },
      weight: { type: Type.NUMBER, description: 'Weight percentage (0-100). Optional.' }
    },
    required: ['course_name', 'cut_name', 'grade']
  }
};

interface Notification {
  id: number;
  type: 'alert' | 'info' | 'success';
  title: string;
  message: string;
}

const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
          const base64String = reader.result;
          const base64Data = base64String.split(',')[1];
          resolve({
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          });
      } else {
          reject(new Error("Failed to read file"));
      }
    };
    reader.readAsDataURL(file);
  });
};

// Default preferences object
const DEFAULT_PREFS = {
    nebulaIntensity: 0.25,
    glassStrength: 'high' as const,
    fontStyle: 'modern' as const,
    startTab: 'dashboard' as AppTab,
    reducedMotion: false,
    enableTexture: false,
    interfaceRoundness: 'modern' as const,
    sidebarPosition: 'left' as const,
    lowPowerMode: false
};

// Constants for Chat retention
const CHAT_RETENTION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Helper to safely get API key in component (Redundant but kept for safety)
const getClientApiKey = () => {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) return process.env.API_KEY;
    if (import.meta.env && import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    return "AIzaSyDz1XHDlFzscEe1935chxppQbXl_sm0LR8"; // Updated Fallback (Hydra Priority)
};

export default function App() {
  // --- STATE ---
  const [authState, setAuthState] = useState<AuthState>('LOGIN');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Data State
  const [user, setUser] = useState<User>({
      name:"", semester:1, theme:"light", maxGrade:5.0, minGrade:3.0, targetGrade:4.5, gradingMode:"simple", accentColor: "cortex",
      selectedModel: 'flash', unlockedModels: ['flash'], completedAchievements: ['init'],
      preferences: DEFAULT_PREFS
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState('');
  
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCourseSemester, setAddCourseSemester] = useState<number>(1);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  // AI Chat State & Connection Status
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{role: 'bot'|'user', text: string, image?: string, timestamp: number}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatImage, setChatImage] = useState<{ file: File, preview: string } | null>(null);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<'checking' | 'connected' | 'offline_mode'>('checking');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // --- CONNECTION CHECKER ---
  useEffect(() => {
      if (showAiPanel) {
          performConnectionCheck();
          // Haptic on AI Open
          triggerHaptic('light');
      }
  }, [showAiPanel]);

  const performConnectionCheck = async () => {
      setAiConnectionStatus('checking');
      const status = await checkAiConnection();
      setAiConnectionStatus(status === 'connected' ? 'connected' : 'offline_mode');
  };

  // --- CHAT HISTORY RETENTION & PERSISTENCE ---
  useEffect(() => {
      // Load from local storage
      const savedChat = localStorage.getItem('ctx_chat_history');
      let initialMessages: any[] = [];

      if (savedChat) {
          try {
              const parsed = JSON.parse(savedChat);
              // Filter messages older than 30 days
              const now = Date.now();
              initialMessages = parsed.filter((msg: any) => {
                  const msgTime = msg.timestamp || 0;
                  return (now - msgTime) < (CHAT_RETENTION_DAYS * MS_PER_DAY);
              });
          } catch (e) {
              console.error("Error parsing chat history", e);
          }
      }

      if (initialMessages.length === 0) {
          initialMessages = [{
              role: 'bot', 
              text: "Soy Cortex AI. Tu copiloto académico. Puedo ver imágenes y resolver ecuaciones matemáticas.", 
              timestamp: Date.now() 
          }];
      }

      setAiMessages(initialMessages);
  }, []);

  const handleClearHistory = () => {
      if (window.confirm("¿Estás seguro de querer borrar todo el historial de chat?")) {
          setAiMessages([{
              role: 'bot', 
              text: "Historial borrado. ¿En qué puedo ayudarte hoy?", 
              timestamp: Date.now() 
          }]);
          localStorage.removeItem('ctx_chat_history');
      }
  };

  const handleExportChat = () => {
      const historyText = aiMessages.map(msg => {
          const role = msg.role === 'user' ? 'Usuario' : 'Cortex AI';
          const time = new Date(msg.timestamp).toLocaleString();
          return `[${time}] ${role}:\n${msg.text}\n`;
      }).join('\n-------------------\n');
      
      const blob = new Blob([historyText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cortex_chat_${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Save chat on change
  useEffect(() => {
      if (aiMessages.length > 0) {
          localStorage.setItem('ctx_chat_history', JSON.stringify(aiMessages));
      }
  }, [aiMessages]);

  // --- VISUAL PREFERENCES EFFECT ---
  useEffect(() => {
    const prefs = user.preferences || DEFAULT_PREFS;
    const root = document.documentElement;

    // Apply Font - Updated to simply set variable
    root.style.setProperty('--font-family', prefs.fontStyle === 'technical' ? '"JetBrains Mono", monospace' : '"Inter", sans-serif');

    // Apply Blur/Glass Strength
    const blurVal = prefs.glassStrength === 'none' ? '0px' : prefs.glassStrength === 'low' ? '6px' : '12px';
    const opacityVal = prefs.glassStrength === 'none' ? '0.98' : prefs.glassStrength === 'low' ? '0.95' : '0.85';
    root.style.setProperty('--glass-blur', blurVal);
    root.style.setProperty('--glass-opacity', opacityVal);

    // Apply Roundness
    const radiusCard = prefs.interfaceRoundness === 'none' ? '0px' : prefs.interfaceRoundness === 'full' ? '2rem' : '1rem';
    const radiusInput = prefs.interfaceRoundness === 'none' ? '0px' : prefs.interfaceRoundness === 'full' ? '1rem' : '0.75rem';
    root.style.setProperty('--radius-card', radiusCard);
    root.style.setProperty('--radius-input', radiusInput);

    // --- APPLY LOW POWER MODE ---
    if (prefs.lowPowerMode) {
      document.body.classList.add('low-power');
    } else {
      document.body.classList.remove('low-power');
    }

  }, [user.preferences]);

  // --- AUTH & SYNC EFFECTS ---
  useEffect(() => {
    if (!auth) {
        const savedAuth = localStorage.getItem('ctx_auth') as AuthState;
        if (savedAuth === 'APP') loadLocalData();
        else setIsInitializing(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setIsInitializing(true);
        if (firebaseUser) {
            setIsGuest(false);
            await loadFirestoreData(firebaseUser.uid);
        } else {
            const guestMode = localStorage.getItem('ctx_is_guest');
            if (guestMode === 'true') {
                setIsGuest(true);
                loadLocalData();
            } else {
                setAuthState('LOGIN');
                setIsInitializing(false);
            }
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (isInitializing || authState === 'LOGIN') return;

      if (isGuest) {
          localStorage.setItem('ctx_user', JSON.stringify(user));
          localStorage.setItem('ctx_courses', JSON.stringify(courses));
          localStorage.setItem('ctx_tasks', JSON.stringify(tasks));
          localStorage.setItem('ctx_notes', notes);
          localStorage.setItem('ctx_auth', authState);
          localStorage.setItem('ctx_is_guest', 'true');
      } else if (auth?.currentUser) {
          const uid = auth.currentUser.uid;
          setDoc(doc(db, "users", uid), {
              userProfile: user,
              courses,
              tasks,
              notes,
              lastUpdated: new Date()
          }, { merge: true }).catch(err => console.error("Sync Error:", err));
      }
  }, [user, courses, tasks, notes, authState, isGuest, isInitializing]);

  useEffect(() => { 
    document.body.setAttribute('data-theme', user.theme || 'light'); 
    document.body.setAttribute('data-accent', user.accentColor || 'cortex'); 
  }, [user.theme, user.accentColor]);
  
  useEffect(() => { if(user.semester) setCurrentSemester(user.semester); }, [user.semester]);
  
  useEffect(() => {
      if(chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [aiMessages, isAiLoading]);

  // --- ACHIEVEMENTS CHECKER ---
  useEffect(() => {
      if (authState !== 'APP') return;

      let newCompleted = [...(user.completedAchievements || [])];
      let hasUpdates = false;
      let newUnlockedModels = [...(user.unlockedModels || ['flash'])];

      ACHIEVEMENTS.forEach(ach => {
          if (!newCompleted.includes(ach.id) && ach.condition(user, tasks, courses)) {
              newCompleted.push(ach.id);
              hasUpdates = true;
              
              // Notification for achievement
              setNotifications(prev => [{
                  id: Date.now(),
                  type: 'success',
                  title: '¡Logro Desbloqueado!',
                  message: `${ach.title}: ${ach.reward}`
              }, ...prev]);

              // Check for model unlock
              if (ach.id === 'pro_user' && !newUnlockedModels.includes('pro')) {
                  newUnlockedModels.push('pro');
                  setNotifications(prev => [{
                      id: Date.now() + 1,
                      type: 'info',
                      title: 'IA Mejorada',
                      message: '¡Has desbloqueado Gemini Pro!'
                  }, ...prev]);
              }
          }
      });

      if (hasUpdates) {
          setUser(prev => ({ ...prev, completedAchievements: newCompleted, unlockedModels: newUnlockedModels }));
      }

  }, [courses, tasks, user.university]);

  // --- HELPERS ---
  const loadLocalData = () => {
      const u = JSON.parse(localStorage.getItem('ctx_user') || '{}');
      // Merge with defaults to ensure preferences exist
      const mergedUser = { 
          name: "", 
          semester: 1,
          theme: "light",
          ...u, 
          preferences: { ...DEFAULT_PREFS, ...(u.preferences || {}) },
          unlockedModels: u.unlockedModels || ['flash'],
          completedAchievements: u.completedAchievements || ['init'],
          selectedModel: u.selectedModel || 'flash'
      };
      
      const c = JSON.parse(localStorage.getItem('ctx_courses') || '[]');
      const t = JSON.parse(localStorage.getItem('ctx_tasks') || '[]');
      const n = localStorage.getItem('ctx_notes') || '';
      
      setUser(mergedUser); setCourses(c); setTasks(t); setNotes(n);
      
      // Handle Start Tab preference
      if (mergedUser.preferences?.startTab) {
          setActiveTab(mergedUser.preferences.startTab);
      }

      if (c.length === 0 && (!u.name || u.name === "")) setAuthState('ONBOARDING');
      else setAuthState('APP');
      
      setIsInitializing(false);
  };

  const loadFirestoreData = async (uid: string) => {
      try {
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
              const data = docSnap.data();
              const mergedUser = {
                  name: "",
                  semester: 1,
                  ...data.userProfile,
                  preferences: { ...DEFAULT_PREFS, ...(data.userProfile.preferences || {}) },
                  unlockedModels: data.userProfile.unlockedModels || ['flash'],
                  selectedModel: data.userProfile.selectedModel || 'flash',
                  completedAchievements: data.userProfile.completedAchievements || ['init']
              };
              setUser(mergedUser);
              setCourses(data.courses || []);
              setTasks(data.tasks || []);
              setNotes(data.notes || '');
              
              if (mergedUser.preferences?.startTab) {
                  setActiveTab(mergedUser.preferences.startTab);
              }

              setAuthState('APP'); 
          } else {
              setAuthState('ONBOARDING');
              if (auth?.currentUser) {
                  setUser(prev => ({
                      ...prev,
                      name: auth.currentUser?.displayName || "Estudiante",
                      email: auth.currentUser?.email || "",
                      preferences: DEFAULT_PREFS
                  }));
              }
          }
      } catch (e) {
          console.error("Firestore Load Error:", e);
      } finally {
          setIsInitializing(false);
      }
  };

  useEffect(() => {
    const newNotifs: Notification[] = notifications.filter(n => n.type === 'success' || n.title === 'IA Mejorada'); // Keep success notifs for a while
    const pendingTasks = tasks.filter(t => !t.done);
    if (pendingTasks.length > 0) newNotifs.push({ id: 1, type: 'info', title: 'Cronos', message: `Tienes ${pendingTasks.length} tareas pendientes.` });
    const lowGrades = courses.filter(c => parseFloat(c.average) < user.minGrade && parseFloat(c.average) > 0);
    if (lowGrades.length > 0) newNotifs.push({ id: 2, type: 'alert', title: 'Alerta Académica', message: `${lowGrades.length} materias requieren atención inmediata.` });
    
    // De-dupe by ID roughly
    const uniqueNotifs = Array.from(new Map(newNotifs.map(item => [item.id, item])).values());
    setNotifications(uniqueNotifs);
  }, [tasks, courses, user.minGrade]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = (data: { name: string; email: string; isGuest?: boolean }) => { 
    if (data.isGuest) {
        setIsGuest(true);
        localStorage.setItem('ctx_is_guest', 'true');
        loadLocalData();
    }
  };
  
  const handleOnboarding = (data: Partial<User>, extraTasks?: Task[]) => { 
    setUser(prev => ({...prev, ...data, preferences: DEFAULT_PREFS})); 
    if(extraTasks && extraTasks.length > 0) setTasks(prev => [...prev, ...extraTasks]);
    setAuthState('APP'); 
    setShowTutorial(true); 
  };

  const handleLogout = async () => {
      triggerHaptic('medium');
      if (isGuest) {
          setIsGuest(false);
          localStorage.removeItem('ctx_is_guest');
          setAuthState('LOGIN');
      } else if (auth) {
          await signOut(auth);
      }
  };

  // --- NAVIGATION HANDLER ---
  const handleNavClick = (tab: AppTab) => {
    // Haptic Feedback on Navigation
    triggerHaptic('light');
    setActiveTab(tab);
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
    // Smooth scrolling to top when switching tabs
    if(mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const addCourse = (courseData: any) => {
    const newCourse: Course = { ...courseData, id: Date.now(), cuts: [], resources: [], average: '0.0', progress: 0, semester: courseData.semester || currentSemester, color: 'cortex' };
    setCourses(prev => [...prev, newCourse]);
  };

  const addGrade = (args: any) => {
      const { course_name, cut_name, grade, activity_name, weight } = args;
      let resultMsg = "";
      setCourses(prev => {
          const courseIndex = prev.findIndex(c => c.name.toLowerCase().includes(course_name.toLowerCase()));
          if (courseIndex === -1) { resultMsg = `No encontré la materia '${course_name}'.`; return prev; }
          const newCourses = [...prev];
          const course = { ...newCourses[courseIndex] };
          let cutIndex = course.cuts.findIndex(c => c.name.toLowerCase().includes(cut_name.toLowerCase()));
          if (cutIndex === -1) {
               course.cuts = [...course.cuts, { id: Date.now(), name: cut_name, weight: weight || 33.3, grade: '0.0', activities: [] }];
               cutIndex = course.cuts.length - 1;
          }
          const cut = { ...course.cuts[cutIndex] };
          if (activity_name) {
              cut.activities = [...(cut.activities || []), { id: Date.now(), name: activity_name, weight: weight || 20, grade: String(grade) }];
              resultMsg = `Agregada nota ${grade} a actividad '${activity_name}' en '${cut_name}' de '${course.name}'.`;
          } else {
              cut.grade = String(grade);
              resultMsg = `Agregada nota ${grade} a '${cut_name}' en '${course.name}'.`;
          }
          course.cuts[cutIndex] = cut;
          newCourses[courseIndex] = course;
          return newCourses;
      });
      return resultMsg;
  };

  const updateCourse = (updated: Course) => setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
  const deleteCourse = (id: number) => { setCourses(prev => prev.filter(c => c.id !== id)); setEditingCourse(null); };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          if (e.target.files.length > 1) {
              setNotifications(prev => [{id: Date.now(), type: 'alert', title: 'Error', message: 'Solo puedes enviar una imagen a la vez.'}, ...prev]);
              return;
          }
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              setChatImage({ file, preview: ev.target?.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    // Allow send if connected OR if offline mode is active
    if((!aiInput.trim() && !chatImage) || isAiLoading) return;
    
    triggerHaptic('light'); // Feedback on send

    // --- API KEY CHECK ---
    const apiKey = getClientApiKey();

    // In offline mode we proceed without a key check, or with a dummy one.
    if (!apiKey && aiConnectionStatus !== 'offline_mode') {
        setAiMessages(prev => [...prev, {role: 'bot', text: "❌ Error crítico: No se encuentra la API Key.", timestamp: Date.now()}]);
        return;
    }

    const userText = aiInput.trim();
    const currentImage = chatImage;
    
    setAiMessages(prev => [...prev, {role: 'user', text: userText, image: currentImage?.preview, timestamp: Date.now()}]);
    setAiInput("");
    setChatImage(null);
    setIsAiLoading(true);

    try {
        const responseText = await generateText(userText, undefined, user.selectedModel);
        setAiMessages(prev => [...prev, {role: 'bot', text: responseText, timestamp: Date.now()}]);
        triggerHaptic('medium'); // Feedback on response received
    } catch (error) {
        console.error("AI Error:", error);
        setAiMessages(prev => [...prev, {role: 'bot', text: "Error de conexión.", timestamp: Date.now()}]);
        triggerHaptic('heavy'); // Feedback on error
    }
    setIsAiLoading(false);
  };

  const handleImportData = (data: any) => { setUser(data.user); setCourses(data.courses); setTasks(data.tasks); };
  const handleExportData = () => { /* Export logic handled in Settings */ };
  const handleOpenAddModal = (isOpen: boolean, semester?: number) => { if(semester) setAddCourseSemester(semester); else setAddCourseSemester(currentSemester); setShowAddModal(isOpen); };
  
  const currentSemesterCourses = courses.filter(c => c.semester === currentSemester);
  const globalAvg = currentSemesterCourses.length > 0 ? (currentSemesterCourses.reduce((acc, c) => acc + (parseFloat(c.average)||0), 0) / currentSemesterCourses.length).toFixed(2) : "0.0";

  // --- RENDER ---
  if (isInitializing) return <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-main)] text-[var(--accent)]"><Loader size={48} className="animate-spin" /></div>;
  if (authState === 'LOGIN') return <AuthScreen onLogin={handleLogin} />;
  if (authState === 'ONBOARDING') return <OnboardingWizard onComplete={handleOnboarding} />;

  const currentPrefs = user.preferences || DEFAULT_PREFS;
  const sidebarPos = currentPrefs.sidebarPosition || 'left';

  return (
    <div className={`h-screen w-full flex bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden font-sans selection:bg-[var(--accent)] selection:text-white relative ${sidebarPos === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      {currentPrefs.enableTexture && <div className="bg-noise"></div>}
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
            className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-[var(--accent)] rounded-full blur-[90px] opacity-[0.25] anim-nebula-1 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000" 
            style={{ opacity: currentPrefs.nebulaIntensity, '--target-opacity': currentPrefs.nebulaIntensity } as any}
        />
        <div 
            className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[var(--royal)] rounded-full blur-[100px] opacity-[0.25] anim-nebula-2 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000"
            style={{ opacity: currentPrefs.nebulaIntensity, '--target-opacity': currentPrefs.nebulaIntensity } as any}
        />
        <div 
            className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] bg-[var(--danger)] rounded-full blur-[120px] opacity-[0.2] anim-nebula-3 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000"
            style={{ opacity: currentPrefs.nebulaIntensity * 0.8, '--target-opacity': currentPrefs.nebulaIntensity * 0.8 } as any}
        />
      </div>

      {/* SIDEBAR NAVIGATION - HIDDEN ON MOBILE */}
      <aside 
        className={`hidden md:flex fixed inset-y-0 ${sidebarPos === 'left' ? 'left-0 border-r' : 'right-0 border-l'} z-50 bg-[var(--bg-sidebar)] border-[var(--border-color)] flex-col p-4 backdrop-blur-md transform transition-all duration-300 ease-in-out md:relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center mb-8 px-2 h-10 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-lg shrink-0"><Brain size={18} /></div>
                {!isSidebarCollapsed && <span className="font-bold text-xl tracking-tight text-[var(--text-primary)] animate-in fade-in duration-200">Cortex Labs</span>}
            </div>
            
            {/* Collapse Toggle Button (Desktop Only) */}
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                className="hidden md:flex p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition-colors"
                title={isSidebarCollapsed ? "Expandir Menú" : "Colapsar Menú"}
            >
                {isSidebarCollapsed ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>}
            </button>
        </div>
        
        <nav className="flex-1 space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleNavClick('dashboard')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={ListTodo} label="Cronos" active={activeTab === 'cronos'} onClick={() => handleNavClick('cronos')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={Target} label="El Oráculo" active={activeTab === 'oracle'} onClick={() => handleNavClick('oracle')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={Network} label="Nexus" active={activeTab === 'nexus'} onClick={() => handleNavClick('nexus')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={FileText} label="Materias" active={activeTab === 'courses'} onClick={() => handleNavClick('courses')} collapsed={isSidebarCollapsed} />
            
            <div className={`pt-4 mt-4 border-t border-[var(--border-color)]`}>
              <SidebarItem icon={Settings} label="Configuración" active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} collapsed={isSidebarCollapsed} />
              <SidebarItem icon={HelpCircle} label="Ayuda / Tutorial" active={false} onClick={() => { setShowTutorial(true); if(window.innerWidth < 768) setIsSidebarOpen(false); }} collapsed={isSidebarCollapsed} />
            </div>
        </nav>
        
        <div className="mt-auto">
            {isGuest && !isSidebarCollapsed && <div className="mb-4 p-3 bg-[var(--bg-input)] rounded-lg text-xs text-center text-[var(--text-secondary)]">Modo Invitado (Sin Sync)</div>}
            
            <button 
                onClick={() => setShowAiPanel(!showAiPanel)} 
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all mb-2 font-medium ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? "Cortex AI" : undefined}
            >
                <Sparkles size={18} />
                {!isSidebarCollapsed && <span>Cortex AI</span>}
            </button>
            
            <button 
                onClick={handleLogout} 
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/5 transition-all font-medium ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? "Cerrar Sesión" : undefined}
            >
                <LogOut size={18}/>
                {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileNavBar 
        activeTab={activeTab} 
        onTabChange={handleNavClick} 
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      {/* MOBILE SIDEBAR (Drawer) */}
      {isSidebarOpen && (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-[var(--bg-card)] border-r border-[var(--border-color)] z-[60] p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-xl text-[var(--text-primary)]">Cortex Labs</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-[var(--bg-input)]"><X size={20}/></button>
                </div>
                <nav className="flex-1 space-y-2">
                    <SidebarItem icon={Settings} label="Configuración" active={activeTab === 'settings'} onClick={() => { handleNavClick('settings'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={Target} label="El Oráculo" active={activeTab === 'oracle'} onClick={() => { handleNavClick('oracle'); setIsSidebarOpen(false); }} />
                    <SidebarItem icon={HelpCircle} label="Ayuda / Tutorial" active={false} onClick={() => { setShowTutorial(true); setIsSidebarOpen(false); }} />
                </nav>
                <button onClick={handleLogout} className="mt-auto w-full py-3 bg-[var(--bg-input)] rounded-xl font-bold text-sm text-[var(--danger)]">Cerrar Sesión</button>
            </div>
        </>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden z-10 transition-colors duration-300 min-w-0 pb-[safe-area-inset-bottom+60px] md:pb-0">
         <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 z-20 sticky top-0 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-color)]">
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Menu Trigger removed here (moved to bottom nav) */}
                <div className="flex items-center gap-3 bg-[var(--bg-input)] px-4 py-2 md:py-2.5 rounded-full w-full max-w-sm border border-transparent focus-within:border-[var(--accent)] transition-colors shadow-sm">
                    <Search size={18} className="text-[var(--text-secondary)]" />
                    <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] w-full placeholder:text-[var(--text-secondary)]" />
                </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6 relative">
                <div ref={notifPanelRef} className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className={`relative text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-2 rounded-full hover:bg-[var(--bg-input)] ${showNotifications ? 'bg-[var(--bg-input)] text-[var(--accent)]' : ''}`}><Bell size={20} />{notifications.some(n => n.type !== 'success') && <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--danger)] rounded-full animate-pulse"></span>}</button>
                  {showNotifications && <div className="absolute right-0 mt-3 w-80 card-modern z-50 overflow-hidden shadow-2xl anim-enter origin-top-right border border-[var(--border-color)]"><div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-input)]/50"><h4 className="font-bold text-[var(--text-primary)] text-sm">Notificaciones</h4><span className="text-[10px] bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">{notifications.length}</span></div><div className="max-h-[300px] overflow-y-auto">{notifications.map(notif => (<div key={notif.id} className="p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-input)] transition-colors flex gap-3 last:border-0"><div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'alert' ? 'bg-[var(--danger)]' : notif.type === 'info' ? 'bg-[var(--accent)]' : 'bg-[var(--success)]'}`}></div><div><p className="text-xs font-bold text-[var(--text-primary)] mb-1">{notif.title}</p><p className="text-xs text-[var(--text-secondary)] leading-relaxed">{notif.message}</p></div></div>))}</div></div>}
                </div>
                {/* AI Trigger Mobile */}
                <button onClick={() => setShowAiPanel(true)} className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"><Sparkles size={20}/></button>

                <div onClick={() => handleNavClick('settings')} className="flex items-center gap-3 md:pl-6 md:border-l border-[var(--border-color)] cursor-pointer group hover:opacity-80 transition-opacity">
                    <div className="text-right hidden md:block"><p className="text-sm font-bold text-[var(--text-primary)] leading-none group-hover:text-[var(--accent)] transition-colors">{user.name}</p><p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">ESTUDIANTE</p></div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] font-bold text-sm bg-[var(--bg-card)] shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 overflow-hidden">
                        {user.logoUrl ? (
                            <img 
                                src={user.logoUrl} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                    // Fallback to UI Avatars if Google Favicon fails
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&size=128`;
                                }}
                            />
                        ) : (
                            (user.name || "U").substring(0,2).toUpperCase()
                        )}
                    </div>
                </div>
            </div>
        </header>

        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth">
            {activeTab === 'dashboard' && <DashboardModule courses={currentSemesterCourses} tasks={tasks} notes={notes} setNotes={setNotes} setShowAddModal={handleOpenAddModal} setEditingCourse={setEditingCourse} userMinGrade={user.minGrade} globalAvg={globalAvg} userName={user.name} semester={currentSemester} accent={user.accentColor} targetGrade={user.targetGrade} />}
            {activeTab === 'courses' && <CoursesModule allCourses={courses} currentSemester={currentSemester} setShowAddModal={handleOpenAddModal} setEditingCourse={setEditingCourse} userMinGrade={user.minGrade} />}
            {activeTab === 'cronos' && <CronosModule tasks={tasks} setTasks={setTasks} />}
            {activeTab === 'oracle' && <OracleModule courses={courses} gradingSystem={{max: user.maxGrade, min: user.minGrade}} userModel={user.selectedModel} />}
            {activeTab === 'nexus' && <NexusModule user={user} />}
            {activeTab === 'settings' && <SettingsModule user={user} setUser={setUser} onImport={handleImportData} exportData={handleExportData} onAddTasks={(newTasks) => setTasks(prev => [...prev, ...newTasks])} />}
        </div>
      </main>

      {/* AI PANEL & MODALS */}
      {/* 
          MOBILE TRANSITION: Translate-Y from Bottom
          DESKTOP TRANSITION: Translate-X from Right
      */}
      <div 
        className={`fixed inset-0 md:inset-y-0 md:right-0 md:left-auto z-[60] w-full md:w-[400px] bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col backdrop-blur-xl 
        ${showAiPanel ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0'}`}
      >
            
            {/* AI HEADER WITH STATUS */}
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-input)]/50">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-white shadow-lg transition-colors ${aiConnectionStatus === 'connected' ? 'bg-[var(--accent)]' : aiConnectionStatus === 'offline_mode' ? 'bg-[var(--danger)]' : 'bg-gray-400'}`}>
                        <Bot size={24}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg">Cortex AI</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {aiConnectionStatus === 'checking' && (
                                <>
                                    <Loader size={10} className="animate-spin text-[var(--text-secondary)]"/>
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Iniciando Enlace...</span>
                                </>
                            )}
                            {aiConnectionStatus === 'connected' && (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse shadow-[0_0_5px_var(--success)]"></div>
                                    <span className="text-[10px] font-bold text-[var(--success)] uppercase tracking-wide">Sistemas Online</span>
                                </>
                            )}
                            {aiConnectionStatus === 'offline_mode' && (
                                <>
                                    <ShieldAlert size={10} className="text-[var(--danger)]"/>
                                    <span className="text-[10px] font-bold text-[var(--danger)] uppercase tracking-wide">Modo Simulado (Offline)</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* Retry Button if Error/Offline */}
                    {aiConnectionStatus === 'offline_mode' && (
                        <button 
                            onClick={performConnectionCheck} 
                            className="p-2 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                            title="Reintentar Conexión"
                        >
                            <RefreshCw size={18}/>
                        </button>
                    )}
                    <button 
                        onClick={handleExportChat} 
                        className="p-2 rounded-full hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Descargar Historial"
                    >
                        <Download size={18}/>
                    </button>
                    <button 
                        onClick={handleClearHistory} 
                        className="p-2 rounded-full hover:bg-[var(--danger)]/10 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"
                        title="Borrar Historial"
                    >
                        <Trash2 size={18}/>
                    </button>
                    <button onClick={() => setShowAiPanel(false)} className="p-2 rounded-full hover:bg-[var(--bg-input)] text-[var(--text-secondary)] transition-colors"><X size={20}/></button>
                </div>
            </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent" ref={chatScrollRef}>
            {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-3'} anim-enter`} style={{animationDelay: `${i*0.05}s`}}>
                    {msg.role === 'bot' && (
                        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--royal)] flex items-center justify-center text-white shadow-lg shrink-0 mb-1">
                            <Sparkles size={16} />
                        </div>
                    )}
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col gap-2 overflow-hidden ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-tr-sm' : 'bg-[var(--bg-input)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-color)]'}`}>
                        {msg.role === 'bot' && (
                            <div className="flex items-center gap-1.5 mb-1 pb-2 border-b border-[var(--border-color)]/50 select-none">
                                <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Cortex AI</span>
                                <BadgeCheck size={14} className="text-[var(--accent)]" strokeWidth={2.5} />
                            </div>
                        )}
                        {msg.image && (
                            <img src={msg.image} alt="User upload" className="rounded-lg max-h-40 object-cover border border-white/20" />
                        )}
                        <div className="markdown-content">
                            <ReactMarkdown 
                                remarkPlugins={[remarkMath, remarkGfm]} 
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                    a: ({node, ...props}) => <a className="underline font-bold hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                    code: ({node, inline, className, children, ...props}: any) => {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline ? (
                                            <div className="relative my-3 rounded-lg overflow-hidden bg-black/10 dark:bg-black/30 border border-black/5 dark:border-white/10">
                                                <div className="bg-black/5 dark:bg-white/5 px-3 py-1 text-[10px] uppercase font-bold tracking-wider opacity-50 flex justify-between">
                                                    <span>{match?.[1] || 'Code'}</span>
                                                </div>
                                                <pre className="p-3 overflow-x-auto text-xs font-mono scrollbar-thin">
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            </div>
                                        ) : (
                                            <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs mx-0.5" {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-[var(--accent)] pl-3 italic opacity-80 my-2" {...props} />,
                                }}
                            >
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            ))}
            {isAiLoading && <div className="flex justify-start"><div className="bg-[var(--bg-input)] p-4 rounded-2xl rounded-tl-sm flex gap-1.5"><div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce delay-150"></div></div></div>}
        </div>
        
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
            {chatImage && (
                <div className="mb-2 p-2 bg-[var(--bg-input)] rounded-xl flex items-center justify-between border border-[var(--accent)] animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                        <img src={chatImage.preview} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                        <span className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]">{chatImage.file.name}</span>
                    </div>
                    <button onClick={() => setChatImage(null)} className="p-1 hover:bg-[var(--danger)]/10 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-lg"><X size={16}/></button>
                </div>
            )}
            <form onSubmit={handleAiSend} className="relative flex items-end gap-2">
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple={false} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-[var(--bg-input)] hover:bg-[var(--bg-input)]/80 text-[var(--text-secondary)] hover:text-[var(--accent)] rounded-2xl transition-all border border-[var(--border-color)] flex-shrink-0">
                    <ImageIcon size={20} />
                </button>
                <input 
                    type="text" 
                    placeholder={aiConnectionStatus === 'checking' ? "Iniciando enlace..." : aiConnectionStatus === 'offline_mode' ? "Modo Simulado (Escribe algo...)" : chatImage ? "Añade un comentario..." : "Pregunta o sube una imagen..."} 
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-all input-glass disabled:opacity-50 disabled:cursor-not-allowed" 
                    value={aiInput} 
                    onChange={(e) => setAiInput(e.target.value)} 
                    disabled={isAiLoading || aiConnectionStatus === 'checking'}
                />
                <button type="submit" disabled={isAiLoading || (!aiInput.trim() && !chatImage) || aiConnectionStatus === 'checking'} className="absolute right-2 bottom-2 p-1.5 bg-[var(--accent)] hover:brightness-110 text-white rounded-xl transition-all shadow-md disabled:opacity-50">
                    <Send size={18} />
                </button>
            </form>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm anim-enter" onClick={() => setShowAddModal(false)}>
            <div className="w-full max-w-md card-modern p-8 relative overflow-hidden bg-[var(--bg-card)] shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-2xl text-[var(--text-primary)] mb-6">Nueva Materia</h3>
                
                {/* SEMESTER SELECTOR GRID */}
                <div className="mb-4">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Semestre</label>
                    <div className="grid grid-cols-6 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setAddCourseSemester(s)}
                                className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                                    addCourseSemester === s 
                                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' 
                                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={(e) => {e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); addCourse({ name: formData.get('name'), code: formData.get('code'), credits: formData.get('credits'), professor: formData.get('professor'), modality: formData.get('modality'), location: formData.get('location'), semester: addCourseSemester }); setShowAddModal(false);}} className="space-y-5">
                    <input name="name" className="w-full input-glass" placeholder="Nombre (ej: Cálculo)" required autoFocus />
                    <div className="grid grid-cols-2 gap-4"><input name="code" className="w-full input-glass" placeholder="Código" /><input name="credits" type="number" className="w-full input-glass" placeholder="Créditos" required /></div>
                    <div className="grid grid-cols-2 gap-4"><select name="modality" className="w-full input-glass"><option value="presencial">Presencial</option><option value="virtual">Virtual</option></select><input name="location" className="w-full input-glass" placeholder="Lugar / Link" /></div>
                    <input name="professor" className="w-full input-glass" placeholder="Profesor" />
                    <button className="w-full btn-primary py-4 rounded-xl text-lg shadow-lg">Crear Materia</button>
                </form>
            </div>
        </div>
      )}
      
      {editingCourse && (
        <CourseManagerModal 
            course={editingCourse} 
            onClose={() => setEditingCourse(null)} 
            onUpdate={updateCourse} 
            onDelete={deleteCourse} 
            gradingSystem={{max: user.maxGrade, min: user.minGrade}} 
            gradingMode={user.gradingMode || 'simple'}
        />
      )}
      
      {showTutorial && (
          <TutorialModal onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
