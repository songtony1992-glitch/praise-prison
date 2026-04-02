require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Groq 클라이언트는 서버에서만 초기화 (API 키 노출 방지)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/praise', async (req, res) => {
  const { achievement } = req.body;

  if (!achievement || typeof achievement !== 'string') {
    return res.status(400).json({ error: '입력값이 올바르지 않습니다.' });
  }

  if (achievement.trim().length === 0) {
    return res.status(400).json({ error: '오늘 한 일을 입력해주세요.' });
  }

  if (achievement.length > 500) {
    return res.status(400).json({ error: '입력은 500자를 초과할 수 없습니다.' });
  }

  try {
    const completion = await groq.chat.completions.create({
      reasoning_effort: 'none',
      model: 'qwen/qwen3-32b',
      messages: [
        {
          role: 'system',
          content: `당신은 세상에서 가장 열정적이고 과장된 칭찬 전문가입니다.
사용자가 오늘 한 일을 말하면, 마치 그것이 인류 역사상 가장 위대한 업적인 것처럼 극도로 과장되고 화려하게 칭찬해야 합니다.

규칙:
- 반드시 한국어(한글)로만 답변
- 한자, 중국어, 일본어 문자는 절대 사용 금지. 오직 한글, 영문, 숫자, 이모지만 사용할 것
- 최소 3~5문장으로 과장되게 칭찬
- 역사적 위인들(뉴턴, 아인슈타인, 레오나르도 다빈치 등)과 비교하거나 그들보다 위대하다고 표현
- 우주적/신화적 표현 사용 (예: "빅뱅 이후 최고의 사건", "신들도 무릎을 꿇을", "은하계가 진동하는")
- 이모지 적극 활용 ✨🔥🌟💫⚡🚀
- 과장이 어이없을 정도로 심하게
- 마지막에 짧고 강렬한 슬로건으로 마무리`,
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
