'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, BookOpen, Users, LogOut } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: 'teacher' | 'student'
  avatar_url?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('解析用户信息失败:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error('退出登录错误:', error)
      }
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold">智能作业管理系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-gray-500 text-xs">{user.role === 'teacher' ? '教师' : '学生'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">欢迎回来，{user.name}！</h2>
          <p className="text-gray-600">
            {user.role === 'teacher' 
              ? '管理您的班级，布置和批改作业' 
              : '查看班级，提交作业，获取 AI 智能反馈'}
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user.role === 'teacher' ? (
            <>
              {/* 教师功能 */}
              <Link href="/classes">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle>班级管理</CardTitle>
                    <CardDescription>
                      创建班级、生成邀请码、管理学生
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/assignments">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle>作业管理</CardTitle>
                    <CardDescription>
                      布置作业、查看提交、AI 批改
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/submissions">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle>批改作业</CardTitle>
                    <CardDescription>
                      查看学生提交、手动或 AI 批改
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          ) : (
            <>
              {/* 学生功能 */}
              <Link href="/classes">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle>我的班级</CardTitle>
                    <CardDescription>
                      加入班级、查看班级信息
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/assignments">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle>查看作业</CardTitle>
                    <CardDescription>
                      查看老师布置的作业任务
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/submissions">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle>提交作业</CardTitle>
                    <CardDescription>
                      提交作业、上传图片、获取 AI 反馈
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
