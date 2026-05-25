import http.server
import socketserver
import os

# Railway تقوم بتعيين المنفذ تلقائياً عبر متغير البيئة PORT
PORT = int(os.environ.get("PORT", 8080))

Handler = http.server.SimpleHTTPRequestHandler

print(f"السيرفر الوهمي يعمل الآن بنجاح على المنفذ: {PORT}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
