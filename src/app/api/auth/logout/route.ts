import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: true })
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseClient(token)

    // 退出登录
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('退出登录错误:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('退出登录错误:', error)
    return NextResponse.json({ success: true })
  }
}
