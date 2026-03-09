import { NextRequest, NextResponse } from 'next/server'
import { S3Storage } from 'coze-coding-dev-sdk'

// 上传图片
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '只支持图片文件' }, { status: 400 })
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 初始化 S3 存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })

    // 生成文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `homework/${timestamp}_${randomStr}.${ext}`

    // 上传文件
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type,
    })

    // 生成访问 URL（有效期 7 天）
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 7 * 24 * 60 * 60, // 7 天
    })

    return NextResponse.json({
      success: true,
      key,
      url,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('上传文件错误:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
