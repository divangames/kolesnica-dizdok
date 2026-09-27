const fs = require('fs');
const path = require('path');

const root = __dirname;
const playersRoot = path.resolve(root, '..', 'content', 'assets', 'data', 'players');
const storyPath = path.join(root, 'ИГРОВОЙСЮЖЕТ.txt');
const outputRoot = path.join(root, 'dist', 'dialogues');
const githubRoot = 'https://github.com/divangames/racing/blob/main/Full%20Games/content/assets/data/players';
const rawRoot = 'https://raw.githubusercontent.com/divangames/racing/main/Full%20Games/content/assets/data/players';

const hostExtra = [
  { id: 'countdown', event: 'Обратный отсчёт', takes: [
    ['countdown_01.mp3', 'Три! Два! Один! Кто не готов — тот уже опоздал!'],
    ['countdown_02.mp3', 'Моторы ревут. Ворота открыты. Пошли!'],
    ['countdown_03.mp3', 'Свет зелёный! Жмите газ, пока есть чем!']
  ]},
  { id: 'overtake', event: 'Обгон за лидерство', takes: [
    ['overtake_01.mp3', 'Меняется лидер! Корона ещё горячая!'],
    ['overtake_02.mp3', 'Обходит по живому! Вот за это толпа и платила!'],
    ['overtake_03.mp3', 'Местами поменялись! Имена на могилах — чуть позже!']
  ]},
  { id: 'critical', event: 'Критические повреждения', takes: [
    ['critical_01.mp3', 'Брони почти нет! Зато характер пока не отвалился!'],
    ['critical_02.mp3', 'Машина просит пощады. Гонщик её не слышит!'],
    ['critical_03.mp3', 'Ещё один удар — и это будет уже не ремонт, а археология!']
  ]},
  { id: 'place_2', event: 'Финиш — 2 место', takes: [
    ['place_2_01.mp3', 'Серебро! Был рядом с короной, но корона уехала быстрее!'],
    ['place_2_02.mp3', 'Второе место! Спонсоры звонят, победитель не отвечает!'],
    ['place_2_03.mp3', 'Почти король! Но на арене «почти» не коронуют!']
  ]},
  { id: 'place_3', event: 'Финиш — 3 место', takes: [
    ['place_3_01.mp3', 'Бронза! В тройке, на ходу и почти целый!'],
    ['place_3_02.mp3', 'Третье место! Толпа ещё помнит имя — до следующего старта!'],
    ['place_3_03.mp3', 'Подиум взят! В следующий раз принесите ещё и победу!']
  ]},
  { id: 'eliminated', event: 'Выбывание', takes: [
    ['eliminated_01.mp3', 'Минус машина! Осколки оставьте — нам ещё декорации строить!'],
    ['eliminated_02.mp3', 'Сошёл с трассы! Эвакуатору — работа, зрителям — праздник!'],
    ['eliminated_03.mp3', 'Гонка закончилась раньше гонщика! Аплодисменты!']
  ]},
  { id: 'family_round', event: 'Сюжетный семейный раунд', takes: [
    ['family_round_01.mp3', 'Четыре машины. Один финиш. Остальные — материал!'],
    ['family_round_02.mp3', 'Семья на старте! Посмотрим, кто первым забудет о любви!'],
    ['family_round_03.mp3', 'Родная кровь, чужие патроны и наши камеры. Начинаем!']
  ]},
  { id: 'intermission', event: 'Сюжетный перерыв', takes: [
    ['intermission_01.mp3', 'Новый чемпион арены будет представлен после перерыва.'],
    ['intermission_02.mp3', 'Арена берёт паузу. Механики — к железу, врачи — к тому, что осталось!'],
    ['intermission_03.mp3', 'Не расходитесь! Дальше будет ещё дороже и ещё хуже!']
  ]}
].map((cue) => ({ ...cue, takes: cue.takes.map(([file, text]) => ({ file, text })) }));

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function safeFile(value) { return value.toLowerCase().replace(/[^a-z0-9а-яё]+/giu, '-').replace(/^-|-$/g, ''); }

function readRoles() {
  return fs.readdirSync(playersRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const jsonPath = path.join(playersRoot, entry.name, 'voice', 'lines.json');
      if (!fs.existsSync(jsonPath)) return null;
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return { id: entry.name, ...data, cues: entry.name === 'host' ? [...data.cues, ...hostExtra] : data.cues };
    })
    .filter(Boolean)
    .sort((a, b) => a.id === 'host' ? 1 : b.id === 'host' ? -1 : a.id.localeCompare(b.id));
}

