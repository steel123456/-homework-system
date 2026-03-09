import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 获取提交记录
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignment_id')

    const supabase = getSupabaseClient(token)

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 获取用户资料
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let submissions: any[] = []

    if (profile?.role === 'teacher') {
      // 教师查看学生提交
      let query = supabase
        .from('submissions')
        .select(`
          *,
          student:profiles!submissions_student_id_fkey(id, name, email),
          assignment:assignments(id, title)
        `)
        .order('submitted_at', { ascending: false })

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId)
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ error: '获取提交记录失败' }, { status: 500 })
      }

      submissions = data || []
    } else {
      // 学生查看自己的提交
      let query = supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(id, title, class:classes(id, name))
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId)
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ error: '获取提交记录失败' }, { status: 500 })
      }

      submissions = data || []
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('获取提交记录错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 提交作业
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { assignment_id, content, attachments } = body

    const supabase = getSupabaseClient(token)

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 检查是否已提交
    const { data: existing } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignment_id)
      .eq('student_id', user.id)
      .single()

    if (existing) {
      // 更新提交
      const { data: submission, error: updateError } = await supabase
        .from('submissions')
        .update({
          content,
          attachments,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: '更新提交失败' }, { status: 500 })
      }

      return NextResponse.json({ submission })
    }

    // 新建提交
    const { data: submission, error: createError } = await supabase
      .from('submissions')
      .insert({
        assignment_id,
        student_id: user.id,
        content,
        attachments,
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: '提交作业失败' }, { status: 500 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('提交作业错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
