import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 获取作业列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')

    const supabase = getSupabaseClient(token)

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 获取用户资料
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: '获取用户资料失败' }, { status: 500 })
    }

    let assignments: any[] = []

    if (profile.role === 'teacher') {
      // 教师获取自己布置的作业
      let query = supabase
        .from('assignments')
        .select(`
          *,
          class:classes(id, name),
          submission_count:submissions(count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (classId) {
        query = query.eq('class_id', classId)
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ error: '获取作业列表失败' }, { status: 500 })
      }

      assignments = data || []
    } else {
      // 学生获取需要完成的作业
      // 先获取学生加入的班级
      const { data: memberships, error: memberError } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id)

      if (memberError) {
        return NextResponse.json({ error: '获取班级信息失败' }, { status: 500 })
      }

      const classIds = memberships?.map(m => m.class_id) || []

      if (classIds.length === 0) {
        return NextResponse.json({ assignments: [] })
      }

      // 获取这些班级的作业
      let query = supabase
        .from('assignments')
        .select(`
          *,
          class:classes(id, name),
          my_submission:submissions!submissions_student_id_fkey(id, status, score)
        `)
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (classId) {
        query = query.eq('class_id', classId)
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ error: '获取作业列表失败' }, { status: 500 })
      }

      assignments = data || []
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('获取作业列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 创建作业
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { title, description, class_id, due_date } = body

    const supabase = getSupabaseClient(token)

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 验证用户是教师
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: '只有教师可以布置作业' }, { status: 403 })
    }

    // 创建作业
    const { data: assignment, error: createError } = await supabase
      .from('assignments')
      .insert({
        title,
        description,
        class_id,
        teacher_id: user.id,
        due_date: due_date || null,
      })
      .select(`
        *,
        class:classes(id, name)
      `)
      .single()

    if (createError) {
      return NextResponse.json({ error: '创建作业失败' }, { status: 500 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('创建作业错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
