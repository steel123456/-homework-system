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
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: 'teacher' | 'student'
}

interface Class {
  id: string
  name: string
  description: string
  code: string
  teacher_id: string
  teacher?: {
    id: string
    name: string
    email: string
  }
  member_count?: number
  created_at: string
}

export default function ClassesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 创建班级表单
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  })

  // 加入班级表单
  const [joinCode, setJoinCode] = useState('')

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
    } catch (error) {
      console.error('解析用户信息失败:', error)
      router.push('/')
    }
  }, [router])

  const fetchClasses = async (token: string) => {
    try {
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('获取班级列表失败')
      }

      const data = await response.json()
      setClasses(data.classes || [])
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

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    if (!token) return

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建班级失败')
      }

      toast({
        title: '创建成功',
        description: `班级已创建，邀请码：${data.class.code}`,
      })

      setClasses([data.class, ...classes])
      setCreateForm({ name: '', description: '' })
      setCreateDialogOpen(false)
    } catch (error: any) {
      toast({
        title: '创建失败',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    if (!token) return

    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: joinCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '加入班级失败')
      }

      toast({
        title: '加入成功',
        description: `已成功加入 ${data.class.name}`,
      })

      setClasses([data.class, ...classes])
      setJoinCode('')
      setJoinDialogOpen(false)
    } catch (error: any) {
      toast({
        title: '加入失败',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast({
      title: '已复制',
      description: `邀请码 ${code} 已复制到剪贴板`,
    })
    setTimeout(() => setCopiedCode(null), 2000)
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
            <h1 className="text-xl font-bold">班级管理</h1>
          </div>
          <div className="flex gap-2">
            {user.role === 'teacher' && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    创建班级
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateClass}>
                    <DialogHeader>
                      <DialogTitle>创建班级</DialogTitle>
                      <DialogDescription>
                        创建新班级，系统将自动生成邀请码
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="class-name">班级名称</Label>
                        <Input
                          id="class-name"
                          placeholder="例如：三年级一班"
                          value={createForm.name}
                          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class-description">班级描述</Label>
                        <Textarea
                          id="class-description"
                          placeholder="班级简介（可选）"
                          value={createForm.description}
                          onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">创建</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {user.role === 'student' && (
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    加入班级
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleJoinClass}>
                    <DialogHeader>
                      <DialogTitle>加入班级</DialogTitle>
                      <DialogDescription>
                        输入老师提供的班级邀请码
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-2">
                        <Label htmlFor="join-code">邀请码</Label>
                        <Input
                          id="join-code"
                          placeholder="请输入6位邀请码"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">加入</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {classes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {user.role === 'teacher' ? '还没有创建班级' : '还没有加入班级'}
              </p>
              <Button
                onClick={() => {
                  if (user.role === 'teacher') {
                    setCreateDialogOpen(true)
                  } else {
                    setJoinDialogOpen(true)
                  }
                }}
              >
                {user.role === 'teacher' ? '创建第一个班级' : '加入第一个班级'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {cls.description || '暂无描述'}
                      </CardDescription>
                    </div>
                    {user.role === 'teacher' && (
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs">
                        <span className="font-mono font-semibold">{cls.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyCode(cls.code)}
                        >
                          {copiedCode === cls.code ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {cls.teacher && (
                      <p>教师：{cls.teacher.name}</p>
                    )}
                    {cls.member_count !== undefined && (
                      <p>学生人数：{cls.member_count}</p>
                    )}
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
