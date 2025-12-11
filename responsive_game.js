// Web 版 天策抓取小游戏（响应式版）
// 1.0s 翻滚（360°），0.2s 停顿窗口；50% 概率 1.2s 大旋转（720°），6s 冷却

// ==================== 基础设置 ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let CANVAS_WIDTH = 640;
let CANVAS_HEIGHT = 480;

// 参数（秒）
const ROLL_DURATION = 1.23;
const PAUSE_DURATION = 0.2;
const BIG_ROT_DURATION = 1.23;
const BIG_ROT_COOLDOWN = 6.0;
const ROLL_ANGLE = 360;
const BIG_ROT_ANGLE = 720;

// 游戏状态
let state = 'ready';                 // ready / rolling / pause / big_rot / caught_pause
let stateStart = performance.now();
let baseAngle = 0;
let angle = 0;
let lastBigTime = -BIG_ROT_COOLDOWN * 1000;
let caught = false;

// 抓取相关
const CAPTURE_COOLDOWN = 1500;       // ms
let lastCaptureAttemptTime = -Infinity;
let failureCount = 0;
let failureMessage = '';
let failureMessageTime = -Infinity;
const FAILURE_MESSAGE_DURATION = 2000;

// 回合时间
let roundStartTime = null;           // 开局时间
let elapsedAtCatch = null;           // 抓到那一刻定格时间（秒）

// 中心图尺寸（逻辑坐标）
let rectW = 200;
let rectH = 120;

// 图片
const centerImg = new Image();
centerImg.src = 'img/center.png';

// UI 元素
const stateText   = document.getElementById('stateText');
const hint        = document.getElementById('hint');
const cooldownEl  = document.getElementById('cooldown');
const captureBtn  = document.getElementById('captureBtn');

// 音效
const captureSfx = new Audio('sound/capture.ogg');
captureSfx.preload = 'auto';

const captureStrt = new Audio('sound/tiance_wristle.mp3');
captureStrt.preload = 'auto';

// ==================== 工具函数 ====================
function nowMs() { return performance.now(); }
function timeInStateMs() { return nowMs() - stateStart; }
function startState(s) { state = s; stateStart = nowMs(); }

// Canvas 自动换行（适合中文）
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split(''); // 按字拆
  let line = '';

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = chars[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// ==================== 响应式画布 ====================
function resizeCanvas() {
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 保持 4:3 比例
  const targetWidth = Math.min(containerWidth, containerHeight * 4 / 3);
  const targetHeight = targetWidth * 3 / 4;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  canvas.style.width = targetWidth + 'px';
  canvas.style.height = targetHeight + 'px';

  // 逻辑尺寸下的矩形大小
  rectW = CANVAS_WIDTH * 0.3125; // 200/640
  rectH = CANVAS_HEIGHT * 0.25;  // 120/480
}

// ==================== 逻辑函数 ====================

// 决定是否进行大旋转
function decideBigRotation(now) {
  return (now - lastBigTime) >= BIG_ROT_COOLDOWN * 1000 && Math.random() < 0.5;
}

// 开始一轮新游戏（ready 第一次 / 抓取成功后继续）
function startRound() {
  caught = false;
  baseAngle = angle % 360;
  roundStartTime = nowMs();
  failureCount = 0;
  elapsedAtCatch = null;
  failureMessage = '';
  startState('rolling');
}

// 继续游戏 = 再开一轮
function continueGame() {
  startRound();
}

// 处理抓取尝试
function attemptCapture() {
  const now = nowMs();

  // 1）准备状态：第一次按键/点击 = 开始游戏
  if (state === 'ready') {
    try {
      captureStrt.currentTime = 0;
      captureStrt.play();
    } catch (e) {}
    startRound();
    return;
  }

  // 2）抓取成功暂停：按键/点击 = 继续下一轮
  if (state === 'caught_pause') {
    try {
      captureStrt.currentTime = 0;
      captureStrt.play();
    } catch (e) {}
    continueGame();
    return;
  }

  // 3）冷却检查
  if (now - lastCaptureAttemptTime < CAPTURE_COOLDOWN) {
    return;
  }
  lastCaptureAttemptTime = now;

  // 播放按键音效（成功/失败都响一下）
  try {
    captureSfx.currentTime = 0;
    captureSfx.play();
  } catch (e) {}

  // 4）判断是否在停顿窗口内
  if (state === 'pause' && timeInStateMs() <= PAUSE_DURATION * 1000) {
    // 成功抓取
    caught = true;
    startState('caught_pause');
    elapsedAtCatch = (now - roundStartTime) / 1000;
  } else {
    // 抓取失败（在非停顿窗口按下）
    failureCount++;
    if (!failureMessage) {
      failureMessage = '后跳都抓不到？杂鱼';
    } else {
      failureMessage += '杂鱼';
    }
    failureMessageTime = now;
  }
}

// ==================== 事件绑定 ====================
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    attemptCapture();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  attemptCapture();
});

