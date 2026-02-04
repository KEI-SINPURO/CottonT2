const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('audio');
const transcript = document.getElementById('transcript');
const startBtn = document.getElementById('startBtn');
const startOverlay = document.getElementById('startOverlay');

canvas.width = 400;
canvas.height = 400;

let animationId;
let startTime;
let isPlaying = false;
let audioContext;
let analyser;
let dataArray;
let source;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const numWaves = 180;

// 音声データベース - 各QRコードに対応する音声と字幕
const audioDatabase = {
    'cotton-white': {
        file: 'CottonT-AI.mp3',
        title: 'コットンシャツ（白）',
        transcripts: [
            { time: 0.1, text: "こちらはユニクロのコットン100％使用の半袖シャツです。" },
            { time: 4, text: "素材はハリ感のある、カジュアルなコットンで、肌ざわりがとても柔らかくて快適です。" },
            { time: 12, text: "シャツの生地は厚すぎず程よい厚みで、年間を通して着やすいです。" },
            { time: 18.5, text: "色は白に近い無地で、黒色の花柄模様が描かれています。" },
            { time: 24.5, text: "デザインはシンプルで、襟もついています。" },
            { time: 28, text: "そのため、きちんと感があります。" },
            { time: 31, text: "形はやや細身でスマートなシルエットですが、動きやすさも考えられています。" },
            { time: 37, text: "カジュアルな場面で着ることができる1着です。" }
        ]
    },
    'denim-blue': {
        file: 'denim-jacket.mp3',
        title: 'デニムジャケット（青）',
        transcripts: [
            { time: 0.1, text: "こちらはユニクロのデニムジャケットです。" },
            { time: 3, text: "素材は厚手のデニム生地で、耐久性に優れています。" },
            { time: 7, text: "色は深みのあるインディゴブルーです。" },
            { time: 10, text: "デザインはクラシックなGジャンスタイル。" },
            { time: 13, text: "胸ポケットが2つ、サイドポケットが2つ付いています。" },
            { time: 17, text: "金属ボタンが特徴的で、カジュアルな雰囲気を演出します。" },
            { time: 22, text: "春秋のアウターとして最適な1着です。" }
        ]
    },
    'polo-red': {
        file: 'polo-shirt.mp3',
        title: 'ポロシャツ（赤）',
        transcripts: [
            { time: 0.1, text: "こちらはユニクロのポロシャツです。" },
            { time: 3, text: "素材は吸汗速乾機能のあるポリエステル混紡です。" },
            { time: 7, text: "色は鮮やかなレッドで、元気な印象を与えます。" },
            { time: 11, text: "襟と袖口にリブ編みが施されています。" },
            { time: 15, text: "胸元には3つのボタンが付いています。" },
            { time: 18, text: "スポーツやアウトドアに最適な機能性です。" },
            { time: 22, text: "カジュアルからビジネスカジュアルまで幅広く使える1着です。" }
        ]
    },
    'sweater-gray': {
        file: 'sweater.mp3',
        title: 'セーター（グレー）',
        transcripts: [
            { time: 0.1, text: "こちらはユニクロのウールセーターです。" },
            { time: 3, text: "素材は上質なメリノウール100％です。" },
            { time: 7, text: "色は落ち着いたライトグレーです。" },
            { time: 10, text: "首元はクルーネックで、シンプルなデザインです。" },
            { time: 14, text: "編み目は細かく、滑らかな手触りです。" },
            { time: 18, text: "保温性に優れ、秋冬に活躍します。" },
            { time: 22, text: "ビジネスからカジュアルまで対応できる万能な1着です。" }
        ]
    },
    'tshirt-black': {
        file: 'tshirt.mp3',
        title: 'Tシャツ（黒）',
        transcripts: [
            { time: 0.1, text: "こちらはユニクロのベーシックTシャツです。" },
            { time: 3, text: "素材は柔らかいコットン100％です。" },
            { time: 6, text: "色は定番のブラックで、どんなコーディネートにも合わせやすいです。" },
            { time: 11, text: "首元は丈夫なリブ編みクルーネックです。" },
            { time: 15, text: "シルエットはレギュラーフィットで、快適な着心地です。" },
            { time: 19, text: "インナーとしても1枚でも着られる定番アイテムです。" }
        ]
    },
    // デモ用（音声ファイルがない場合）
    'demo': {
        file: null,
        title: 'デモ音声',
        transcripts: [
            { time: 0.1, text: "これはデモンストレーションです。" },
            { time: 3, text: "実際の音声ファイルを追加してください。" }
        ]
    }
};

let currentTranscriptData = [];
let currentTranscriptIndex = -1;
let currentAudioId = null;

// URLパラメータから音声IDを取得
function getAudioIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 'demo';
}

// 音声データを読み込む
function loadAudioData(audioId) {
    currentAudioId = audioId;
    const audioData = audioDatabase[audioId];
    
    if (!audioData) {
        console.error('音声データが見つかりません:', audioId);
        // デフォルトのデモ音声を使用
        currentTranscriptData = audioDatabase['demo'].transcripts;
        startBtn.textContent = '音声ファイルが見つかりません';
        return false;
    }
    
    currentTranscriptData = audioData.transcripts;
    
    // タイトルを表示
    if (document.getElementById('btnText')) {
        document.getElementById('btnText').textContent = audioData.title;
    }
    
    // 音声ファイルを設定
    if (audioData.file) {
        const source = audio.querySelector('source');
        if (source) {
            source.src = audioData.file;
            audio.load();
            console.log('音声ファイル読み込み:', audioData.file);
        }
        return true;
    } else {
        console.warn('音声ファイルが設定されていません');
        startBtn.textContent = 'タップして開始（音声なし）';
        return false;
    }
}

