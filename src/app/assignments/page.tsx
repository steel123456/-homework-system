'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { BookOpen, Plus, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: 'teacher' | 'student'
}

interface Class {
  id: string
  name: string
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  status: string
  class: {
    id: string
    name: string
  }
  submission_count?: number
  my_submission?: {
    id: string
    status: string
    score: number | null
  }
  created_at: string
}

export default function AssignmentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    class_id: '',
    due_date: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      router.push('/')
      return
    }

    try {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchClasses(token)
      fetchAssignments(token)
    } catch (error) {
      console.error('解析用户信息失败:', error)
      router.push('/')
    }
  }, [router])

  const fetchClasses = async (token: string) => {
    try {
      const response = await fetch('/api/classes', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      setClasses(data.classes || [])
    } catch (error) {
      console.error('获取班级失败:', error)
    }
  }

  const fetchAssignments = async (token: string) => {
    try {
      const response = await fetch('/api/assignments', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('获取作业列表失败')

      const data = await response.json()
      setAssignments(data.assignments || [])
    } catch (error: any) {
      toast({
        title: '错误',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    if (!token) return

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建作业失败')
      }

      toast({
        title: '创建成功',
        description: '作业已发布',
      })

      setAssignments([data.assignment, ...assignments])
      setCreateForm({ title: '', description: '', class_id: '', due_date: '' })
      setCreateDialogOpen(false)
    } catch (error: any) {
      toast({
        title: '创建失败',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </Link>
            <h1 className="text-xl font-bold">
              {user.role === 'teacher' ? '作业管理' : '我的作业'}
            </h1>
          </div>
          {user.role === 'teacher' && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  布置作业
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleCreateAssignment}>
                  <DialogHeader>
                    <DialogTitle>布置作业</DialogTitle>
                    <DialogDescription>
                      为班级创建新的作业任务
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="assignment-class">选择班级</Label>
                      <Select
                        value={createForm.class_id}
                        onValueChange={(value) => setCreateForm({ ...createForm, class_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择班级" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignment-title">作业标题</Label>
                      <Input
                        id="assignment-title"
                        placeholder="例如：第一单元练习题"
                        value={createForm.title}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignment-description">作业要求</Label>
                      <Textarea
                        id="assignment-description"
                        placeholder="详细描述作业要求"
                        value={createForm.description}
                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                        rows={5}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignment-due">截止日期（可选）</Label>
                      <Input
                        id="assignment-due"
                        type="datetime-local"
                        value={createForm.due_date}
                        onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">发布作业</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assignments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {user.role === 'teacher' ? '还没有布置作业' : '暂无作业'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {assignment.class.name}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {assignment.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {user.role === 'teacher' ? (
                        <span>已提交：{assignment.submission_count || 0} 人</span>
                      ) : (
                        assignment.my_submission && (
                          <span>
                            状态：
                            <span className={
                              assignment.my_submission.status === 'graded' 
                                ? 'text-green-600' 
                                : 'text-blue-600'
                            }>
                              {assignment.my_submission.status === 'graded' ? '已批改' : '已提交'}
                            </span>
                            {assignment.my_submission.score !== null && (
                              <span className="ml-2">
                                得分：{assignment.my_submission.score}分
                              </span>
                            )}
                          </span>
                        )
                      )}
                    </div>
                    <Link href={`/assignments/${assignment.id}`}>
                      <Button variant="outline" size="sm">
                        {user.role === 'teacher' ? '查看详情' : '做作业'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
