'use client'; 

import React, { useState, useEffect, useMemo, FC, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { TypeAnimation } from 'react-type-animation';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Home, BookOpen, BarChart2, User, Settings, Bookmark, Search, Moon, Sun, PlusCircle, Edit2, Trash2, ChevronLeft, ChevronRight, UploadCloud, Smile, LogOut, Layers, Info } from 'lucide-react';
import 'katex/dist/katex.min.css';
import 'react-circular-progressbar/dist/styles.css';

// --- TYPE DEFINITIONS ---
type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'practice' | 'exam';
type Page = 'auth' | 'dashboard' | 'quiz-setup' | 'taking-quiz' | 'quiz-results' | 'leaderboard' | 'bookmarks' | 'admin-questions' | 'admin-motivation' | 'admin-users' | 'playground' | 'about';
type SubscriptionStatus = 'FREE' | 'ACTIVE' | 'EXPIRED';
type MotivationType = 'QUOTE' | 'IMAGE';

interface Question {
  id: number;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  imageUrl?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  stats: {
    totalAttempted: number;
    totalCorrect: number;
    currentStreak: number;
  };
  history: Array<{ id: number; date: string; score: number; total: number; mode: Mode }>;
}

interface Motivation {
  id: number;
  type: MotivationType;
  content: string;
  author?: string;
}

// --- MOCK DATA (Initial State) ---
const initialQuestions: Question[] = [
    { id: 1, topic: 'Mechanics', subtopic: 'Kinematics', difficulty: 'easy', questionText: 'The first equation of motion is $$v = u + at$$. What does it represent?', options: ['Final velocity after time $t$', 'Displacement $s$', 'Final velocity squared', 'Constant acceleration'], correctAnswerIndex: 0, explanation: 'This equation relates final velocity $v$ to initial velocity $u$, acceleration $a$, and time $t$.' },
    { id: 2, topic: 'Mechanics', subtopic: 'Dynamics', difficulty: 'medium', questionText: "Newton's second law is $F = ma$. If mass is 2 kg and acceleration is 5 m/s², what is the force?", options: ['10 N', '7 N', '2.5 N', '0 N'], correctAnswerIndex: 0, explanation: 'Force $F = 2 \\text{ kg} \\times 5 \\text{ m/s}^2 = 10$ Newtons.' },
    { id: 3, topic: 'Electromagnetism', subtopic: 'Circuits', difficulty: 'easy', questionText: 'Ohm\'s law is $V = IR$. For R = 10 Ω and I = 2 A, what is V?', options: ['20 V', '5 V', '12 V', '8 V'], correctAnswerIndex: 0, explanation: 'Voltage $V = 10 \\Omega \\times 2 \\text{ A} = 20$ Volts.' }
];

const initialMotivationItems: Motivation[] = [
    { id: 1, type: 'QUOTE', content: 'The important thing is not to stop questioning. Curiosity has its own reason for existing.', author: 'Albert Einstein' },
    { id: 2, type: 'QUOTE', content: 'Physics is the law of the world, and we are all its subjects.', author: 'Anonymous' },
    { id: 3, type: 'IMAGE', content: 'https://images.unsplash.com/photo-1614726365952-780c14c35b0b?q=80&w=2070&auto=format&fit=crop' }
];

const initialUsers: Omit<User, 'history' | 'stats'>[] = [
    { id: 101, name: 'Alice', email: 'alice@example.com', role: 'USER', subscriptionStatus: 'ACTIVE', subscriptionEndDate: '2024-12-31' },
    { id: 102, name: 'Bob', email: 'bob@example.com', role: 'USER', subscriptionStatus: 'FREE', subscriptionEndDate: null },
    { id: 103, name: 'Charlie', email: 'charlie@example.com', role: 'USER', subscriptionStatus: 'EXPIRED', subscriptionEndDate: '2024-01-15' },
];

const topicsData = { 'Mechanics': ['Kinematics', 'Dynamics'], 'Electromagnetism': ['Circuits', 'Fields'] };

