'use client';

import { Button, Card, Input } from '@heroui/react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">HeroUI v3 Forms</h1>
          <p className="text-gray-600">مكتبة HeroUI v3 مع مكونات تفاعلية</p>
        </div>

        {/* Card with Form Components */}
        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            {/* Input Example */}
            <div>
              <label className="block text-sm font-medium mb-2">اسم المستخدم</label>
              <Input
                type="text"
                placeholder="أدخل اسم المستخدم"
                className="w-full"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
              <Input
                type="email"
                placeholder="example@example.com"
                className="w-full"
              />
            </div>

            {/* Select Example */}
            <div>
              <label className="block text-sm font-medium mb-2">الفئة</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر فئة</option>
                <option value="category1">فئة 1</option>
                <option value="category2">فئة 2</option>
                <option value="category3">فئة 3</option>
              </select>
            </div>

            {/* Textarea Example */}
            <div>
              <label className="block text-sm font-medium mb-2">الرسالة</label>
              <textarea
                placeholder="أدخل رسالتك هنا"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button color="primary" className="flex-1">
                إرسال
              </Button>
              <Button variant="bordered" className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        </Card>

        {/* Components Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">مكونات متاحة</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Buttons</h3>
              <p className="text-sm text-gray-600">أزرار بأنماط مختلفة</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Inputs</h3>
              <p className="text-sm text-gray-600">حقول إدخال متقدمة</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Forms</h3>
              <p className="text-sm text-gray-600">نماذج كاملة</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Modals</h3>
              <p className="text-sm text-gray-600">نوافذ منبثقة</p>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
