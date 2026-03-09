import { NextRequest, NextResponse } from 'next/server'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// AI 批改作业
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { submission_id, images, text_content, assignment_title, assignment_description } = body

    const supabase = getSupabaseClient(token)

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 构建消息内容
    const messageContent: any[] = [
      {
        type: 'text',
        text: `你是一位专业的作业批改老师。请批改以下学生作业。

作业标题：${assignment_title}
作业要求：${assignment_description}

${text_content ? `学生文字答案：\n${text_content}\n\n` : ''}
${images && images.length > 0 ? '学生上传了作业图片，请仔细查看并批改。' : '学生没有上传图片。'}

请按以下格式给出批改结果：

## 总体评价
[给出整体评价]

## 得分
[0-100分的评分]

## 详细批改
[逐题或逐项分析]

## 改进建议
[提出改进建议]

请客观、公正地批改，并给出具体的反馈。`,
      },
    ]

    // 添加图片
    if (images && images.length > 0) {
      for (const imageUrl of images) {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'high',
          },
        })
      }
    }

    // 初始化 LLM 客户端
    const config = new Config()
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers)
    const client = new LLMClient(config, customHeaders)

    // 调用视觉模型进行批改
    const messages = [
      {
        role: 'user' as const,
        content: messageContent,
      },
    ]

    let feedback = ''
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-6-vision-250815',
      temperature: 0.7,
    })

    for await (const chunk of stream) {
      if (chunk.content) {
        feedback += chunk.content.toString()
      }
    }

    // 提取分数
    let score = null
    const scoreMatch = feedback.match(/## 得分\s*\n+(\d+)/)
    if (scoreMatch) {
      score = parseInt(scoreMatch[1])
    }

    // 更新提交记录
    if (submission_id) {
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          feedback,
          score,
          status: 'graded',
          graded_by: 'ai',
          graded_at: new Date().toISOString(),
        })
        .eq('id', submission_id)

      if (updateError) {
        console.error('更新提交记录失败:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      feedback,
      score,
    })
  } catch (error) {
    console.error('AI 批改错误:', error)
    return NextResponse.json({ error: 'AI 批改失败' }, { status: 500 })
  }
}
