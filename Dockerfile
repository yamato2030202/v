# استخدام نسخة مستقرة من نظام أوبونتو كنظام أساسي للسيرفر
FROM ubuntu:22.04

# تحديث حزم النظام وتثبيت الأدوات الأساسية (مثل بoptions،curl، و git)
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل داخل السيرفر الخاص بك
WORKDIR /app

# نسخ جميع ملفات مشروعك الحالية إلى داخل السيرفر
COPY . .

# تثبيت الاعتماديات الخاصة بمشروعك (إذا كنت تستخدم بايثون كمثال)
# RUN pip3 install -r requirements.txt

# تحديد المنفذ (Port) الذي سيستمع إليه السيرفر (Railway تطلب ذلك للمشاريع التي تحتاج ويب)
EXPOSE 8080

# الأمر الافتراضي لتشغيل سيرفرك أو تطبيقك (استبدله بملف التشغيل الخاص بك)
CMD ["python3", "main.py"]