function readScenes() {
  const lines = fs.readFileSync(storyPath, 'utf8').split(/\r?\n/);
  const scenes = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].startsWith('КАТСЦЕНА ')) continue;
    const header = lines[i].trim();
    const body = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      if (lines[j].startsWith('КАТСЦЕНА ') || lines[j].startsWith('МИССИЯ ')) break;
      if (/^\d+(?:\.\d+)*\.\s+[A-ЯЁ]/u.test(lines[j])) break;
      body.push(lines[j]);
      i = j;
    }
    const token = (header.match(/^КАТСЦЕНА\s+([^.«]+)/u) || [null, `scene-${scenes.length + 1}`])[1].trim();
    const title = (header.match(/«([^»]+)»/u) || [null, token])[1];
    scenes.push({ id: token, title, header, body: body.join('\n').trim() });
  }
  return scenes;
}

function sceneLines(scene) {
  const result = [];
  let current = null;
  for (const raw of scene.body.split(/\r?\n/)) {
    const line = raw.trim();
    const match = line.match(/^([A-ЯЁ][A-ЯЁ 0-9«».-]{1,40}):\s*(.+)$/u);
    if (match) {
      if (current) result.push(current);
      current = { speaker: match[1].trim(), text: match[2].trim() };
      continue;
    }
    if (current && line && !/^(Кадр|Промт|Цель|Результат|Переход|Ветка|Финал|После|Игрок|Геймплей|Условие|Награда|Смысл|Канон|Постановка):/u.test(line)) {
      current.text += ` ${line}`;
    } else if (!line && current) {
      result.push(current);
      current = null;
    }
  }
  if (current) result.push(current);
  return result;
}

function roleText(role, scenes) {
  const lines = [
    `КОЛЕСНИЦА ВОЙНЫ · АКТЁРСКИЙ ЛИСТ`,
    `Роль: ${role.name}`,
    `ID: ${role.id}`,
    `Подача: ${role.voice || 'без отдельной пометки'}`,
    '',
    'ЗАПИСЬ',
    '• Формат: MP3, 48 кГц, без длинной тишины по краям.',
    '• Имя файла не менять. Одна строка — один отдельный файл.',
    '• Вокал без музыки, реверберации и шума трибун.',
    '',
    'ИГРОВЫЕ РЕПЛИКИ'
  ];
  for (const cue of role.cues) {
    lines.push('', `[${cue.event}]`);
    for (const take of cue.takes) lines.push(`${take.file} | ${take.text}`);
  }
  const aliases = role.id === 'host' ? ['ВЕДУЩИЙ'] : [String(role.name).toUpperCase()];
  const story = [];
  for (const scene of scenes) {
    const own = sceneLines(scene).filter((line) => aliases.includes(line.speaker));
    if (own.length) story.push({ scene, own });
  }
  if (story.length) {
    lines.push('', '', 'СЮЖЕТНЫЕ СЦЕНЫ');
    for (const { scene, own } of story) {
      lines.push('', `${scene.header}`);
      for (const line of own) lines.push(`${line.speaker}: ${line.text}`);
    }
  }
  lines.push('', '', 'Источник: дизайн-документ «Колесница войны».', '');
  return lines.join('\n');
}

