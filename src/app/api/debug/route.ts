import { NextResponse } from 'next/server'

// 调试接口 - 检查环境变量配置
export async function GET() {
  const envStatus = {
    COZE_SUPABASE_URL: process.env.COZE_SUPABASE_URL ? '✓ 已设置' : '✗ 未设置',
    COZE_SUPABASE_ANON_KEY: process.env.COZE_SUPABASE_ANON_KEY ? '✓ 已设置' : '✗ 未设置',
    COZE_BUCKET_ENDPOINT_URL: process.env.COZE_BUCKET_ENDPOINT_URL ? '✓ 已设置' : '✗ 未设置',
    COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME ? '✓ 已设置' : '✗ 未设置',
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json({
    status: 'ok',
    environment: envStatus,
    timestamp: new Date().toISOString(),
  })
}
