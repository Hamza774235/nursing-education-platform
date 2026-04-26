import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean as mysqlBoolean } from "drizzle-orm/mysql-core";
import dotenv from "dotenv";
dotenv.config();

// Re-define schema inline for the seed script
const sections = mysqlTable("sections", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  titleAr: varchar("titleAr", { length: 200 }).notNull(),
  titleEn: varchar("titleEn", { length: 200 }),
  descriptionAr: text("descriptionAr"),
  descriptionEn: text("descriptionEn"),
  icon: varchar("icon", { length: 100 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  titleAr: varchar("titleAr", { length: 300 }).notNull(),
  titleEn: varchar("titleEn", { length: 300 }),
  contentAr: text("contentAr").notNull(),
  contentEn: text("contentEn"),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPublished: mysqlBoolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  titleAr: varchar("titleAr", { length: 300 }).notNull(),
  titleEn: varchar("titleEn", { length: 300 }),
  passingScore: int("passingScore").default(60).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  questionAr: text("questionAr").notNull(),
  questionEn: text("questionEn"),
  optionAAr: varchar("optionAAr", { length: 500 }).notNull(),
  optionBAr: varchar("optionBAr", { length: 500 }).notNull(),
  optionCAr: varchar("optionCAr", { length: 500 }).notNull(),
  optionDAr: varchar("optionDAr", { length: 500 }).notNull(),
  optionAEn: varchar("optionAEn", { length: 500 }),
  optionBEn: varchar("optionBEn", { length: 500 }),
  optionCEn: varchar("optionCEn", { length: 500 }),
  optionDEn: varchar("optionDEn", { length: 500 }),
  correctOption: mysqlEnum("correctOption", ["A", "B", "C", "D"]).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 بدء إضافة البيانات التعليمية...");

  // ==================== الأقسام الخمسة ====================
  const sectionData = [
    {
      slug: "assessment",
      titleAr: "تقييم المريض",
      titleEn: "Patient Assessment",
      descriptionAr: "تعلم كيفية إجراء تقييم شامل للمريض من الرأس إلى القدم، بما في ذلك التقييم الجسدي والنفسي والاجتماعي",
      descriptionEn: "Learn how to perform a comprehensive head-to-toe patient assessment",
      icon: "ClipboardCheck",
      sortOrder: 1,
    },
    {
      slug: "procedures",
      titleAr: "الإجراءات التمريضية",
      titleEn: "Nursing Procedures",
      descriptionAr: "دليل شامل للإجراءات التمريضية الأساسية والمتقدمة مع الخطوات التفصيلية",
      descriptionEn: "Comprehensive guide to basic and advanced nursing procedures",
      icon: "Stethoscope",
      sortOrder: 2,
    },
    {
      slug: "medication",
      titleAr: "إعطاء الأدوية",
      titleEn: "Medication Administration",
      descriptionAr: "تعلم الطرق الصحيحة لإعطاء الأدوية بأمان وفعالية مع مراعاة الحقوق الخمسة",
      descriptionEn: "Learn safe and effective medication administration techniques",
      icon: "Pill",
      sortOrder: 3,
    },
    {
      slug: "vital-signs",
      titleAr: "العلامات الحيوية",
      titleEn: "Vital Signs",
      descriptionAr: "إتقان قياس وتفسير العلامات الحيوية: الضغط، النبض، الحرارة، التنفس، والأكسجين",
      descriptionEn: "Master measuring and interpreting vital signs",
      icon: "HeartPulse",
      sortOrder: 4,
    },
    {
      slug: "documentation",
      titleAr: "التوثيق التمريضي",
      titleEn: "Nursing Documentation",
      descriptionAr: "أساسيات التوثيق التمريضي الصحيح باستخدام الأنظمة المعتمدة عالمياً",
      descriptionEn: "Fundamentals of proper nursing documentation",
      icon: "FileText",
      sortOrder: 5,
    },
  ];

  // Insert sections
  const sectionIds = [];
  for (const s of sectionData) {
    try {
      const result = await db.insert(sections).values(s);
      sectionIds.push(result[0].insertId);
      console.log(`✅ قسم: ${s.titleAr} (ID: ${result[0].insertId})`);
    } catch (e) {
      // If already exists, get the id
      const existing = await db.select().from(sections).where(eq(sections.slug, s.slug)).limit(1);
      if (existing.length > 0) {
        sectionIds.push(existing[0].id);
        console.log(`⏩ قسم موجود: ${s.titleAr} (ID: ${existing[0].id})`);
      }
    }
  }

  // ==================== الدروس ====================
  const lessonsData = [
    // ===== القسم 1: تقييم المريض =====
    {
      sectionId: sectionIds[0],
      slug: "head-to-toe-assessment",
      titleAr: "التقييم الشامل من الرأس إلى القدم",
      contentAr: `# التقييم الشامل من الرأس إلى القدم (Head to Toe Assessment)

## مقدمة
التقييم الشامل من الرأس إلى القدم هو أحد أهم المهارات التمريضية الأساسية. يتم إجراؤه عند دخول المريض للمستشفى أو في بداية كل نوبة عمل.

## خطوات التقييم

### 1. التقييم العام (General Survey)
- **المظهر العام**: هل المريض يبدو مرتاحاً أم يعاني من ألم؟
- **مستوى الوعي**: استخدام مقياس غلاسكو (GCS) لتقييم الوعي
- **الحالة التغذوية**: هل يبدو المريض بوزن طبيعي؟
- **النظافة الشخصية**: مؤشر على القدرة على العناية بالنفس

### 2. تقييم الرأس والوجه
- **فحص فروة الرأس**: البحث عن أي إصابات أو تورمات
- **فحص العينين**: حجم البؤبؤ، رد الفعل للضوء (PERRLA)
- **فحص الأذنين**: وجود إفرازات أو ألم
- **فحص الأنف**: سلامة الحاجز الأنفي
- **فحص الفم والحلق**: حالة الأغشية المخاطية واللسان

### 3. تقييم الرقبة
- **الغدد الليمفاوية**: فحص التضخم
- **الغدة الدرقية**: الحجم والتماثل
- **الأوردة الوداجية**: تقييم الامتلاء (JVD)
- **حركة الرقبة**: المدى الطبيعي للحركة

### 4. تقييم الصدر والرئتين
- **التنفس**: المعدل، العمق، النمط
- **التسمع**: أصوات التنفس الطبيعية وغير الطبيعية
- **القرع**: تقييم الرنين
- **التماثل**: حركة جدار الصدر

### 5. تقييم القلب والأوعية الدموية
- **أصوات القلب**: S1, S2 والأصوات الإضافية
- **النبض المحيطي**: القوة والانتظام
- **الضغط الشعيري**: وقت إعادة الامتلاء (CRT)
- **الوذمة**: فحص الأطراف السفلية

### 6. تقييم البطن
- **التسمع**: أصوات الأمعاء (قبل الجس)
- **الجس**: الألم، التضخم، الكتل
- **القرع**: تقييم الأعضاء
- **الفحص البصري**: الانتفاخ، الندبات

### 7. تقييم الأطراف
- **الحركة**: مدى الحركة في المفاصل
- **القوة العضلية**: مقياس 0-5
- **الإحساس**: اللمس، الألم، الحرارة
- **الدورة الدموية**: اللون، الحرارة، النبض

## نصائح مهمة
- اغسل يديك قبل وبعد الفحص
- احترم خصوصية المريض
- اشرح كل خطوة للمريض قبل إجرائها
- وثّق جميع النتائج بدقة`,
      sortOrder: 1,
      isPublished: true,
    },
    {
      sectionId: sectionIds[0],
      slug: "focused-assessment",
      titleAr: "التقييم المركّز حسب الشكوى",
      contentAr: `# التقييم المركّز حسب الشكوى (Focused Assessment)

## مقدمة
التقييم المركّز يختلف عن التقييم الشامل بأنه يركز على منطقة محددة بناءً على شكوى المريض الرئيسية.

## متى نستخدم التقييم المركّز؟
- عند وجود شكوى محددة من المريض
- أثناء المتابعة الدورية لحالة معروفة
- في حالات الطوارئ التي تتطلب تقييماً سريعاً

## منهجية OPQRST لتقييم الألم

### O - Onset (البداية)
- متى بدأ الألم؟
- هل بدأ فجأة أم تدريجياً؟

### P - Provocation/Palliation (المحفزات والمخففات)
- ما الذي يزيد الألم؟
- ما الذي يخفف الألم؟

### Q - Quality (النوعية)
- كيف تصف الألم؟ (حاد، ضاغط، حارق، نابض)

### R - Region/Radiation (المنطقة والانتشار)
- أين يوجد الألم بالضبط؟
- هل ينتشر إلى مناطق أخرى؟

### S - Severity (الشدة)
- على مقياس 0-10، ما شدة الألم؟

### T - Time (الوقت)
- منذ متى والألم موجود؟
- هل هو مستمر أم متقطع؟

## أمثلة على التقييم المركّز

### مريض يشكو من ألم في الصدر
1. تقييم القلب والأوعية الدموية بالتفصيل
2. قياس العلامات الحيوية
3. تخطيط القلب (ECG)
4. تقييم الألم باستخدام OPQRST
5. فحص أصوات الرئة

### مريض يشكو من صعوبة التنفس
1. تقييم الجهاز التنفسي بالتفصيل
2. قياس تشبع الأكسجين (SpO2)
3. تقييم معدل وعمق التنفس
4. تسمع أصوات الرئة
5. فحص استخدام العضلات المساعدة

## التوثيق
- سجّل الشكوى الرئيسية بكلمات المريض
- وثّق نتائج التقييم بالتفصيل
- قارن مع التقييمات السابقة
- أبلغ الطبيب عن أي تغييرات مهمة`,
      sortOrder: 2,
      isPublished: true,
    },

    // ===== القسم 2: الإجراءات التمريضية =====
    {
      sectionId: sectionIds[1],
      slug: "iv-cannulation",
      titleAr: "تركيب الكانيولا الوريدية",
      contentAr: `# تركيب الكانيولا الوريدية (IV Cannulation)

## مقدمة
تركيب الكانيولا الوريدية من أهم الإجراءات التمريضية وأكثرها شيوعاً. يتطلب مهارة ودقة لضمان سلامة المريض.

## المعدات المطلوبة
- كانيولا بالحجم المناسب (18G, 20G, 22G, 24G)
- تورنيكيه (رباط ضاغط)
- مسحات كحولية أو كلورهيكسيدين
- شاش معقم
- لاصق شفاف (Tegaderm)
- قفازات معقمة
- حوض كلوي
- محلول ملحي للتنظيف

## اختيار حجم الكانيولا

| الحجم | اللون | الاستخدام |
|-------|-------|-----------|
| 14G | برتقالي | نقل الدم الطارئ، الصدمات |
| 16G | رمادي | الجراحة، نقل الدم |
| 18G | أخضر | نقل الدم، السوائل |
| 20G | وردي | الاستخدام العام |
| 22G | أزرق | الأطفال، كبار السن |
| 24G | أصفر | الأطفال الرضع |

## خطوات التركيب

### 1. التحضير
- تحقق من هوية المريض
- اشرح الإجراء للمريض واحصل على موافقته
- اغسل يديك جيداً
- جهّز جميع المعدات

### 2. اختيار الموقع
- ابدأ بالأوردة البعيدة (ظهر اليد)
- تجنب مناطق المفاصل
- تجنب الطرف المصاب أو المتورم
- تجنب الطرف الذي فيه ناسور (لمرضى الغسيل)

### 3. التنفيذ
1. ضع التورنيكيه فوق الموقع بـ 10-15 سم
2. اطلب من المريض قبض يده
3. نظّف الموقع بحركة دائرية من المركز للخارج
4. انتظر حتى يجف المطهر
5. أمسك الكانيولا بزاوية 15-30 درجة
6. ادخل الإبرة حتى يظهر الدم في الحجرة
7. ادفع الكانيولا للأمام واسحب الإبرة
8. أزل التورنيكيه
9. وصّل المحلول أو الغطاء
10. ثبّت بالشاش الشفاف

### 4. التوثيق
- تاريخ ووقت التركيب
- حجم الكانيولا ونوعها
- موقع التركيب
- عدد المحاولات
- استجابة المريض

## المضاعفات المحتملة
- **التسرب (Infiltration)**: تورم وبرودة حول الموقع
- **التهاب الوريد (Phlebitis)**: احمرار وألم على طول الوريد
- **العدوى**: احمرار وإفرازات من الموقع
- **الورم الدموي (Hematoma)**: تجمع دموي تحت الجلد

## متى يجب تغيير الكانيولا؟
- كل 72-96 ساعة حسب سياسة المستشفى
- عند ظهور أي علامات مضاعفات
- عند انسداد الكانيولا`,
      sortOrder: 1,
      isPublished: true,
    },
    {
      sectionId: sectionIds[1],
      slug: "wound-care",
      titleAr: "العناية بالجروح وتغيير الضمادات",
      contentAr: `# العناية بالجروح وتغيير الضمادات (Wound Care)

## مقدمة
العناية بالجروح من المهارات الأساسية في التمريض. الهدف هو تعزيز الشفاء ومنع العدوى.

## أنواع الجروح

### حسب طريقة الحدوث
- **الجروح الجراحية**: نظيفة ومنتظمة
- **الجروح الرضحية**: ناتجة عن إصابة
- **قرح الضغط**: ناتجة عن الضغط المستمر
- **الحروق**: ناتجة عن الحرارة أو المواد الكيميائية

### حسب نوع الشفاء
- **الشفاء بالقصد الأول**: الجرح مغلق بالخياطة
- **الشفاء بالقصد الثاني**: الجرح مفتوح يشفى تدريجياً
- **الشفاء بالقصد الثالث**: إغلاق متأخر بعد السيطرة على العدوى

## تقييم الجرح
عند تقييم الجرح، سجّل:
- **الموقع**: أين يقع الجرح بالتحديد
- **الحجم**: الطول × العرض × العمق (بالسنتيمتر)
- **قاعدة الجرح**: لون النسيج (أحمر = حبيبي، أصفر = ليفي، أسود = نخري)
- **الحواف**: منتظمة أم غير منتظمة
- **الإفرازات**: الكمية، اللون، الرائحة
- **الجلد المحيط**: احمرار، تورم، حرارة

## خطوات تغيير الضمادة

### التحضير
1. اغسل يديك
2. جهّز المعدات: قفازات معقمة، شاش معقم، محلول تنظيف، ضمادة جديدة، لاصق
3. اشرح الإجراء للمريض
4. وفّر الخصوصية

### التنفيذ
1. البس قفازات نظيفة
2. أزل الضمادة القديمة برفق
3. قيّم الجرح والإفرازات
4. اخلع القفازات النظيفة
5. البس قفازات معقمة
6. نظّف الجرح من المركز للخارج
7. جفف المنطقة المحيطة
8. ضع الضمادة المناسبة
9. ثبّت بالشكل المناسب
10. تخلص من المواد المستخدمة بشكل آمن

### التوثيق
- حالة الجرح (الحجم، اللون، الإفرازات)
- نوع التنظيف المستخدم
- نوع الضمادة الجديدة
- استجابة المريض
- أي تغييرات عن التقييم السابق

## أنواع الضمادات
- **الشاش**: للجروح العامة
- **الضمادات الشفافة**: للمراقبة المستمرة
- **ضمادات الهيدروجيل**: للجروح الجافة
- **ضمادات الألجينات**: للجروح كثيرة الإفرازات
- **ضمادات الفوم**: للحماية والامتصاص`,
      sortOrder: 2,
      isPublished: true,
    },

    // ===== القسم 3: إعطاء الأدوية =====
    {
      sectionId: sectionIds[2],
      slug: "five-rights",
      titleAr: "الحقوق الخمسة لإعطاء الأدوية",
      contentAr: `# الحقوق الخمسة لإعطاء الأدوية (5 Rights of Medication Administration)

## مقدمة
الحقوق الخمسة هي القاعدة الذهبية في إعطاء الأدوية. يجب التحقق منها في كل مرة يتم فيها إعطاء دواء للمريض.

## الحقوق الخمسة

### 1. المريض الصحيح (Right Patient)
- تحقق من هوية المريض باستخدام **طريقتين** على الأقل:
  - سوار المعصم (ID Band)
  - سؤال المريض عن اسمه الكامل
  - رقم الملف الطبي
- **لا تعتمد** على رقم الغرفة أو السرير فقط

### 2. الدواء الصحيح (Right Drug)
- تحقق من اسم الدواء على الوصفة الطبية
- قارن مع ملصق الدواء **ثلاث مرات**:
  1. عند أخذ الدواء من الخزانة
  2. عند تحضير الدواء
  3. قبل إعطاء الدواء للمريض
- تأكد من عدم وجود حساسية

### 3. الجرعة الصحيحة (Right Dose)
- تحقق من الجرعة الموصوفة
- احسب الجرعة بدقة إذا لزم الأمر
- استخدم أدوات القياس المناسبة
- تحقق مرتين من حساباتك

### 4. الطريق الصحيح (Right Route)
- تحقق من طريقة الإعطاء الموصوفة:
  - **PO**: عن طريق الفم
  - **IV**: وريدياً
  - **IM**: عضلياً
  - **SC/SQ**: تحت الجلد
  - **SL**: تحت اللسان
  - **PR**: شرجياً
  - **Topical**: موضعياً

### 5. الوقت الصحيح (Right Time)
- أعطِ الدواء في الوقت المحدد
- المدى المقبول عادة ± 30 دقيقة
- بعض الأدوية لها توقيت صارم (مثل الأنسولين)

## الحقوق الإضافية (الموسعة)

### 6. التوثيق الصحيح (Right Documentation)
- سجّل فوراً بعد الإعطاء
- لا تسجّل قبل الإعطاء أبداً

### 7. السبب الصحيح (Right Reason)
- افهم لماذا يأخذ المريض هذا الدواء

### 8. الاستجابة الصحيحة (Right Response)
- راقب المريض بعد إعطاء الدواء
- تحقق من فعالية الدواء
- راقب الأعراض الجانبية

### 9. حق الرفض (Right to Refuse)
- للمريض الحق في رفض أي دواء
- وثّق الرفض وأبلغ الطبيب

## أخطاء الدواء الشائعة
- إعطاء الدواء لمريض خاطئ
- جرعة خاطئة (خاصة في الأطفال)
- طريق إعطاء خاطئ
- تفاعلات دوائية لم يتم التحقق منها
- عدم التحقق من الحساسية`,
      sortOrder: 1,
      isPublished: true,
    },
    {
      sectionId: sectionIds[2],
      slug: "injection-techniques",
      titleAr: "تقنيات الحقن (عضلي، وريدي، تحت الجلد)",
      contentAr: `# تقنيات الحقن (Injection Techniques)

## مقدمة
إعطاء الحقن من المهارات الأساسية للممرض. كل طريقة لها خصائصها ومواقعها المحددة.

## 1. الحقن العضلي (Intramuscular - IM)

### المواقع المعتمدة
- **العضلة الدالية (Deltoid)**: للبالغين، كمية صغيرة (حتى 1 مل)
- **العضلة الألوية الظهرية (Dorsogluteal)**: كمية كبيرة (حتى 5 مل)
- **العضلة الألوية البطنية (Ventrogluteal)**: الموقع المفضل للبالغين
- **العضلة الرباعية الأمامية (Vastus Lateralis)**: للأطفال والرضع

### تقنية الحقن العضلي
1. اختر الموقع المناسب
2. نظّف الموقع بحركة دائرية
3. أمسك العضلة بإحكام
4. ادخل الإبرة بزاوية **90 درجة**
5. اسحب المكبس للتأكد من عدم وجود دم
6. احقن الدواء ببطء
7. اسحب الإبرة بسرعة
8. اضغط بالشاش

### حجم الإبرة
- البالغون: 21-23 gauge، طول 1-1.5 بوصة
- الأطفال: 22-25 gauge، طول 0.5-1 بوصة

## 2. الحقن تحت الجلد (Subcutaneous - SC)

### المواقع المعتمدة
- البطن (حول السرة، بعيداً 5 سم)
- الجزء الخارجي من الذراع
- الفخذ الأمامي
- أعلى الظهر

### تقنية الحقن تحت الجلد
1. نظّف الموقع
2. اقرص الجلد برفق
3. ادخل الإبرة بزاوية **45 درجة**
4. احقن الدواء ببطء
5. اسحب الإبرة
6. لا تدلك الموقع (خاصة مع الهيبارين)

### أمثلة على أدوية SC
- الأنسولين
- الهيبارين (مميع الدم)
- لقاحات معينة

## 3. الحقن الوريدي (Intravenous - IV)

### أنواع الإعطاء الوريدي
- **IV Push (Bolus)**: حقن مباشر وسريع
- **IV Piggyback**: عبر كيس صغير مع المحلول
- **IV Drip**: تسريب مستمر

### خطوات IV Push
1. تحقق من توافق الدواء مع المحلول
2. نظّف منفذ الكانيولا
3. احقن ببطء حسب توصيات الدواء
4. اغسل بمحلول ملحي بعد الحقن

### احتياطات مهمة
- تحقق من سلامة الكانيولا قبل الحقن
- راقب موقع الحقن أثناء الإعطاء
- تحقق من سرعة الإعطاء الموصى بها
- راقب المريض لأي ردود فعل

## السلامة العامة
- استخدم إبرة جديدة لكل حقنة
- تخلص من الإبر في حاوية الأدوات الحادة
- لا تعيد تغطية الإبرة أبداً
- اغسل يديك قبل وبعد الإجراء`,
      sortOrder: 2,
      isPublished: true,
    },

    // ===== القسم 4: العلامات الحيوية =====
    {
      sectionId: sectionIds[3],
      slug: "blood-pressure",
      titleAr: "قياس ضغط الدم",
      contentAr: `# قياس ضغط الدم (Blood Pressure Measurement)

## مقدمة
ضغط الدم هو القوة التي يمارسها الدم على جدران الأوعية الدموية. يُعبّر عنه برقمين: الانقباضي (Systolic) والانبساطي (Diastolic).

## القيم الطبيعية

| التصنيف | الانقباضي (mmHg) | الانبساطي (mmHg) |
|---------|-------------------|-------------------|
| طبيعي | أقل من 120 | أقل من 80 |
| مرتفع | 120-129 | أقل من 80 |
| ارتفاع المرحلة 1 | 130-139 | 80-89 |
| ارتفاع المرحلة 2 | 140 أو أكثر | 90 أو أكثر |
| أزمة ارتفاع | أكثر من 180 | أكثر من 120 |

## المعدات
- جهاز قياس الضغط (Sphygmomanometer)
- سماعة طبية (Stethoscope)
- كفة بالحجم المناسب

## اختيار حجم الكفة الصحيح
- يجب أن تغطي الكفة **80%** من محيط الذراع
- كفة صغيرة = قراءة أعلى من الحقيقية
- كفة كبيرة = قراءة أقل من الحقيقية

## خطوات القياس اليدوي

### التحضير
1. اجعل المريض يجلس مرتاحاً لمدة 5 دقائق
2. تأكد من عدم تناول كافيين أو تدخين خلال 30 دقيقة
3. الذراع على مستوى القلب
4. اكشف الذراع (لا تقيس فوق الملابس)

### القياس
1. ضع الكفة فوق المرفق بـ 2-3 سم
2. حدد موقع الشريان العضدي (Brachial Artery)
3. ضع السماعة على الشريان
4. انفخ الكفة حتى 180-200 mmHg
5. افرغ الهواء ببطء (2-3 mmHg/ثانية)
6. سجّل أول صوت = **الانقباضي**
7. سجّل اختفاء الصوت = **الانبساطي**

## حالات خاصة
- **فرق بين الذراعين**: إذا كان الفرق أكثر من 10 mmHg، أبلغ الطبيب
- **انخفاض الضغط الوضعي**: قس أثناء الاستلقاء والجلوس والوقوف
- **الأطفال**: استخدم كفة مناسبة للحجم

## متى يجب إبلاغ الطبيب فوراً؟
- ضغط انقباضي أقل من 90 أو أكثر من 180
- ضغط انبساطي أقل من 60 أو أكثر من 120
- تغير مفاجئ عن القراءات السابقة`,
      sortOrder: 1,
      isPublished: true,
    },
    {
      sectionId: sectionIds[3],
      slug: "temperature-pulse-respiration",
      titleAr: "قياس الحرارة والنبض والتنفس",
      contentAr: `# قياس الحرارة والنبض والتنفس (TPR)

## أولاً: قياس الحرارة (Temperature)

### القيم الطبيعية
- **الفم**: 36.5 - 37.5 °C
- **الإبط**: 36.0 - 37.0 °C
- **الشرج**: 37.0 - 38.0 °C
- **الأذن**: 36.5 - 37.5 °C
- **الجبهة**: 36.0 - 37.0 °C

### مواقع القياس
| الموقع | الدقة | الاستخدام |
|--------|-------|-----------|
| الفم | عالية | البالغون المتعاونون |
| الإبط | متوسطة | الأطفال، حالات عامة |
| الشرج | الأعلى | الأطفال الرضع، الحالات الحرجة |
| الأذن | عالية | سريع وسهل |
| الجبهة | متوسطة | الفحص السريع |

### تصنيف الحرارة
- **انخفاض الحرارة**: أقل من 36 °C
- **طبيعي**: 36.5 - 37.5 °C
- **حمى خفيفة**: 37.6 - 38.0 °C
- **حمى متوسطة**: 38.1 - 39.0 °C
- **حمى عالية**: 39.1 - 40.0 °C
- **حمى خطيرة**: أكثر من 40 °C

## ثانياً: قياس النبض (Pulse)

### القيم الطبيعية حسب العمر
| الفئة العمرية | المعدل الطبيعي (نبضة/دقيقة) |
|---------------|------------------------------|
| حديث الولادة | 120-160 |
| الرضيع | 100-140 |
| الطفل (1-5 سنوات) | 80-120 |
| الطفل (6-12 سنة) | 70-110 |
| البالغ | 60-100 |
| كبار السن | 60-100 |

### مواقع قياس النبض
- **الشريان الكعبري (Radial)**: الأكثر شيوعاً
- **الشريان السباتي (Carotid)**: في الطوارئ
- **الشريان العضدي (Brachial)**: للأطفال
- **الشريان الفخذي (Femoral)**: الحالات الحرجة

### خطوات القياس
1. استخدم إصبعي السبابة والوسطى (ليس الإبهام)
2. اضغط برفق على الشريان
3. عدّ النبضات لمدة **60 ثانية كاملة**
4. سجّل: المعدل، الانتظام، القوة

## ثالثاً: قياس التنفس (Respiration)

### القيم الطبيعية
| الفئة العمرية | المعدل الطبيعي (نفس/دقيقة) |
|---------------|------------------------------|
| حديث الولادة | 30-60 |
| الرضيع | 25-50 |
| الطفل | 20-30 |
| البالغ | 12-20 |

### خطوات القياس
1. **لا تخبر المريض** أنك تقيس تنفسه (يتغير لا إرادياً)
2. قسه مباشرة بعد قياس النبض
3. راقب ارتفاع وانخفاض الصدر
4. عدّ لمدة **60 ثانية كاملة**
5. سجّل: المعدل، العمق، النمط، الانتظام

### أنماط التنفس غير الطبيعية
- **تسرع التنفس (Tachypnea)**: أكثر من 20/دقيقة
- **بطء التنفس (Bradypnea)**: أقل من 12/دقيقة
- **ضيق التنفس (Dyspnea)**: صعوبة في التنفس
- **تنفس كوسماول (Kussmaul)**: عميق وسريع (الحماض)
- **تنفس شاين-ستوكس (Cheyne-Stokes)**: متزايد ثم متناقص`,
      sortOrder: 2,
      isPublished: true,
    },

    // ===== القسم 5: التوثيق التمريضي =====
    {
      sectionId: sectionIds[4],
      slug: "sbar-communication",
      titleAr: "التواصل باستخدام نظام SBAR",
      contentAr: `# التواصل باستخدام نظام SBAR

## مقدمة
نظام SBAR هو أداة تواصل منظمة تُستخدم في المجال الصحي لنقل المعلومات المهمة بشكل واضح ومختصر، خاصة عند التواصل مع الأطباء أو عند تسليم النوبة.

## مكونات SBAR

### S - Situation (الموقف)
عرّف نفسك وحدد المشكلة:
- "أنا الممرض/ة [الاسم] من قسم [القسم]"
- "أتصل بخصوص المريض/ة [الاسم] في الغرفة [الرقم]"
- "المشكلة هي [وصف مختصر]"

### B - Background (الخلفية)
قدّم المعلومات الأساسية:
- التشخيص وتاريخ الدخول
- التاريخ المرضي المهم
- الأدوية الحالية
- نتائج الفحوصات الأخيرة
- العلامات الحيوية الأخيرة

### A - Assessment (التقييم)
شارك تقييمك المهني:
- "أعتقد أن المشكلة هي..."
- "حالة المريض تتدهور/مستقرة/تتحسن"
- "أنا قلق/ة بشأن..."

### R - Recommendation (التوصية)
اقترح الخطوة التالية:
- "أقترح أن..."
- "هل تريد أن أطلب فحوصات معينة؟"
- "هل يحتاج المريض لتغيير في العلاج؟"
- "هل تحتاج لرؤية المريض؟"

## مثال عملي

> **S**: "أنا الممرضة سارة من قسم الباطنية. أتصل بخصوص المريض أحمد محمد في الغرفة 305. ضغط الدم انخفض بشكل ملحوظ."
>
> **B**: "المريض عمره 65 سنة، دخل أمس بسبب التهاب رئوي. العلامات الحيوية قبل ساعة كانت مستقرة. الآن الضغط 85/50 والنبض 110 والحرارة 38.8."
>
> **A**: "أعتقد أن المريض يعاني من صدمة إنتانية محتملة. حالته تتدهور."
>
> **R**: "أقترح مراجعة المريض فوراً. هل تريد أن أبدأ بمحلول ملحي سريع وأسحب مزرعة دم؟"

## فوائد SBAR
- يقلل من الأخطاء الطبية
- يوفر الوقت في التواصل
- يضمن نقل جميع المعلومات المهمة
- يعزز ثقة الممرض في التواصل مع الأطباء
- يحسن سلامة المريض`,
      sortOrder: 1,
      isPublished: true,
    },
    {
      sectionId: sectionIds[4],
      slug: "nursing-notes",
      titleAr: "كتابة الملاحظات التمريضية",
      contentAr: `# كتابة الملاحظات التمريضية (Nursing Notes)

## مقدمة
الملاحظات التمريضية هي سجل قانوني ومهني يوثق حالة المريض والرعاية المقدمة. التوثيق الجيد يحمي الممرض والمريض.

## القاعدة الذهبية
> "إذا لم تُوثّقه، فإنه لم يحدث"
> (If it wasn't documented, it wasn't done)

## أنظمة التوثيق

### 1. نظام SOAP
- **S (Subjective)**: ما يقوله المريض - "أشعر بألم في صدري"
- **O (Objective)**: ما تلاحظه أنت - الضغط 150/90، النبض 100
- **A (Assessment)**: تقييمك - ألم صدري محتمل مصدره قلبي
- **P (Plan)**: الخطة - تخطيط قلب، إبلاغ الطبيب

### 2. نظام DAR (Focus Charting)
- **D (Data)**: البيانات الموضوعية والذاتية
- **A (Action)**: الإجراءات المتخذة
- **R (Response)**: استجابة المريض

### 3. نظام PIE
- **P (Problem)**: المشكلة
- **I (Intervention)**: التدخل
- **E (Evaluation)**: التقييم

## قواعد التوثيق الصحيح

### يجب عليك:
- استخدام الحبر الأزرق أو الأسود فقط
- كتابة التاريخ والوقت في كل ملاحظة
- التوقيع بعد كل ملاحظة مع الاسم والمسمى
- استخدام الاختصارات المعتمدة فقط
- التوثيق فوراً بعد تقديم الرعاية
- كتابة حقائق وملاحظات موضوعية

### يجب تجنب:
- الشطب أو استخدام المصحح
- ترك فراغات في السجل
- التوثيق المسبق (قبل تقديم الرعاية)
- استخدام عبارات غامضة مثل "حالة جيدة"
- كتابة آراء شخصية غير مبنية على ملاحظات

## أمثلة على التوثيق الجيد

### مثال 1: توثيق العلامات الحيوية
> "14:00 - العلامات الحيوية: ضغط الدم 130/85 mmHg، النبض 78 نبضة/دقيقة منتظم، الحرارة 37.2°C فموي، التنفس 16/دقيقة، تشبع الأكسجين 97% على الهواء الجوي. المريض واعٍ ومتجاوب. - الممرض/ة [الاسم]"

### مثال 2: توثيق إعطاء دواء
> "08:00 - تم إعطاء Paracetamol 1000mg PO حسب الوصفة الطبية لعلاج ألم الرأس. المريض يشكو من ألم بدرجة 6/10. تم التحقق من هوية المريض والحساسية. - الممرض/ة [الاسم]"
> "09:00 - متابعة: المريض يفيد بتحسن الألم إلى 2/10 بعد ساعة من إعطاء المسكن. - الممرض/ة [الاسم]"

### مثال 3: توثيق حالة طارئة
> "22:30 - المريض فقد الوعي فجأة. لا يوجد نبض ولا تنفس. تم البدء بالإنعاش القلبي الرئوي (CPR) فوراً. تم تفعيل فريق الطوارئ (Code Blue). - الممرض/ة [الاسم]"

## الاختصارات الشائعة
| الاختصار | المعنى |
|----------|--------|
| BP | ضغط الدم |
| HR | معدل القلب |
| RR | معدل التنفس |
| SpO2 | تشبع الأكسجين |
| NPO | صائم |
| PRN | عند الحاجة |
| BID | مرتين يومياً |
| TID | ثلاث مرات يومياً |
| QID | أربع مرات يومياً |
| STAT | فوراً |`,
      sortOrder: 2,
      isPublished: true,
    },
  ];

  // Insert lessons
  const lessonIds = [];
  for (const l of lessonsData) {
    try {
      const result = await db.insert(lessons).values(l);
      lessonIds.push({ id: result[0].insertId, sectionId: l.sectionId, title: l.titleAr });
      console.log(`✅ درس: ${l.titleAr}`);
    } catch (e) {
      const existing = await db.select().from(lessons).where(eq(lessons.slug, l.slug)).limit(1);
      if (existing.length > 0) {
        lessonIds.push({ id: existing[0].id, sectionId: l.sectionId, title: l.titleAr });
        console.log(`⏩ درس موجود: ${l.titleAr}`);
      }
    }
  }

  // ==================== الاختبارات ====================
  const quizData = [
    // Quiz for lesson 1: Head to Toe Assessment
    {
      lessonIndex: 0,
      titleAr: "اختبار: التقييم الشامل من الرأس إلى القدم",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هو المقياس المستخدم لتقييم مستوى الوعي؟",
          optionAAr: "مقياس غلاسكو (GCS)",
          optionBAr: "مقياس الألم (NRS)",
          optionCAr: "مقياس نورتون",
          optionDAr: "مقياس برادن",
          correctOption: "A",
        },
        {
          questionAr: "ما هو الاختصار PERRLA المستخدم في فحص العينين؟",
          optionAAr: "البؤبؤان متساويان، مستديران، يتفاعلان مع الضوء والتكيف",
          optionBAr: "فحص حدة البصر",
          optionCAr: "فحص ضغط العين",
          optionDAr: "فحص قاع العين",
          correctOption: "A",
        },
        {
          questionAr: "عند تقييم البطن، ما هو الترتيب الصحيح للفحص؟",
          optionAAr: "الجس ثم التسمع ثم القرع",
          optionBAr: "التسمع ثم الجس ثم القرع",
          optionCAr: "القرع ثم التسمع ثم الجس",
          optionDAr: "الجس ثم القرع ثم التسمع",
          correctOption: "B",
        },
        {
          questionAr: "ما هو مقياس القوة العضلية؟",
          optionAAr: "0-3",
          optionBAr: "0-5",
          optionCAr: "1-10",
          optionDAr: "0-10",
          correctOption: "B",
        },
        {
          questionAr: "ما هو CRT وما القيمة الطبيعية له؟",
          optionAAr: "وقت إعادة الامتلاء الشعيري، أقل من 3 ثوانٍ",
          optionBAr: "معدل التنفس، 12-20",
          optionCAr: "وقت التخثر، 5 دقائق",
          optionDAr: "ضغط الدم الشعيري، 120/80",
          correctOption: "A",
        },
      ],
    },
    // Quiz for lesson 2: Focused Assessment
    {
      lessonIndex: 1,
      titleAr: "اختبار: التقييم المركّز حسب الشكوى",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هو الحرف O في منهجية OPQRST؟",
          optionAAr: "Onset - البداية",
          optionBAr: "Output - المخرجات",
          optionCAr: "Observation - الملاحظة",
          optionDAr: "Operation - العملية",
          correctOption: "A",
        },
        {
          questionAr: "ما هو الحرف S في منهجية OPQRST؟",
          optionAAr: "Situation - الموقف",
          optionBAr: "Severity - الشدة",
          optionCAr: "System - النظام",
          optionDAr: "Sign - العلامة",
          correctOption: "B",
        },
        {
          questionAr: "عند تقييم مريض يشكو من ألم في الصدر، ما أول إجراء يجب عمله؟",
          optionAAr: "إعطاء مسكن فوراً",
          optionBAr: "تقييم القلب والأوعية الدموية وقياس العلامات الحيوية",
          optionCAr: "نقل المريض للعمليات",
          optionDAr: "إعطاء أكسجين 100%",
          correctOption: "B",
        },
        {
          questionAr: "ما هو مقياس شدة الألم المستخدم عادة؟",
          optionAAr: "0-5",
          optionBAr: "1-20",
          optionCAr: "0-10",
          optionDAr: "1-100",
          correctOption: "C",
        },
      ],
    },
    // Quiz for lesson 3: IV Cannulation
    {
      lessonIndex: 2,
      titleAr: "اختبار: تركيب الكانيولا الوريدية",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما لون الكانيولا مقاس 18G؟",
          optionAAr: "وردي",
          optionBAr: "أزرق",
          optionCAr: "أخضر",
          optionDAr: "أصفر",
          correctOption: "C",
        },
        {
          questionAr: "ما هي الزاوية الصحيحة لإدخال الكانيولا؟",
          optionAAr: "45 درجة",
          optionBAr: "15-30 درجة",
          optionCAr: "90 درجة",
          optionDAr: "60 درجة",
          correctOption: "B",
        },
        {
          questionAr: "كم المسافة التي يوضع فيها التورنيكيه فوق موقع التركيب؟",
          optionAAr: "5 سم",
          optionBAr: "10-15 سم",
          optionCAr: "20-25 سم",
          optionDAr: "2-3 سم",
          correctOption: "B",
        },
        {
          questionAr: "ما هو Phlebitis؟",
          optionAAr: "تسرب المحلول خارج الوريد",
          optionBAr: "التهاب الوريد",
          optionCAr: "تجمع دموي تحت الجلد",
          optionDAr: "انسداد الكانيولا",
          correctOption: "B",
        },
        {
          questionAr: "متى يجب تغيير الكانيولا عادة؟",
          optionAAr: "كل 24 ساعة",
          optionBAr: "كل 48 ساعة",
          optionCAr: "كل 72-96 ساعة",
          optionDAr: "كل أسبوع",
          correctOption: "C",
        },
      ],
    },
    // Quiz for lesson 4: Wound Care
    {
      lessonIndex: 3,
      titleAr: "اختبار: العناية بالجروح",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هو الشفاء بالقصد الأول؟",
          optionAAr: "الجرح مفتوح يشفى تدريجياً",
          optionBAr: "الجرح مغلق بالخياطة",
          optionCAr: "إغلاق متأخر بعد السيطرة على العدوى",
          optionDAr: "الجرح لا يشفى",
          correctOption: "B",
        },
        {
          questionAr: "ما يدل اللون الأحمر في قاعدة الجرح؟",
          optionAAr: "نسيج نخري",
          optionBAr: "عدوى",
          optionCAr: "نسيج حبيبي (شفاء جيد)",
          optionDAr: "نسيج ليفي",
          correctOption: "C",
        },
        {
          questionAr: "ما هو الاتجاه الصحيح لتنظيف الجرح؟",
          optionAAr: "من الخارج إلى المركز",
          optionBAr: "من المركز إلى الخارج",
          optionCAr: "من اليمين إلى اليسار",
          optionDAr: "من الأعلى إلى الأسفل",
          correctOption: "B",
        },
        {
          questionAr: "أي نوع من الضمادات مناسب للجروح كثيرة الإفرازات؟",
          optionAAr: "الشاش العادي",
          optionBAr: "الضمادات الشفافة",
          optionCAr: "ضمادات الهيدروجيل",
          optionDAr: "ضمادات الألجينات",
          correctOption: "D",
        },
      ],
    },
    // Quiz for lesson 5: Five Rights
    {
      lessonIndex: 4,
      titleAr: "اختبار: الحقوق الخمسة لإعطاء الأدوية",
      passingScore: 70,
      questions: [
        {
          questionAr: "كم مرة يجب التحقق من ملصق الدواء؟",
          optionAAr: "مرة واحدة",
          optionBAr: "مرتين",
          optionCAr: "ثلاث مرات",
          optionDAr: "أربع مرات",
          correctOption: "C",
        },
        {
          questionAr: "ما هو الاختصار PO في طرق إعطاء الأدوية؟",
          optionAAr: "عن طريق الوريد",
          optionBAr: "عن طريق الفم",
          optionCAr: "عن طريق العضل",
          optionDAr: "تحت الجلد",
          correctOption: "B",
        },
        {
          questionAr: "ما هو المدى المقبول عادة لوقت إعطاء الدواء؟",
          optionAAr: "± 10 دقائق",
          optionBAr: "± 30 دقيقة",
          optionCAr: "± ساعة",
          optionDAr: "± ساعتين",
          correctOption: "B",
        },
        {
          questionAr: "كم طريقة يجب استخدامها للتحقق من هوية المريض؟",
          optionAAr: "طريقة واحدة",
          optionBAr: "طريقتين على الأقل",
          optionCAr: "ثلاث طرق",
          optionDAr: "لا يلزم التحقق",
          correctOption: "B",
        },
        {
          questionAr: "ماذا يجب فعله إذا رفض المريض تناول الدواء؟",
          optionAAr: "إجبار المريض على تناوله",
          optionBAr: "تجاهل الأمر",
          optionCAr: "توثيق الرفض وإبلاغ الطبيب",
          optionDAr: "إعطاء الدواء لمريض آخر",
          correctOption: "C",
        },
      ],
    },
    // Quiz for lesson 6: Injection Techniques
    {
      lessonIndex: 5,
      titleAr: "اختبار: تقنيات الحقن",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هي زاوية الحقن العضلي (IM)؟",
          optionAAr: "15 درجة",
          optionBAr: "45 درجة",
          optionCAr: "90 درجة",
          optionDAr: "30 درجة",
          correctOption: "C",
        },
        {
          questionAr: "ما هي زاوية الحقن تحت الجلد (SC)؟",
          optionAAr: "90 درجة",
          optionBAr: "45 درجة",
          optionCAr: "15 درجة",
          optionDAr: "60 درجة",
          correctOption: "B",
        },
        {
          questionAr: "ما هو الموقع المفضل للحقن العضلي عند البالغين؟",
          optionAAr: "العضلة الدالية",
          optionBAr: "العضلة الألوية البطنية (Ventrogluteal)",
          optionCAr: "العضلة الرباعية",
          optionDAr: "عضلة الساق",
          correctOption: "B",
        },
        {
          questionAr: "لماذا لا يجب تدليك موقع حقن الهيبارين؟",
          optionAAr: "لأنه مؤلم",
          optionBAr: "لأنه يسبب كدمات ونزيف",
          optionCAr: "لأنه يبطل مفعول الدواء",
          optionDAr: "لأنه يسبب حساسية",
          correctOption: "B",
        },
      ],
    },
    // Quiz for lesson 7: Blood Pressure
    {
      lessonIndex: 6,
      titleAr: "اختبار: قياس ضغط الدم",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هو ضغط الدم الطبيعي للبالغين؟",
          optionAAr: "أقل من 120/80 mmHg",
          optionBAr: "130/90 mmHg",
          optionCAr: "140/90 mmHg",
          optionDAr: "110/70 mmHg بالضبط",
          correctOption: "A",
        },
        {
          questionAr: "ماذا يحدث إذا استخدمت كفة صغيرة لقياس الضغط؟",
          optionAAr: "قراءة أقل من الحقيقية",
          optionBAr: "قراءة أعلى من الحقيقية",
          optionCAr: "قراءة صحيحة",
          optionDAr: "لا يمكن القياس",
          correctOption: "B",
        },
        {
          questionAr: "كم يجب أن تغطي الكفة من محيط الذراع؟",
          optionAAr: "50%",
          optionBAr: "60%",
          optionCAr: "80%",
          optionDAr: "100%",
          correctOption: "C",
        },
        {
          questionAr: "ما هي سرعة تفريغ الهواء الصحيحة؟",
          optionAAr: "1 mmHg/ثانية",
          optionBAr: "2-3 mmHg/ثانية",
          optionCAr: "5 mmHg/ثانية",
          optionDAr: "10 mmHg/ثانية",
          correctOption: "B",
        },
      ],
    },
    // Quiz for lesson 8: TPR
    {
      lessonIndex: 7,
      titleAr: "اختبار: قياس الحرارة والنبض والتنفس",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هو المعدل الطبيعي للنبض عند البالغين؟",
          optionAAr: "40-60 نبضة/دقيقة",
          optionBAr: "60-100 نبضة/دقيقة",
          optionCAr: "100-120 نبضة/دقيقة",
          optionDAr: "80-140 نبضة/دقيقة",
          correctOption: "B",
        },
        {
          questionAr: "لماذا لا نخبر المريض أننا نقيس تنفسه؟",
          optionAAr: "لأنه سر طبي",
          optionBAr: "لأن المريض سيغير نمط تنفسه لا إرادياً",
          optionCAr: "لأنه غير مهم",
          optionDAr: "لتوفير الوقت",
          correctOption: "B",
        },
        {
          questionAr: "ما هو المعدل الطبيعي للتنفس عند البالغين؟",
          optionAAr: "8-10 نفس/دقيقة",
          optionBAr: "12-20 نفس/دقيقة",
          optionCAr: "25-30 نفس/دقيقة",
          optionDAr: "30-40 نفس/دقيقة",
          correctOption: "B",
        },
        {
          questionAr: "ما هو تنفس كوسماول (Kussmaul)؟",
          optionAAr: "تنفس بطيء وسطحي",
          optionBAr: "تنفس عميق وسريع (يحدث في الحماض)",
          optionCAr: "توقف التنفس",
          optionDAr: "تنفس متقطع",
          correctOption: "B",
        },
        {
          questionAr: "لماذا لا نستخدم الإبهام لقياس النبض؟",
          optionAAr: "لأن الإبهام له نبض خاص قد يُخلط مع نبض المريض",
          optionBAr: "لأن الإبهام كبير جداً",
          optionCAr: "لأنه غير مريح",
          optionDAr: "لا يوجد سبب محدد",
          correctOption: "A",
        },
      ],
    },
    // Quiz for lesson 9: SBAR
    {
      lessonIndex: 8,
      titleAr: "اختبار: التواصل باستخدام نظام SBAR",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هو الحرف S في نظام SBAR؟",
          optionAAr: "Summary - الملخص",
          optionBAr: "Situation - الموقف",
          optionCAr: "System - النظام",
          optionDAr: "Safety - السلامة",
          correctOption: "B",
        },
        {
          questionAr: "في أي جزء من SBAR تذكر التشخيص والتاريخ المرضي؟",
          optionAAr: "S - Situation",
          optionBAr: "B - Background",
          optionCAr: "A - Assessment",
          optionDAr: "R - Recommendation",
          correctOption: "B",
        },
        {
          questionAr: "في أي جزء تقترح الخطوة التالية؟",
          optionAAr: "S - Situation",
          optionBAr: "B - Background",
          optionCAr: "A - Assessment",
          optionDAr: "R - Recommendation",
          correctOption: "D",
        },
        {
          questionAr: "ما هي أهم فائدة لنظام SBAR؟",
          optionAAr: "يوفر المال",
          optionBAr: "يقلل من الأخطاء الطبية ويحسن سلامة المريض",
          optionCAr: "يقلل عدد الممرضين المطلوبين",
          optionDAr: "يلغي الحاجة للتوثيق",
          correctOption: "B",
        },
      ],
    },
    // Quiz for lesson 10: Nursing Notes
    {
      lessonIndex: 9,
      titleAr: "اختبار: كتابة الملاحظات التمريضية",
      passingScore: 70,
      questions: [
        {
          questionAr: "ما هو الحرف S في نظام SOAP؟",
          optionAAr: "Subjective - ما يقوله المريض",
          optionBAr: "System - النظام",
          optionCAr: "Safety - السلامة",
          optionDAr: "Summary - الملخص",
          correctOption: "A",
        },
        {
          questionAr: "ما القاعدة الذهبية في التوثيق التمريضي؟",
          optionAAr: "الاختصار دائماً أفضل",
          optionBAr: "إذا لم تُوثّقه، فإنه لم يحدث",
          optionCAr: "التوثيق يمكن أن يتأخر",
          optionDAr: "التوثيق اختياري",
          correctOption: "B",
        },
        {
          questionAr: "ما هو الاختصار NPO؟",
          optionAAr: "عند الحاجة",
          optionBAr: "مرتين يومياً",
          optionCAr: "صائم (لا شيء عن طريق الفم)",
          optionDAr: "فوراً",
          correctOption: "C",
        },
        {
          questionAr: "ما هو الاختصار STAT؟",
          optionAAr: "صائم",
          optionBAr: "عند الحاجة",
          optionCAr: "مرة واحدة يومياً",
          optionDAr: "فوراً",
          correctOption: "D",
        },
        {
          questionAr: "أي لون حبر يجب استخدامه في التوثيق؟",
          optionAAr: "أحمر فقط",
          optionBAr: "أزرق أو أسود",
          optionCAr: "أخضر",
          optionDAr: "أي لون",
          correctOption: "B",
        },
      ],
    },
  ];

  // Insert quizzes and questions
  for (const q of quizData) {
    if (!lessonIds[q.lessonIndex]) continue;
    const lessonId = lessonIds[q.lessonIndex].id;
    try {
      // Check if quiz already exists for this lesson
      const existing = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).limit(1);
      if (existing.length > 0) {
        console.log(`⏩ اختبار موجود: ${q.titleAr}`);
        continue;
      }

      const quizResult = await db.insert(quizzes).values({
        lessonId,
        titleAr: q.titleAr,
        passingScore: q.passingScore,
      });
      const quizId = quizResult[0].insertId;

      for (let i = 0; i < q.questions.length; i++) {
        await db.insert(quizQuestions).values({
          quizId,
          ...q.questions[i],
          sortOrder: i,
        });
      }
      console.log(`✅ اختبار: ${q.titleAr} (${q.questions.length} أسئلة)`);
    } catch (e) {
      console.log(`❌ خطأ في اختبار: ${q.titleAr}`, e.message);
    }
  }

  console.log("\n🎉 تم إضافة جميع البيانات التعليمية بنجاح!");
  process.exit(0);
}

seed().catch(e => {
  console.error("❌ خطأ:", e);
  process.exit(1);
});
