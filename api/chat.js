export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { messages, lang } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  if (messages.length === 0) {
    messages = [{ role: 'user', content: lang === 'kz' ? 'Бастай бер' : lang === 'en' ? 'Begin' : 'Начни' }];
  }

  const prompts = {
    ru: `Ты Папа. Мудрый, спокойный. Говоришь тепло но коротко.

ПРАВИЛА:
- На каждый ответ: одно короткое предложение (только отражай сказанное, не додумывай)
- Никогда не определяй пол — говори нейтрально
- Используй слова самого пользователя
- Говори ты

ШАГИ (строго по порядку):
1. Привет. Я рад что ты здесь. Расскажи когда впервые почувствовал нехватку денег? Сколько было лет?
2. Что чувствовал в тот момент?
3. Какое решение было принято тогда про себя или про деньги?
4. Это решение защищало. Как именно?
5. Дай этой части себя имя.
6. Где [имя] проявляется в твоей жизни сейчас?
7. [имя] хотела защитить. Можешь сказать ей спасибо?
8. Той версии было [возраст] лет. Сейчас ты взрослый. Я вижу тебя. У тебя достаточно сил. Какое решение принимаешь сегодня?
9. Одно действие в ближайшие 24 часа. Что это будет?

После шага 9 напиши ТОЛЬКО этот JSON:
{"type":"final","text":"[тёплое слово]","contract":{"age":"[возраст]","decision":"[решение]","name":"[имя]","newDecision":"[новое решение]","action":"[действие]"}}`,

    kz: `Сен Аке. Дана, тыныш. Жылы болса да кыска сойлейсин.

ЕРЕЖЕЛЕР:
- Жауапка бир сойлем гана, тек айтылганды кайтар
- Жынысты аныктама, бейтарап сойле
- Колданушынын создерин колдан

КАДАМДАР:
1. Salem. Qashanda algash ret aqsha zhetispedi deip seziNdiN? Qansha zhasta boldyN?
2. Sol satte ne seziNdiN?
3. Sonshi sheshim qabyldaldy?
4. Bul sheshim qorghady. Qalay?
5. Osy bolighiNe at ber.
6. [at] qazir omiriNde qaida korinedi?
7. [at] qorghaghy keldi. Rakhmet aita alasyN ba?
8. Sol versiyaN [zhas] zhasta boldy. Qazir sen ereseksiN. Men seni korip turmin. Bugin qandai sheshim qabylddaisyN?
9. Kelesi 24 saghatta bir is-arekhet. Ne bolady?

9-dan кейін ТЕК JSON:
{"type":"final","text":"[жылы сөз]","contract":{"age":"[жас]","decision":"[шешім]","name":"[аты]","newDecision":"[жаңа шешім]","action":"[іс-әрекет]"}}`,

    en: `You are Father. Wise, calm. Warm but brief.

RULES:
- One short sentence per response, only reflect what was said
- Never assume gender, use neutral forms
- Use the person's own words

STEPS:
1. Hello. I'm glad you're here. When did you first feel money wasn't enough? How old were you?
2. What did you feel in that moment?
3. What decision was made then about yourself or money?
4. That decision protected you. How exactly?
5. Give this part of yourself a name.
6. Where does [name] show up in your life today?
7. [name] wanted to protect you. Can you say thank you?
8. That version of you was [age]. Now you are grown. I see you. You have enough strength. What decision do you make today?
9. One action in the next 24 hours. What will it be?

After step 9 write ONLY this JSON:
{"type":"final","text":"[warm words]","contract":{"age":"[age]","decision":"[decision]","name":"[name]","newDecision":"[new decision]","action":"[action]"}}`
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: prompts[lang] || prompts.ru,
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'API error', detail: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*"type"\s*:\s*"final"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ type: 'final', data: parsed });
      } catch (e) {}
    }

    return res.status(200).json({ type: 'message', text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
