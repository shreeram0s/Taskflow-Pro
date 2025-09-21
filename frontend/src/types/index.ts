// User types
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  bio?: string
  profile_picture?: string
  job_title?: string
  department?: string
  phone?: string
  theme_preference: 'light' | 'dark'
  role: 'scrum_master' | 'employee'
  date_joined: string
  last_active: string
}

// Project types
export interface Project {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'on-hold' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
  progress: number
  task_count: number
  member_count: number
  tasks?: Task[]
  members?: ProjectMember[]
}

export interface ProjectMember {
  id: number
  username: string
  email: string
  role: 'admin' | 'member' | 'viewer'
}

// Task types
export interface Task {
  id: number
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string
  project: number
  project_name: string
  assignee?: User
  created_by: string
  created_at: string
  updated_at: string
  completed_at?: string
  comment_count: number
  attachment_count: number
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
}

export interface TaskComment {
  id: number
  task: number
  user: {
    id: number
    username: string
    profile_picture?: string
  }
  content: string
  created_at: string
  updated_at: string
}

export interface TaskAttachment {
  id: number
  task: number
  uploaded_by: string
  filename: string
  file_url: string
  uploaded_at: string
}

// Analytics types
export interface AnalyticsData {
  tasks: {
    created: number
    completed: number
    in_progress: number
    avg_completion_time: number
  }
  projects: number
  activity: Array<{
    action: string
    count: number
  }>
  behavioral: {
    pages_visited: Array<{
      page_visited: string
      count: number
    }>
    avg_time_spent: number
    total_actions: number
  }
}

export interface DashboardAnalytics {
  task_stats: {
    total: number
    completed: number
    in_progress: number
    todo: number
    review: number
  }
  completion_percentage: number
  recent_activities: Array<{
    action: string
    entity_type: string
    description: string
    timestamp: string
  }>
  productivity: {
    tasks_completed_recently: number
    days_analyzed: number
  }
  project_progress: Array<{
    id: number
    name: string
    progress: number
    total_tasks: number
    completed_tasks: number
  }>
}

// Event types
export interface AnalyticsEvent {
  id: number
  user: string
  event_type: string
  entity_type: string
  entity_id: number
  metadata: Record<string, any>
  timestamp: string
  ip_address?: string
}

// Notification types
export interface Notification {
  id: number
  user: number
  type: 'task_assigned' | 'task_updated' | 'task_commented' | 'project_updated' | 'mention' | 'due_date' | 'system'
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message?: string
  data?: T
}

// Form types
export interface LoginForm {
  username: string
  password: string
  selectedRole?: 'scrum_master' | 'employee'
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  role?: 'scrum_master' | 'employee'
  bio?: string
  job_title?: string
  department?: string
  phone?: string
}

export interface ProjectForm {
  name: string
  description: string
  start_date: string
  end_date: string
  team_members?: Array<{
    user_id: number
    role: 'admin' | 'member' | 'viewer'
  }>
}

export interface TaskForm {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string
  assignee_id?: number
}

// Context types
export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (credentials: LoginForm) => Promise<User>
  register: (userData: RegisterForm) => Promise<User>
  logout: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<User>
  changePassword: (passwordData: { current_password: string; new_password: string }) => Promise<boolean>
}

export interface ProjectContextType {
  projects: Project[]
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (projectData: ProjectForm) => Promise<Project>
  updateProject: (id: number, projectData: Partial<ProjectForm>) => Promise<Project>
  deleteProject: (id: number) => Promise<void>
}

export interface TaskContextType {
  tasks: Task[]
  loading: boolean
  error: string | null
  fetchTasks: (projectId?: number) => Promise<void>
  createTask: (projectId: number, taskData: TaskForm) => Promise<Task>
  updateTask: (id: number, taskData: Partial<TaskForm>) => Promise<Task>
  deleteTask: (id: number) => Promise<void>
  moveTask: (taskId: number, newStatus: Task['status']) => Promise<void>
}
