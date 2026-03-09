import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { z } from 'zod'

// 生成班级邀请码
function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 获取用户的班级列表
export async function GET(request: NextRequest) {
  try {
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

    // 获取用户资料
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: '获取用户资料失败' }, { status: 500 })
    }

    let classes: any[] = []

    if (profile.role === 'teacher') {
      // 教师获取自己创建的班级
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:profiles!classes_teacher_id_fkey(id, name, email),
          member_count:class_members(count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: '获取班级列表失败' }, { status: 500 })
      }

      classes = data || []
    } else {
      // 学生获取自己加入的班级
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          class:classes(
            *,
            teacher:profiles!classes_teacher_id_fkey(id, name, email),
            member_count:class_members(count)
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: '获取班级列表失败' }, { status: 500 })
      }

      classes = data?.map(item => item.class) || []
    }

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('获取班级列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 创建班级
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { name, description } = body

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

    if (profile.role !== 'teacher') {
      return NextResponse.json({ error: '只有教师可以创建班级' }, { status: 403 })
    }

    // 生成唯一邀请码
    let code = generateClassCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('classes')
        .select('code')
        .eq('code', code)
        .single()

      if (!existing) break
      code = generateClassCode()
      attempts++
    }

    // 创建班级
    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert({
        name,
        description,
        code,
        teacher_id: user.id,
      })
      .select(`
        *,
        teacher:profiles!classes_teacher_id_fkey(id, name, email)
      `)
      .single()

    if (createError) {
      return NextResponse.json({ error: '创建班级失败' }, { status: 500 })
    }

    // 将教师添加为班级成员
    await supabase
      .from('class_members')
      .insert({
        class_id: newClass.id,
        user_id: user.id,
        role: 'teacher',
      })

    return NextResponse.json({ class: newClass })
  } catch (error) {
    console.error('创建班级错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