if (captureBtn) {
  captureBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    attemptCapture();
  });
}

// 整个页面点击/触摸都触发抓取
document.body.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  attemptCapture();
});


// 防止触摸滚动页面
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
}, { passive: false });

// ==================== 状态更新 ====================
function update(ms) {
  const now = nowMs();

  // 准备状态：角度不动
  if (state === 'ready') {
    angle = baseAngle % 360;
    return;
  }

  if (state === 'rolling') {
    const t = Math.min(1, timeInStateMs() / (ROLL_DURATION * 1000));
    angle = baseAngle + t * ROLL_ANGLE;
    if (t >= 1.0) {
      if (decideBigRotation(now)) {
        lastBigTime = now;
        baseAngle = angle % 360;
        startState('big_rot');
      } else {
        baseAngle = angle % 360;
        startState('pause');
      }
    }
  } else if (state === 'pause') {
    angle = baseAngle;
    if (timeInStateMs() >= PAUSE_DURATION * 1000) {
      if (!caught) {
        baseAngle = angle % 360;
        startState('rolling');
      }
    }
  } else if (state === 'big_rot') {
    const t = Math.min(1, timeInStateMs() / (BIG_ROT_DURATION * 1000));
    angle = baseAngle + t * BIG_ROT_ANGLE;
    if (t >= 1.0) {
      baseAngle = angle % 360;
      startState('rolling');
    }
  } else if (state === 'caught_pause') {
    angle = baseAngle % 360;
  }
}

