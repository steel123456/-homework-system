import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseClient(token)

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 获取作业详情
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        *,
        class:classes(id, name),
        teacher:profiles!assignments_teacher_id_fkey(id, name)
      `)
      .eq('id', id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: '作业不存在' }, { status: 404 })
    }

    // 获取用户的提交记录
    const { data: submission } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', id)
      .eq('student_id', user.id)
      .single()

    return NextResponse.json({
      assignment,
      submission,
    })
  } catch (error) {
    console.error('获取作业详情错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