function initAudioAnalyser() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function updateTranscript() {
    const currentTime = audio.currentTime;
    
    if (currentTime < 0.1 && currentTranscriptIndex === -1) {
        if (currentTranscriptData.length > 0) {
            currentTranscriptIndex = 0;
            transcript.textContent = currentTranscriptData[0].text;
            transcript.classList.add('active');
        }
        return;
    }
    
    for (let i = currentTranscriptData.length - 1; i >= 0; i--) {
        if (currentTime >= currentTranscriptData[i].time) {
            if (currentTranscriptIndex !== i) {
                currentTranscriptIndex = i;
                transcript.textContent = currentTranscriptData[i].text;
                transcript.classList.add('active');
            }
            break;
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(10, 10, 20, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();
    const time = (now - startTime) / 1000;

    let avgAudio = 0;
    if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 40; i++) {
            sum += dataArray[i];
        }
        avgAudio = sum / 40 / 255;
    }

    const layers = [
        { color: [255, 120, 180], radius: 120, speed: 0.5, offset: 0 },
        { color: [120, 200, 255], radius: 135, speed: -0.4, offset: 0.5 },
        { color: [180, 140, 255], radius: 110, speed: 0.6, offset: 1.0 }
    ];

    layers.forEach((layer) => {
        const rotation = time * layer.speed;
        
        ctx.beginPath();
        
        for (let i = 0; i <= numWaves; i++) {
            const angle = (i / numWaves) * Math.PI * 2 + rotation;
            
            let dataValue = 0;
            if (isPlaying && analyser) {
                const dataIndex = Math.floor((i / numWaves) * dataArray.length);
                dataValue = dataArray[dataIndex] / 255;
            }
            
            const wave1 = Math.sin(angle * 3 + time * 4 + layer.offset) * (8 + dataValue * 12);
            const wave2 = Math.cos(angle * 5 - time * 3) * (5 + dataValue * 8);
            const pulse = Math.sin(time * 2) * (6 + avgAudio * 15);
            
            const distance = layer.radius + wave1 + wave2 + pulse;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, layer.radius + 60
        );
        
        const alpha = 0.2 + Math.sin(time * 2 + layer.offset) * 0.03 + (isPlaying ? avgAudio * 0.15 : 0);
        gradient.addColorStop(0, `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, ${alpha + 0.1})`);
        gradient.addColorStop(0.5, `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, ${0.3 + alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, 0.5)`;
        ctx.stroke();
    });

    ctx.shadowBlur = 0;

    const coreSize = 40 + Math.sin(time * 6) * 15 + (isPlaying ? avgAudio * 25 : 0);
    const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize
    );
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    coreGradient.addColorStop(0.3, 'rgba(255, 200, 255, 0.6)');
    coreGradient.addColorStop(0.6, 'rgba(200, 220, 255, 0.3)');
    coreGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    
    ctx.shadowBlur = 0;

    if (isPlaying) {
        updateTranscript();
    }

    animationId = requestAnimationFrame(animate);
}

function startAudio() {
    if (!audioContext) {
        initAudioAnalyser();
    }
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    audio.play().then(() => {
        isPlaying = true;
        startTime = Date.now();
        startOverlay.classList.add('hidden');
        console.log('音声再生開始:', currentAudioId);
    }).catch(err => {
        console.error('音声再生エラー:', err);
        alert('音声の再生に失敗しました。音声ファイルを確認してください。');
        startOverlay.classList.add('hidden');
    });
}

audio.addEventListener('ended', () => {
    isPlaying = false;
    transcript.classList.remove('active');
});

startOverlay.addEventListener('click', startAudio);
startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startAudio();
});

startTime = Date.now();
animate();

// ページ読み込み時に音声データを設定
window.addEventListener('DOMContentLoaded', () => {
    const audioId = getAudioIdFromURL();
    console.log('音声ID:', audioId);
    
    const loaded = loadAudioData(audioId);
    
    const urlParams = new URLSearchParams(window.location.search);
    const autoplay = urlParams.get('autoplay');
    
    if (autoplay === 'true' && loaded) {
        console.log('自動再生を試行します');
        
        let attemptCount = 0;
        const maxAttempts = 3;
        
        function attemptAutoplay() {
            attemptCount++;
            console.log(`自動再生試行 ${attemptCount}/${maxAttempts}`);
            
            if (!audioContext) {
                try {
                    initAudioAnalyser();
                } catch (err) {
                    console.error('AudioContext初期化エラー:', err);
                }
            }
            
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            audio.play().then(() => {
                console.log('自動再生成功！');
                isPlaying = true;
                startTime = Date.now();
                startOverlay.classList.add('hidden');
            }).catch(err => {
                console.error(`自動再生失敗 (試行${attemptCount}):`, err);
                
                if (attemptCount < maxAttempts) {
                    setTimeout(attemptAutoplay, 500);
                } else {
                    console.log('自動再生に失敗しました。ボタンを表示します。');
                    startBtn.style.animation = 'pulse 2s infinite';
                }
            });
        }
        
        setTimeout(attemptAutoplay, 100);
    }
});

// デバッグ用：利用可能な音声IDを表示
console.log('利用可能な音声ID:', Object.keys(audioDatabase));

const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        50% {
            transform: translate(-50%, -50%) scale(1.05);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
        }
    }
`;
document.head.appendChild(style);
