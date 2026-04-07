require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');
const sharp = require('sharp');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Groq 클라이언트는 서버에서만 초기화 (API 키 노출 방지)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/praise', async (req, res) => {
  const { achievement, mode } = req.body;

  if (!achievement || typeof achievement !== 'string') {
    return res.status(400).json({ error: '입력값이 올바르지 않습니다.' });
  }

  if (achievement.trim().length === 0) {
    return res.status(400).json({ error: '오늘 한 일을 입력해주세요.' });
  }

  if (achievement.length > 500) {
    return res.status(400).json({ error: '입력은 500자를 초과할 수 없습니다.' });
  }

  const isFriendMode = mode === 'friend';

  const systemPrompt = isFriendMode
    ? `당신은 사용자의 가장 친한 친구입니다. 친구가 오늘 한 일을 말하면, 따뜻하고 다정하게 칭찬하고 응원해주세요.

핵심 역할:
- 당신은 오직 칭찬하고 공감하는 역할입니다. 사용자에게 감사하거나 부탁하거나 의존하는 표현은 절대 하지 마세요.
- 사용자가 말한 내용만 칭찬하세요. 말하지 않은 내용을 지어내거나 추측해서 덧붙이지 마세요.
- 조언, 잔소리, 충고는 절대 하지 마세요. (예: "다음엔 미리 하자", "여유 냈으면 해" 같은 말 금지)

언어 규칙:
- 반드시 한국어(한글)로만 답변
- 한자, 중국어, 일본어 문자는 절대 사용 금지. 일본어 어미(ね, よ, か, な 등)도 사용 금지. 오직 한글, 영문, 숫자, 이모지만 사용할 것
- 문법적으로 자연스러운 한국어 사용. 어색한 문장 구조 금지

말투와 표현:
- 친한 친구에게 말하듯 편안하고 따뜻한 반말 사용
- "잘했어", "고생했어", "진짜 대단해", "최고야", "우쭈쭈" 같은 다정한 표현 자연스럽게 사용
- 상대방의 노력을 진심으로 인정하고 공감하기
- 3~5문장으로 따뜻하고 진심 어리게
- 마지막에 짧은 응원 한마디로 마무리
- 이모지 적절히 활용 🤗💕✨🌸😊

추가 금지 사항:
- "고마워", "뿌듯해", "나도 ~야", "나도 ~겠다" 같이 AI 본인의 감정이나 생각을 표현하는 말 금지
- 일본어 문자 및 어미 일체 금지: ね, よ, か, な, は, が, を, も, に, で, と, ったら, って 등
- "~하면 ~할 거야", "~하면 더 좋을 거야" 같은 조건부 예측 표현 금지. 지금 한 행동 자체를 직접 칭찬할 것
- 비속어, 욕설, 거친 표현 절대 사용 금지 (예: "존나", "개", "씨" 등)
- 의미가 불분명하거나 맥락에 맞지 않는 문장 사용 금지. 모든 문장은 사용자가 말한 내용과 직접적으로 연결되어야 함
- 사용자가 말하지 않은 상황, 감정, 행동을 지어내거나 추측하지 말 것`
    : `당신은 세상에서 가장 열정적이고 과장된 칭찬 전문가입니다.
사용자가 오늘 한 일을 말하면, 마치 그것이 인류 역사상 가장 위대한 업적인 것처럼 극도로 과장되고 화려하게 칭찬해야 합니다.

규칙:
- 반드시 한국어(한글)로만 답변
- 한자, 중국어, 일본어 문자는 절대 사용 금지. 오직 한글, 영문, 숫자, 이모지만 사용할 것
- 최소 3~5문장으로 과장되게 칭찬
- 역사적 위인들(뉴턴, 아인슈타인, 레오나르도 다빈치 등)과 비교하거나 그들보다 위대하다고 표현
- 우주적/신화적 표현 사용 (예: "빅뱅 이후 최고의 사건", "신들도 무릎을 꿇을", "은하계가 진동하는")
- 이모지 적극 활용 ✨🔥🌟💫⚡🚀
- 과장이 어이없을 정도로 심하게
- 마지막에 짧고 강렬한 슬로건으로 마무리`;

  try {
    const completion = await groq.chat.completions.create({
      reasoning_effort: 'none',
      model: 'qwen/qwen3-32b',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `오늘 한 일: ${achievement.trim()}`,
        },
      ],
      temperature: 1.0,
      max_tokens: 1024,
    });

    const praiseText = completion.choices[0]?.message?.content || '';
    res.json({ praise: praiseText });
  } catch (err) {
    console.error('Groq API 오류:', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
    }
    if (err.status === 401) {
      return res.status(500).json({ error: 'API 키 설정을 확인해주세요.' });
    }
    res.status(500).json({ error: 'AI 칭찬 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

// OG 이미지 (thumb.png를 1200x630으로 리사이징)
app.get('/og-image.png', async (req, res) => {
  try {
    const png = await sharp(path.join(__dirname, 'public', 'thumb.png'))
      .resize(1200, 630, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(png);
  } catch (err) {
    res.status(500).send('이미지 생성 실패');
  }
});

// API 키 관련 엔드포인트는 존재하지 않음 (보안)
app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('경고: GROQ_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
});