// ==================== 绘制 ====================
function draw() {
  const now = nowMs();

  // 清空画布
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 绘制中心旋转图
  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.rotate(-angle * Math.PI / 180);

  if (centerImg && centerImg.complete && centerImg.naturalWidth) {
    const iw = centerImg.naturalWidth;
    const ih = centerImg.naturalHeight;
    const scale = Math.min(rectW / iw, rectH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    ctx.drawImage(centerImg, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.fillStyle = '#c8643c';
    ctx.fillRect(-rectW / 2, -rectH / 2, rectW, rectH);
  }
  ctx.restore();

  // ---------- 状态文字 ----------
  if (state === 'ready') {
    stateText.textContent = '状态：准备';
  } else if (state === 'rolling') {
    stateText.textContent = '状态：后跳~';
  } else if (state === 'pause') {
    stateText.textContent = '状态：有缝！';
  } else if (state === 'big_rot') {
    stateText.textContent = '状态：小轻功~ ~';
  } else if (state === 'caught_pause') {
    stateText.textContent = '状态：抓到啦！奶花一刀！ ';
  }

  // ---------- 提示文字 & 按钮 ----------
  if (state === 'ready') {
    if (window.innerWidth > 768) {
      hint.textContent = '按 空格 开始游戏';
    } else {
      hint.textContent = '点击按钮开始游戏';
    }
    if (captureBtn) captureBtn.textContent = '开始游戏';

  } else if (state === 'pause') {
    const remaining = Math.max(0, PAUSE_DURATION - timeInStateMs() / 1000);
    if (window.innerWidth > 768) {
      hint.textContent = `停顿窗口：${remaining.toFixed(2)}s — 在此按 空格 抓取`;
    } else {
      hint.textContent = `停顿窗口：${remaining.toFixed(2)}s — 点击按钮抓取`;
    }
    if (captureBtn) captureBtn.textContent = '抓取';

  } else if (state === 'caught_pause') {
    hint.textContent = '抓到啦！按键或点击继续';
    if (captureBtn) captureBtn.textContent = '继续游戏';

    // 成功台词（画在图上方，自动换行）
    ctx.save();
    ctx.fillStyle = '#ffd080';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';

    const maxWidth = CANVAS_WIDTH * 0.7;
    const lineHeight = 26;
    const x = CANVAS_WIDTH / 2;
    const y = CANVAS_HEIGHT / 2 - rectH / 2 - 50;

    const zayu = '杂鱼';
    let successMessage;
    if (failureCount < 3) {
      successMessage = '饶命啊！不要打花萝卜！';
    } else if (failureCount < 6) {
      successMessage = '哼！这次不算，下次再来！';
    } else {
      successMessage = `哼哼！${zayu.repeat(failureCount)},  居然要${failureCount}次才抓到我呢~`;
    }

    wrapText(ctx, successMessage, x, y, maxWidth, lineHeight);
    ctx.restore();

  } else if (state === 'big_rot') {
    const remaining = Math.max(0, BIG_ROT_DURATION - timeInStateMs() / 1000);
    hint.textContent = `小轻功中：${remaining.toFixed(2)}s`;
    if (captureBtn) captureBtn.textContent = '抓取';

  } else {
    // rolling 等默认提示
    if (window.innerWidth > 768) {
      hint.textContent = '按空格在停顿窗口内抓取';
    } else {
      hint.textContent = '点击按钮在停顿窗口内抓取';
    }
    if (captureBtn) captureBtn.textContent = '抓取';
  }

  // // ---------- 小轻功 CD ----------
  // const sinceBig = (now - lastBigTime) / 1000;
  // const cd = Math.max(0, BIG_ROT_COOLDOWN - sinceBig);
  // cooldownEl.textContent = `小轻功CD：${cd.toFixed(1)}s`;

  // === 抓取冷却显示 ===
  const sinceCapture = (nowMs() - lastCaptureAttemptTime) / 1000;
  const captureCD = Math.max(0, (CAPTURE_COOLDOWN / 1000) - sinceCapture);

  if (captureCD > 0) {
    cooldownEl.textContent = `破坚阵CD：${captureCD.toFixed(1)}s`;
  } else {
    cooldownEl.textContent = `破坚阵CD：就绪`;
  }


  // ---------- 左上角 HUD：耗时 & 失败次数 ----------
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial';
  let hudY = 24;

  let elapsedSec;
  if (state === 'ready' || roundStartTime === null) {
    elapsedSec = '0.00';
  } else if (elapsedAtCatch !== null) {
    elapsedSec = elapsedAtCatch.toFixed(2);
  } else {
    elapsedSec = ((now - roundStartTime) / 1000).toFixed(2);
  }

  ctx.fillText(`耗时：${elapsedSec}s`, 10, hudY);
  hudY += 22;
  ctx.fillText(`失败次数：${failureCount}`, 10, hudY);
  hudY += 22;

  // ---------- 失败提示（自动换行，短暂显示） ----------
  if (now - failureMessageTime <= FAILURE_MESSAGE_DURATION && failureMessage) {
    ctx.save();
    ctx.fillStyle = '#ffd080';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';

    const maxWidth = CANVAS_WIDTH * 0.7;
    const lineHeight = 26;
    const fx = CANVAS_WIDTH / 2;
    const fy = CANVAS_HEIGHT / 2 - rectH / 2 - 50;

    wrapText(ctx, failureMessage, fx, fy, maxWidth, lineHeight);
    ctx.restore();
  }
}

// ==================== 游戏循环 ====================
function loop(ms) {
  update(ms);
  draw();
  requestAnimationFrame(loop);
}

// ==================== 初始化 ====================
function init() {
  document.body.classList.add('noselect');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  startState('ready');
  requestAnimationFrame(loop);
}

window.addEventListener('load', init);
