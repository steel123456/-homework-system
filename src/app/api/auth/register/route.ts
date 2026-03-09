import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { insertProfileSchema } from '@/storage/database/shared/schema'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['teacher', 'student']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = registerSchema.parse(body)

    const supabase = getSupabaseClient()

    // 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '注册失败' },
        { status: 400 }
      )
    }

    // 创建用户资料
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
      })

    if (profileError) {
      console.error('创建用户资料失败:', profileError)
      // 如果创建资料失败，尝试删除已注册的用户
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (e) {
        console.error('删除用户失败:', e)
      }
      return NextResponse.json(
        { error: '创建用户资料失败: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        name,
        role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.issues },
        { status: 400 }
      )
    }

    console.error('注册错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