function build() {
  const roles = readRoles();
  const scenes = readScenes();
  ensureDir(outputRoot);
  ensureDir(path.join(outputRoot, 'actors'));
  ensureDir(path.join(outputRoot, 'scenes'));
  fs.copyFileSync(storyPath, path.join(root, 'dist', 'ИГРОВОЙСЮЖЕТ.txt'));
  fs.copyFileSync(path.join(root, 'РАСКАДРОВКА_КОМИКСОВ.md'), path.join(root, 'dist', 'РАСКАДРОВКА_КОМИКСОВ.md'));

  const actorRows = roles.map((role) => {
    const file = `${role.id}-${safeFile(role.name)}.txt`;
    fs.writeFileSync(path.join(outputRoot, 'actors', file), roleText(role, scenes), 'utf8');
    const baseCount = role.cues.reduce((sum, cue) => sum + cue.takes.length, 0);
    const githubPath = `${githubRoot}/${role.id}/voice/lines.json`;
    const rawPath = `${rawRoot}/${role.id}/voice/lines.json`;
    return `<article class="dialogue-card${role.id === 'host' ? ' host-card' : ''}"><span class="dialogue-id">${escapeHtml(role.id)}</span><h3>${escapeHtml(role.name)}</h3><p>${escapeHtml(role.voice || '')}</p><small>${baseCount} реплик · ${role.cues.length} событий</small><div class="dialogue-actions"><a href="actors/${encodeURIComponent(file)}" download>↓ TXT для актёра</a><a href="${githubPath}" target="_blank" rel="noreferrer">GitHub ↗</a><a class="raw-link" href="${rawPath}" download>↓ JSON</a></div></article>`;
  }).join('\n');

  const allScenes = scenes.map((scene) => `${scene.header}\n${'='.repeat(scene.header.length)}\n\n${scene.body}\n`).join('\n\n');
  fs.writeFileSync(path.join(outputRoot, 'scenes', 'all-scenes.txt'), `КОЛЕСНИЦА ВОЙНЫ · ВСЕ СЮЖЕТНЫЕ СЦЕНЫ\n\n${allScenes}`, 'utf8');
  const sceneRows = scenes.map((scene, index) => {
    const file = `${String(index + 1).padStart(2, '0')}-${safeFile(scene.id)}-${safeFile(scene.title)}.txt`;
    fs.writeFileSync(path.join(outputRoot, 'scenes', file), `${scene.header}\n${'='.repeat(scene.header.length)}\n\n${scene.body}\n`, 'utf8');
    const lines = sceneLines(scene);
    const speakers = [...new Set(lines.map((line) => line.speaker))];
    return `<li><span>${String(index + 1).padStart(2, '0')}</span><div><b>${escapeHtml(scene.title)}</b><small>${escapeHtml(scene.id)} · ${lines.length} реплик · ${escapeHtml(speakers.join(' / ') || 'без устных реплик')}</small></div><a href="scenes/${encodeURIComponent(file)}" download>↓ Скачать TXT</a></li>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b0e12"><title>Диалоги для озвучки — Колесница войны</title><link rel="stylesheet" href="../styles.css"><link rel="stylesheet" href="../updates.css"></head>
<body><header class="topbar"><a class="brand" href="../index.html#dialogues"><span class="brand-mark">CW</span><span><b>ДИАЛОГИ ДЛЯ ОЗВУЧКИ</b><small>АКТЁРСКАЯ БИБЛИОТЕКА · 28.09.2026</small></span></a><a class="back-link" href="../index.html#dialogues">← В диздок</a></header>
<main class="dialogue-page"><section class="dialogue-hero"><div class="eyebrow">VOICE PRODUCTION / DOWNLOAD CENTER</div><h1>Каждому голосу —<br><em>свой файл</em></h1><p>Актёр скачивает только свой TXT: подача, имена MP3, игровые реплики и все его сюжетные сцены. Ссылка GitHub открывает машинный исходник.</p><div class="dialogue-summary"><div><strong>${roles.length}</strong><span>ролей</span></div><div><strong>${scenes.length}</strong><span>катсцен</span></div><div><strong>${roles.reduce((sum, role) => sum + role.cues.reduce((n, cue) => n + cue.takes.length, 0), 0)}</strong><span>игровых реплик</span></div></div></section>
<section class="dialogue-section"><div class="section-head"><span class="index">01</span><div><div class="eyebrow">ACTOR PACKS</div><h2>Персональные<br>листы ролей</h2></div></div><p class="section-note">Ведущий получил дополнительные блоки: обратный отсчёт, обгон, критические повреждения, 2–3 место, выбывание, семейный раунд и перерыв.</p><div class="dialogue-grid">${actorRows}</div></section>
<section class="dialogue-section"><div class="section-head"><span class="index">02</span><div><div class="eyebrow">SCENE PACKS</div><h2>Диалоги<br>по сценам</h2></div></div><div class="pack-download"><a href="scenes/all-scenes.txt" download>↓ Скачать все сцены одним TXT</a></div><ul class="scene-downloads">${sceneRows}</ul></section></main>
<footer class="footer"><span>КОЛЕСНИЦА ВОЙНЫ / ДИАЛОГИ</span><span>Генерируется из lines.json и ИГРОВОЙСЮЖЕТ.txt</span><a href="#top">↑ В начало</a></footer></body></html>`;
  fs.writeFileSync(path.join(outputRoot, 'index.html'), html, 'utf8');
  console.log(`Built ${roles.length} actor packs and ${scenes.length} scene packs in ${outputRoot}`);
}

build();
