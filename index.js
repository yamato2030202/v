const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const axios = require("axios");

// --- ⚙️ إعدادات النخبة ---
const DEVELOPER_NAME = "ELGRANDFT";
const GROQ_API_KEY = "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";

// تعيين منفذ وهمي لمنع Railway من إغلاق الحاوية (مهم جداً)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`🌍 السيرفر الوهمي يعمل على المنفذ: ${PORT}`));

let qrLink = null; // لتخزين الرابط

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
            // توليد الرابط وتخزينه
            qrLink = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`;
            console.log(`\n👉 الرابط المباشر: ${qrLink}\n`);
        }
        if (connection === 'open') {
            console.log(`\n✅ تم الاتصال بنجاح! نظام المطور عبد الصمد جاهز للرد.`);
            qrLink = null; // تصفير الرابط بعد نجاح الاتصال
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startAI();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();

        if (text) {
            console.log(`📩 رسالة جديدة من ${from}: ${text}`);
            try {
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
                await sock.sendMessage(from, { text: reply }, { quoted: msg });
                
            } catch (e) {
                console.log("❌ خطأ في معالجة الرد عبر API");
                await sock.sendMessage(from, { text: "⚠️ عذراً يا زعيم، واجهت مشكلة بسيطة في معالجة طلبك." });
            }
        }
    });
}

startAI();

// تكرار طباعة الرابط كل 10 ثوانٍ في الـ Logs حتى تمسحه ولا يختفي أبداً
setInterval(() => { 
    if (qrLink) {
        console.log(`\n🚨 انسخ الرابط من هنا سريعاً:\n${qrLink}\n`);
    } else {
        console.log("System Active & Waiting for connection...");
    }
}, 1000 * 10);
