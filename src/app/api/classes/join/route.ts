import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 学生加入班级
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: '请输入邀请码' }, { status: 400 })
    }

    const supabase = getSupabaseClient(token)

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 查找班级
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 404 })
    }

    // 检查是否已加入
    const { data: existingMember } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', classData.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: '你已经加入了该班级' }, { status: 400 })
    }

    // 加入班级
    const { error: joinError } = await supabase
      .from('class_members')
      .insert({
        class_id: classData.id,
        user_id: user.id,
        role: 'student',
      })

    if (joinError) {
      return NextResponse.json({ error: '加入班级失败' }, { status: 500 })
    }

    // 获取完整的班级信息
    const { data: fullClass, error: fetchError } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles!classes_teacher_id_fkey(id, name, email)
      `)
      .eq('id', classData.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: '获取班级信息失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      class: fullClass 
    })
  } catch (error) {
    console.error('加入班级错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