// --- MAIN APP COMPONENT ---
const PhysicsPlatform = () => {
    // --- STATE MANAGEMENT ---
    const [page, setPage] = useState<Page>('auth');
    const [user, setUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<Omit<User, 'history' | 'stats'>[]>(initialUsers); 
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [motivationItems, setMotivationItems] = useState<Motivation[]>(initialMotivationItems);
    const [bookmarked, setBookmarked] = useState<number[]>([]);
    const [currentQuiz, setCurrentQuiz] = useState<any | null>(null);
    const [theme, setTheme] = useState('light');
    const [isClient, setIsClient] = useState(false); // For Hydration fix

    // --- HOOKS ---
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                setTheme(savedTheme);
                document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            }
        }
    }, [isClient]);

    // --- FUNCTIONS ---
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        toast.success(`Switched to ${newTheme} mode!`);
    };

    const fireConfetti = () => {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    };

    const handleLogin = (email: string) => {
        const role: 'USER' | 'ADMIN' = email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
        const newUser: User = {
            id: Date.now(),
            name: role === 'ADMIN' ? 'Admin User' : 'Demo Student',
            email,
            role,
            subscriptionStatus: 'ACTIVE',
            subscriptionEndDate: '2024-12-31',
            stats: { totalAttempted: 50, totalCorrect: 35, currentStreak: 5 },
            history: []
        };
        setUser(newUser);
        setPage('dashboard');
        toast.success(`Welcome, ${newUser.name}!`);
    };

    const handleLogout = () => {
        setUser(null);
        setPage('auth');
        toast('You have been logged out.', { icon: '👋' });
    };

    const startQuiz = (config: any) => {
        const selectedQuestions = initialQuestions.slice(0, config.numQuestions);
        setCurrentQuiz({
            questions: selectedQuestions,
            answers: [],
            currentIndex: 0,
            startTime: Date.now(),
            mode: config.mode,
        });
        setPage('taking-quiz');
    };

    const addQuestion = (question: Omit<Question, 'id'>) => {
        setQuestions(prev => [...prev, { ...question, id: Date.now() }]);
        toast.success('Question added successfully!');
    };

    const deleteQuestion = (id: number) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
        toast.error('Question deleted!');
    };
    
    const updateUserSubscription = (userId: number, status: SubscriptionStatus, date: string | null) => {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: status, subscriptionEndDate: date } : u));
        toast.success(`Updated subscription for user ${userId}`);
    };

    const handleJsonImport = (jsonString: string) => {
        try {
            const newQuestions = JSON.parse(jsonString);
            if (Array.isArray(newQuestions)) {
                setQuestions(prev => [...prev, ...newQuestions]);
                toast.success(`${newQuestions.length} questions imported successfully!`);
            } else {
                throw new Error("JSON is not an array.");
            }
        } catch (error) {
            toast.error("Invalid JSON format. Please check the file.");
        }
    };

    const renderPage = () => {
        if (!user) return <AuthView onLogin={handleLogin} />;
        
        switch (page) {
            case 'dashboard': return <DashboardView user={user} motivationItems={motivationItems} />;
            case 'quiz-setup': return <QuizSetupView startQuiz={startQuiz} />;
            case 'taking-quiz':
                if (!currentQuiz) { setPage('quiz-setup'); return null; }
                return <TakingQuizView quiz={currentQuiz} setQuiz={setCurrentQuiz} onComplete={fireConfetti} setPage={setPage} />;
            case 'admin-questions': return <AdminQuestionsView questions={questions} deleteQuestion={deleteQuestion} addQuestion={addQuestion} handleJsonImport={handleJsonImport} />;
            case 'admin-users': return <AdminUsersView users={allUsers} updateUserSubscription={updateUserSubscription} />;
            case 'playground': return <div>Playground Page Placeholder</div>;
            case 'about': return <AboutUsView />;
            default: setPage('dashboard'); return null;
        }
    };

    if (!isClient) {
        return null; // Render nothing on the server to prevent hydration errors
    }

    if (!user) {
        return <AuthView onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex text-slate-800 dark:text-slate-200">
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar activePage={page} setPage={setPage} userRole={user.role} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col">
                <Header user={user} theme={theme} toggleTheme={toggleTheme} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderPage()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS (for organization) ---
// All sub-components like Sidebar, Header, AuthView, etc. go here.

const Sidebar: FC<{ activePage: Page, setPage: (page: Page) => void, userRole: 'USER' | 'ADMIN', onLogout: () => void }> = ({ activePage, setPage, userRole, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'quiz-setup', label: 'Start Quiz', icon: BookOpen },
        { id: 'leaderboard', label: 'Leaderboard', icon: BarChart2 },
        { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
        { id: 'playground', label: 'Playground', icon: Layers },
        { id: 'about', label: 'About Us', icon: Info },
    ];
    const adminNavItems = [
        { id: 'admin-questions', label: 'Questions', icon: Edit2 },
        { id: 'admin-motivation', label: 'Motivation', icon: Smile },
        { id: 'admin-users', label: 'Users', icon: User },
    ];
    
    return (
        <aside className="w-64 bg-white dark:bg-slate-800 h-screen sticky top-0 p-4 flex flex-col border-r border-slate-200 dark:border-slate-700">
            <h1 className="text-2xl font-bold px-2 mb-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">PhysicsPlatform</h1>
            <nav className="flex-1 space-y-2">
                <p className="px-2 text-xs font-semibold text-slate-400 uppercase">Menu</p>
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setPage(item.id as Page)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activePage === item.id ? 'bg-blue-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
                {userRole === 'ADMIN' && (
                    <div className="pt-4">
                        <p className="px-2 text-xs font-semibold text-slate-400 uppercase">Admin</p>
                        {adminNavItems.map(item => (
                            <button key={item.id} onClick={() => setPage(item.id as Page)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activePage === item.id ? 'bg-purple-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                <item.icon size={18} /> {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </nav>
            <div className="mt-auto">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/50 text-red-500">
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );
};

const Header: FC<{ user: User, theme: string, toggleTheme: () => void }> = ({ user, theme, toggleTheme }) => (
    <header className="h-16 flex items-center justify-end px-8 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="text-right">
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
            </div>
        </div>
    </header>
);

const AuthView: FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b3e] via-[#1d114a] to-[#3d2c8d] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl min-h-[600px] bg-[#12082e] rounded-3xl shadow-2xl flex overflow-hidden"
            >
                <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center text-white">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center mb-8">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <p className="text-slate-400 mb-8">{isSignUp ? 'Join us to start your physics journey.' : 'Enter your credentials to access your dashboard.'}</p>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 pl-12 bg-[#2a1a5e] border border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none transition" />
                        </div>
                        <div className="relative">
                            <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 pl-12 bg-[#2a1a5e] border border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none transition" />
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onLogin(email)} className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 mt-8 rounded-xl font-semibold text-lg transition-transform">{isSignUp ? 'Sign Up' : 'Login'}</motion.button>
                    <p className="text-center text-slate-400 text-sm mt-6">
                        {isSignUp ? 'Already have an account?' : "Not a member?"}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-pink-400 hover:underline ml-1">{isSignUp ? 'Sign in' : 'Sign up now'}</button>
                    </p>
                </div>
                <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-[#2a1a5e] to-[#12082e] flex-col items-center justify-center p-12 text-white">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-5"></div>
                    <motion.div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-violet-600 via-pink-500 to-red-500 rounded-full blur-3xl opacity-30 animate-pulse" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}></motion.div>
                    <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="text-6xl font-bold z-10">Welcome.</motion.h1>
                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="text-slate-300 mt-4 max-w-sm text-center z-10">Unlock your potential in physics. Interactive quizzes, simulations, and AI-powered feedback await you.</motion.p>
                </div>
            </motion.div>
        </div>
    );
};

const AboutUsView: FC<{}> = () => (
  <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">About PhysicsPulse</h1>
    <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mt-6">Welcome to PhysicsPulse, your ultimate destination for mastering A/L Physics in Sri Lanka. Our mission is to make learning physics intuitive, engaging, and accessible for every student.</p>
    <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mt-4">This platform was built with passion by a dedicated developer, hoping to inspire the next generation of scientists and engineers in Sri Lanka.</p>
  </div>
);

// All other sub-components like DashboardView, QuizSetupView etc. go here. The ones below are complete.

const DashboardView: FC<{ user: User, motivationItems: Motivation[] }> = ({ user, motivationItems }) => {
    const randomMotivation = useMemo(() => motivationItems[Math.floor(Math.random() * motivationItems.length)], [motivationItems]);
    const accuracy = user.stats.totalAttempted > 0 ? Math.round((user.stats.totalCorrect / user.stats.totalAttempted) * 100) : 0;
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard value={accuracy} label="Accuracy %" color="#3b82f6" />
                <StatCard value={user.stats.currentStreak} label="Day Streak" color="#8b5cf6" />
                <StatCard value={user.stats.totalAttempted} label="Attempted" color="#10b981" />
                <StatCard value={user.stats.totalCorrect} label="Correct" color="#f97316" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-bold mb-4">Performance History</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-bold mb-4">Motivation Hub</h3>
                    {randomMotivation.type === 'QUOTE' ? (
                        <div>
                            <p className="italic">"{randomMotivation.content}"</p>
                            <p className="text-right font-semibold mt-2">- {randomMotivation.author}</p>
                        </div>
                    ) : (
                        <img src={randomMotivation.content} alt="Motivation" className="rounded-md" />
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: FC<{ value: number, label: string, color: string }> = ({ value, label, color }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div style={{ width: 60, height: 60 }}>
            <CircularProgressbar value={label.includes('%') ? value : 100} text={`${value}`} styles={buildStyles({ pathColor: color, textColor: color, trailColor: 'rgba(0,0,0,0.1)' })} />
        </div>
        <div>
            <p className="font-bold text-xl">{label}</p>
        </div>
    </div>
);

const QuizSetupView: FC<{ startQuiz: (config: any) => void }> = ({ startQuiz }) => {
  return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Setup Your Quiz</h2>
          <p className="mb-4">Configure your practice session.</p>
          <button onClick={() => startQuiz({ numQuestions: 3, mode: 'practice' })} className="bg-blue-500 text-white py-2 px-4 rounded-md">Start Practice Quiz</button>
      </div>
  );
};

const TakingQuizView: FC<{ quiz: any, setQuiz: any, onComplete: () => void, setPage: (page: Page) => void }> = ({ quiz, setQuiz, onComplete, setPage }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const currentQuestion = quiz.questions[quiz.currentIndex];

    const handleAnswer = (index: number) => {
        if (showFeedback) return;
        setSelectedOption(index);
        setShowFeedback(true);
        if (index === currentQuestion.correctAnswerIndex) {
            toast.success("Correct!");
        } else {
            toast.error("Incorrect!");
        }
    };
    
    const handleNext = () => {
        if(quiz.currentIndex < quiz.questions.length - 1) {
            setQuiz({...quiz, currentIndex: quiz.currentIndex + 1});
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            if(true) onComplete(); 
            setPage('dashboard'); 
        }
    };

    return <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-4"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{currentQuestion.questionText}</ReactMarkdown></h2>
        <div className="space-y-3">
            {currentQuestion.options.map((opt: string, index: number) => (
                <button key={index} onClick={() => handleAnswer(index)} className={`w-full p-4 text-left border-2 rounded-md transition-colors ${selectedOption === index ? (index === currentQuestion.correctAnswerIndex ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20') : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown>
                </button>
            ))}
        </div>
        {showFeedback && (
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-md">
                <h3 className="font-bold text-lg mb-2">Explanation</h3>
                <TypeAnimation sequence={[currentQuestion.explanation]} wrapper="div" speed={60} />
            </motion.div>
        )}
        <button onClick={handleNext} disabled={!showFeedback} className="mt-6 bg-blue-500 text-white py-2 px-6 rounded-md disabled:opacity-50">Next</button>
    </div>;
};

const AdminQuestionsView: FC<{ questions: Question[], deleteQuestion: (id: number) => void, addQuestion: (q: any) => void, handleJsonImport: (json: string) => void }> = ({ questions, deleteQuestion, addQuestion, handleJsonImport }) => {
    const [jsonInput, setJsonInput] = useState('');
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-4">Import Questions</h3>
                <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder="Paste JSON array of questions here..." className="w-full h-32 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"></textarea>
                <button onClick={() => handleJsonImport(jsonInput)} className="mt-2 bg-green-500 text-white py-2 px-4 rounded-md">Import</button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-4">Manage Questions ({questions.length})</h3>
                {questions.map(q => (
                    <div key={q.id} className="flex justify-between items-center p-2 border-b dark:border-slate-700">
                        <p className="truncate w-3/4">{q.questionText}</p>
                        <div>
                            <button className="p-2 hover:text-blue-500"><Edit2 size={16} /></button>
                            <button onClick={() => deleteQuestion(q.id)} className="p-2 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminUsersView: FC<{ users: any[], updateUserSubscription: any }> = ({ users, updateUserSubscription }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <h3 className="font-bold text-xl mb-4">Manage Users ({users.length})</h3>
        {users.map(u => (
            <div key={u.id} className="flex justify-between items-center p-2 border-b dark:border-slate-700">
                <p>{u.email}</p>
                <div className="flex items-center gap-2">
                    <select
                        value={u.subscriptionStatus}
                        onChange={e => updateUserSubscription(u.id, e.target.value, u.subscriptionEndDate)}
                        className="p-1 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                    >
                        <option>FREE</option>
                        <option>ACTIVE</option>
                        <option>EXPIRED</option>
                    </select>
                    <input
                        type="date"
                        value={u.subscriptionEndDate || ''}
                        onChange={e => updateUserSubscription(u.id, u.subscriptionStatus, e.target.value)}
                        className="p-1 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                    />
                </div>
            </div>
        ))}
    </div>
);

export default PhysicsPlatform;