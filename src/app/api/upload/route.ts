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

    // 生成文件名 - 使用合法的文件名格式
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    // 获取文件扩展名，确保是合法的
    const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    // 只允许常见的图片扩展名
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const ext = allowedExts.includes(originalExt) ? originalExt : 'jpg'
    // 确定正确的 content type
    const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
    
    const fileName = `homework/${timestamp}_${randomStr}.${ext}`

    // 上传文件
    let key: string
    try {
      key = await storage.uploadFile({
        fileContent: buffer,
        fileName,
        contentType,
      })
    } catch (uploadError) {
      console.error('S3 上传错误:', uploadError)
      const errorMessage = uploadError instanceof Error ? uploadError.message : '文件上传失败'
      return NextResponse.json({ error: `上传失败: ${errorMessage}` }, { status: 500 })
    }

    // 生成访问 URL（有效期 7 天）
    let url: string
    try {
      url = await storage.generatePresignedUrl({
        key,
        expireTime: 7 * 24 * 60 * 60, // 7 天
      })
    } catch (urlError) {
      console.error('生成 URL 错误:', urlError)
      // 如果生成 URL 失败，仍然返回 key，但 URL 为空
      return NextResponse.json({
        success: true,
        key,
        url: null,
        fileName: file.name,
        fileSize: file.size,
        warning: '文件已上传，但生成访问链接失败',
      })
    }

    return NextResponse.json({
      success: true,
      key,
      url,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('上传文件错误:', error)
    const errorMessage = error instanceof Error ? error.message : '上传失败'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
