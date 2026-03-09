'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Upload, X, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: 'teacher' | 'student'
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  class: {
    id: string
    name: string
  }
  teacher: {
    id: string
    name: string
  }
}

interface Attachment {
  url: string
  key: string
  fileName?: string
  fileSize?: number
}

export default function AssignmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<User | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [grading, setGrading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
      fetchAssignment(token)
    } catch (error) {
      console.error('解析用户信息失败:', error)
      router.push('/')
    }
  }, [router, params.id])

  const fetchAssignment = async (token: string) => {
    try {
      const response = await fetch(`/api/assignments/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('获取作业失败')

      const data = await response.json()
      setAssignment(data.assignment)
      
      // 如果有已提交的内容，加载
      if (data.submission) {
        setContent(data.submission.content || '')
        setAttachments(data.submission.attachments || [])
        setFeedback(data.submission.feedback || null)
        setScore(data.submission.score || null)
      }
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '上传失败')
        }

        setAttachments(prev => [...prev, {
          url: data.url,
          key: data.key,
          fileName: data.fileName,
          fileSize: data.fileSize,
        }])

        setUploadProgress(((i + 1) / files.length) * 100)
      }

      toast({
        title: '上传成功',
        description: `已上传 ${files.length} 张图片`,
      })
    } catch (error: any) {
      toast({
        title: '上传失败',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      toast({
        title: '提示',
        description: '请填写作业内容或上传图片',
        variant: 'destructive',
      })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignment_id: params.id,
          content,
          attachments: attachments.map(a => ({ url: a.url, key: a.key })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '提交失败')
      }

      toast({
        title: '提交成功',
        description: '作业已提交',
      })
    } catch (error: any) {
      toast({
        title: '提交失败',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAIGrade = async () => {
    if (!content.trim() && attachments.length === 0) {
      toast({
        title: '提示',
        description: '请先提交作业内容',
        variant: 'destructive',
      })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    setGrading(true)

    try {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignment_id: params.id,
          images: attachments.map(a => a.url),
          text_content: content,
          assignment_title: assignment?.title,
          assignment_description: assignment?.description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI 批改失败')
      }

      setFeedback(data.feedback)
      setScore(data.score)

      toast({
        title: '批改完成',
        description: `得分：${data.score}分`,
      })
    } catch (error: any) {
      toast({
        title: '批改失败',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setGrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!user || !assignment) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{assignment.title}</h1>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* 左侧：作业信息 */}
          <div className="md:col-span-2 space-y-6">
            {/* 作业要求 */}
            <Card>
              <CardHeader>
                <CardTitle>作业要求</CardTitle>
                <CardDescription>
                  {assignment.class.name} · {assignment.teacher.name} 老师
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{assignment.description}</p>
                {assignment.due_date && (
                  <p className="text-sm text-gray-500 mt-4">
                    截止日期：{new Date(assignment.due_date).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 提交区域 */}
            {user.role === 'student' && !feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>提交作业</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">文字答案</label>
                    <Textarea
                      placeholder="请填写作业答案..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">上传图片</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? '上传中...' : '选择图片'}
                    </Button>

                    {uploading && (
                      <Progress value={uploadProgress} className="mt-2" />
                    )}

                    {/* 已上传的图片 */}
                    {attachments.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {attachments.map((att, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={att.url}
                              alt={`附件 ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeAttachment(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? '提交中...' : '提交作业'}
                    </Button>
                    <Button
                      onClick={handleAIGrade}
                      disabled={grading}
                      variant="secondary"
                      className="flex-1"
                    >
                      {grading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          AI 批改中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI 批改
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 批改结果 */}
            {feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>批改结果</span>
                    {score !== null && (
                      <span className="text-2xl font-bold text-blue-600">
                        {score}分
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none whitespace-pre-wrap">
                    {feedback}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：提示信息 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">提示</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• 可以上传作业图片，AI 会自动识别并批改</p>
                <p>• 文字答案会一并被批改</p>
                <p>• 点击"AI 批改"获得即时反馈</p>
                <p>• 也可以先提交，等待老师批改</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
