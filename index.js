const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const axios = require("axios");

// --- ⚙️ إعدادات النخبة ---
const DEVELOPER_NAME = "ELGRANDFT";
const GROQ_API_KEY = "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";

async function startAI() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log(`👉 الرابط: https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
        }
        if (connection === 'open') {
            console.log(`\n✅ تم الاتصال بنجاح! نظام المطور عبد الصمد جاهز للرد.`);
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startAI();
        }
    });

    // --- 🤖 الجزء المسؤول عن الرد (الذي كان ينقصك) ---
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return; // لا يرد على نفسه

        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();

        if (text) {
            console.log(`📩 رسالة جديدة من ${from}: ${text}`);
            try {
                // طلب الرد من ذكاء Groq الاصطناعي
                const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: `أنت مساعد ذكي مطورك هو العبقري ${DEVELOPER_NAME}. أجِب باحترافية وبسرعة.` },
                        { role: "user", content: text }
                    ]
                }, { 
                    headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } 
                });

                const reply = res.data.choices[0].message.content;
                
                // إرسال الرد للواتساب
                await sock.sendMessage(from, { text: reply }, { quoted: msg });
                
            } catch (e) {
                console.log("❌ خطأ في معالجة الرد عبر API");
                await sock.sendMessage(from, { text: "⚠️ عذراً يا زعيم، واجهت مشكلة بسيطة في معالجة طلبك." });
            }
        }
    });
}

startAI();

// نبض النظام
setInterval(() => { console.log("System Active & Waiting for messages..."); }, 1000 * 60 * 5);
