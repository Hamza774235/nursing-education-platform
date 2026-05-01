import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean as mysqlBoolean } from "drizzle-orm/mysql-core";
import dotenv from "dotenv";
dotenv.config();

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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  console.log("🏥 Adding ICU section with 16 lessons...");

  // Step 1: Make ICU section sortOrder=0 (first), push others down
  await db.execute(sql`UPDATE sections SET sortOrder = sortOrder + 1`);

  // Step 2: Insert ICU section
  let icuSectionId;
  try {
    const result = await db.insert(sections).values({
      slug: "icu",
      titleAr: "العناية الحرجة ICU",
      titleEn: "ICU - Critical Care Nursing",
      descriptionAr: "تعلم أساسيات التمريض في وحدة العناية المركزة والرعاية الحرجة",
      descriptionEn: "Learn the fundamentals of ICU nursing and critical care management",
      icon: "Siren",
      sortOrder: 1,
    });
    icuSectionId = result[0].insertId;
    console.log(`✅ ICU Section created (ID: ${icuSectionId})`);
  } catch (e) {
    const existing = await db.select().from(sections).where(eq(sections.slug, "icu")).limit(1);
    if (existing.length > 0) {
      icuSectionId = existing[0].id;
      await db.update(sections).set({ sortOrder: 1 }).where(eq(sections.id, icuSectionId));
      console.log(`⏩ ICU Section exists (ID: ${icuSectionId})`);
    } else {
      throw e;
    }
  }

  // Step 3: Define 16 ICU lessons
  const icuLessons = [
    {
      slug: "icu-nursing-health-assessment",
      titleAr: "تقييم صحة المريض التمريضي",
      titleEn: "Nursing Health Assessment",
      contentAr: "تقييم صحة المريض التمريضي في وحدة العناية المركزة",
      contentEn: `# Nursing Health Assessment in ICU

## Introduction
A thorough nursing health assessment is the cornerstone of critical care nursing. In the ICU, assessments must be systematic, frequent, and highly detailed to detect subtle changes in a patient's condition.

## Components of ICU Health Assessment

### 1. Primary Survey (ABCDE Approach)
- **A - Airway:** Is the airway patent? Check for secretions, obstruction, or artificial airway placement (ETT/tracheostomy)
- **B - Breathing:** Respiratory rate, depth, pattern, SpO2, breath sounds bilaterally, ventilator settings if applicable
- **C - Circulation:** Heart rate, blood pressure, MAP, capillary refill time, skin color and temperature, peripheral pulses
- **D - Disability:** Level of consciousness (GCS), pupil size and reactivity (PERRLA), blood glucose level
- **E - Exposure:** Full body assessment, skin integrity, temperature, wounds, drains, and lines

### 2. Neurological Assessment
- Glasgow Coma Scale (GCS) every 1-4 hours
- Pupil assessment: size (2-5mm normal), shape, reactivity
- Motor and sensory function
- Cranial nerve assessment when indicated
- Pain assessment using appropriate scales (CPOT for intubated patients)

### 3. Cardiovascular Assessment
- Continuous ECG monitoring interpretation
- Hemodynamic parameters: HR, BP, MAP, CVP, CO/CI if available
- Heart sounds: S1, S2, murmurs, gallops
- Peripheral perfusion: pulses, CRT, edema grading (1+ to 4+)
- Jugular venous distension (JVD)

### 4. Respiratory Assessment
- Rate, rhythm, depth, and work of breathing
- Auscultation: normal vs adventitious sounds (crackles, wheezes, rhonchi)
- Ventilator assessment: mode, FiO2, PEEP, tidal volume, peak pressures
- ABG interpretation
- Chest tube assessment if present

### 5. Gastrointestinal Assessment
- Bowel sounds in all four quadrants
- Abdominal distension, tenderness
- NGT placement and output
- Nutritional status and feeding tolerance
- Last bowel movement

### 6. Renal/Fluid Assessment
- Urine output (goal: >0.5 mL/kg/hr)
- Fluid balance (intake vs output)
- Electrolyte monitoring
- Skin turgor and mucous membranes
- Daily weight

### 7. Integumentary Assessment
- Braden Scale for pressure injury risk
- Skin breakdown or existing wounds
- IV site assessment
- Surgical site assessment

## Documentation Tips
- Use a systematic head-to-toe approach
- Document baseline and any changes
- Report critical findings immediately
- Use standardized assessment tools
- Time-stamp all entries accurately`,
      sortOrder: 1,
    },
    {
      slug: "icu-gcs",
      titleAr: "مقياس غلاسكو للغيبوبة GCS",
      titleEn: "Glasgow Coma Scale (GCS)",
      contentAr: "مقياس غلاسكو للغيبوبة",
      contentEn: `# Glasgow Coma Scale (GCS)

## Introduction
The Glasgow Coma Scale is the most widely used scoring system for assessing the level of consciousness in critically ill patients. It was developed in 1974 by Teasdale and Jennett at the University of Glasgow.

## The Three Components

### 1. Eye Opening (E) - Score 1 to 4
| Score | Response | Description |
|-------|----------|-------------|
| 4 | Spontaneous | Eyes open without stimulation |
| 3 | To voice | Eyes open to verbal command |
| 2 | To pressure | Eyes open to painful stimulus |
| 1 | None | No eye opening |

### 2. Verbal Response (V) - Score 1 to 5
| Score | Response | Description |
|-------|----------|-------------|
| 5 | Oriented | Knows who, where, when |
| 4 | Confused | Responds in conversational manner but disoriented |
| 3 | Inappropriate words | Random or exclamatory speech, no sustained conversation |
| 2 | Incomprehensible sounds | Moaning, groaning, no words |
| 1 | None | No verbal response |

### 3. Motor Response (M) - Score 1 to 6
| Score | Response | Description |
|-------|----------|-------------|
| 6 | Obeys commands | Performs requested movements |
| 5 | Localizing pain | Reaches toward stimulus to remove it |
| 4 | Flexion withdrawal | Pulls away from painful stimulus |
| 3 | Abnormal flexion | Decorticate posturing (arms flex, legs extend) |
| 2 | Extension | Decerebrate posturing (arms and legs extend) |
| 1 | None | No motor response |

## Total GCS Score Interpretation
- **GCS 15:** Fully conscious
- **GCS 13-14:** Mild brain injury
- **GCS 9-12:** Moderate brain injury
- **GCS 3-8:** Severe brain injury (coma) - intubation usually required
- **GCS 3:** Deepest level of unconsciousness

## Important Nursing Considerations
- Always assess and document each component separately (e.g., E4V5M6 = 15)
- For intubated patients, record verbal as "T" (e.g., E4VTM6)
- Apply central painful stimulus: trapezius squeeze or sternal rub
- Apply peripheral painful stimulus: nail bed pressure
- Assess at regular intervals (every 1-4 hours in ICU)
- Report any decrease of 2 or more points immediately
- Consider confounders: sedation, paralysis, facial swelling

## Clinical Significance
A declining GCS may indicate:
- Increased intracranial pressure
- Cerebral edema
- Hemorrhage expansion
- Metabolic derangement
- Medication effects`,
      sortOrder: 2,
    },
    {
      slug: "icu-rass",
      titleAr: "مقياس ريتشموند للتهدئة RASS",
      titleEn: "Richmond Agitation-Sedation Scale (RASS)",
      contentAr: "مقياس ريتشموند للتهدئة والإثارة",
      contentEn: `# Richmond Agitation-Sedation Scale (RASS)

## Introduction
RASS is a validated 10-point scale used to assess a patient's level of sedation and agitation in the ICU. It ranges from -5 (unarousable) to +4 (combative), with 0 being alert and calm.

## The RASS Scale

| Score | Term | Description |
|-------|------|-------------|
| +4 | Combative | Overtly combative, violent, immediate danger to staff |
| +3 | Very agitated | Pulls or removes tubes/catheters, aggressive |
| +2 | Agitated | Frequent non-purposeful movement, fights ventilator |
| +1 | Restless | Anxious, apprehensive, movements not aggressive |
| 0 | Alert & calm | Spontaneously pays attention to caregiver |
| -1 | Drowsy | Not fully alert, sustained awakening to voice (>10 sec) |
| -2 | Light sedation | Briefly awakens to voice, eye contact (<10 sec) |
| -3 | Moderate sedation | Movement or eye opening to voice, no eye contact |
| -4 | Deep sedation | No response to voice, movement to physical stimulation |
| -5 | Unarousable | No response to voice or physical stimulation |

## How to Assess RASS

### Step 1: Observe the Patient (30 seconds)
- If the patient is alert, restless, or agitated → Score 0 to +4

### Step 2: If Not Alert, Call Patient's Name
- Say the patient's name and ask them to open their eyes and look at you
- If they respond → Score -1 to -3

### Step 3: If No Response to Voice, Apply Physical Stimulation
- Shake shoulder and/or apply sternal rub
- If they respond → Score -4
- If no response → Score -5

## Target RASS in ICU
- **General ICU patients:** RASS 0 to -2 (light sedation)
- **ARDS/prone positioning:** RASS -3 to -4 (deeper sedation may be needed)
- **Post-cardiac arrest:** RASS -4 to -5 (targeted temperature management)
- **Weaning from ventilator:** RASS 0 to -1

## RASS and Delirium Assessment
- RASS must be assessed BEFORE CAM-ICU (delirium screening)
- If RASS is -4 or -5, CAM-ICU cannot be performed
- Daily sedation interruption (SAT) helps prevent over-sedation
- Pair with Spontaneous Breathing Trial (SBT) for ventilator weaning

## Nursing Responsibilities
- Assess RASS every 2-4 hours and PRN
- Document score and communicate with the team
- Titrate sedation to target RASS per physician order
- Use non-pharmacological interventions first (reorientation, music, family presence)
- Monitor for complications of over-sedation: prolonged ventilation, delirium, weakness`,
      sortOrder: 3,
    },
    {
      slug: "icu-basics-beginners",
      titleAr: "أساسيات ICU للمبتدئين",
      titleEn: "ICU Basics for Beginners",
      contentAr: "أساسيات العناية المركزة للمبتدئين",
      contentEn: `# ICU Basics for Beginners

## What is the ICU?
The Intensive Care Unit (ICU) is a specialized hospital department that provides continuous monitoring and life-sustaining treatment for critically ill patients. ICU nurses have a lower patient-to-nurse ratio (typically 1:1 or 1:2) to ensure close monitoring.

## Types of ICU
- **MICU** - Medical ICU (sepsis, respiratory failure, DKA)
- **SICU** - Surgical ICU (post-operative care)
- **CCU** - Cardiac Care Unit (MI, heart failure, arrhythmias)
- **NICU** - Neonatal ICU (premature/critically ill newborns)
- **PICU** - Pediatric ICU
- **Neuro ICU** - Neurological critical care (stroke, TBI)
- **Burn ICU** - Burn patients requiring critical care

## Common ICU Equipment
### Monitoring Equipment
- **Cardiac monitor:** Continuous ECG, HR, SpO2, RR, BP
- **Arterial line (A-line):** Continuous blood pressure monitoring
- **Central venous catheter (CVC):** CVP monitoring, medication administration
- **Pulmonary artery catheter (Swan-Ganz):** Advanced hemodynamic monitoring

### Life Support Equipment
- **Mechanical ventilator:** Assists or controls breathing
- **Infusion pumps:** Precise medication delivery (vasopressors, sedation)
- **Sequential compression devices (SCDs):** DVT prevention
- **Feeding pump:** Enteral nutrition delivery

## Common ICU Medications
| Category | Examples | Purpose |
|----------|----------|---------|
| Vasopressors | Norepinephrine, Vasopressin, Dopamine | Raise blood pressure |
| Sedatives | Propofol, Midazolam, Dexmedetomidine | Sedation for ventilated patients |
| Analgesics | Fentanyl, Morphine, Hydromorphone | Pain management |
| Paralytics | Cisatracurium, Rocuronium | Neuromuscular blockade |
| Antiarrhythmics | Amiodarone, Lidocaine | Heart rhythm control |

## ICU Nursing Priorities
1. **Airway management** - Always the first priority
2. **Hemodynamic stability** - Monitor and maintain adequate perfusion
3. **Infection prevention** - Hand hygiene, central line bundles, VAP prevention
4. **Pain and sedation management** - Assess regularly using validated tools
5. **Skin integrity** - Reposition every 2 hours, Braden Scale assessment
6. **Family communication** - Keep families informed and involved

## The ABCDEF Bundle
- **A** - Assess, prevent, and manage pain
- **B** - Both SAT and SBT (spontaneous awakening and breathing trials)
- **C** - Choice of analgesia and sedation
- **D** - Delirium: assess, prevent, and manage
- **E** - Early mobility and exercise
- **F** - Family engagement and empowerment`,
      sortOrder: 4,
    },
    {
      slug: "icu-vital-signs-reading",
      titleAr: "قراءة العلامات الحيوية",
      titleEn: "Reading Vital Signs in ICU",
      contentAr: "قراءة العلامات الحيوية في العناية المركزة",
      contentEn: `# Reading Vital Signs in ICU

## Introduction
In the ICU, vital signs are monitored continuously and interpreted in the context of the patient's overall clinical picture. Understanding normal ranges and recognizing trends is essential.

## Core Vital Signs

### 1. Heart Rate (HR)
- **Normal:** 60-100 bpm
- **Bradycardia:** <60 bpm (may be normal in athletes)
- **Tachycardia:** >100 bpm
- **Critical:** <40 or >150 bpm - immediate intervention needed
- **Assess:** Rate, rhythm, regularity

### 2. Blood Pressure (BP)
- **Normal:** Systolic 90-140 mmHg, Diastolic 60-90 mmHg
- **Hypotension:** Systolic <90 or MAP <65 mmHg
- **Hypertensive crisis:** Systolic >180 or Diastolic >120 mmHg
- **MAP (Mean Arterial Pressure):** Target >65 mmHg for organ perfusion
- **Formula:** MAP = (SBP + 2×DBP) / 3

### 3. Respiratory Rate (RR)
- **Normal:** 12-20 breaths/min
- **Tachypnea:** >20 breaths/min
- **Bradypnea:** <12 breaths/min
- **Assess:** Rate, depth, pattern, work of breathing, accessory muscle use

### 4. Temperature
- **Normal:** 36.5-37.5°C (97.7-99.5°F)
- **Fever:** >38.0°C (100.4°F)
- **Hypothermia:** <36.0°C (96.8°F)
- **Hyperthermia:** >40.0°C (104°F) - medical emergency

### 5. Oxygen Saturation (SpO2)
- **Normal:** 95-100%
- **Mild hypoxemia:** 90-94%
- **Moderate hypoxemia:** 85-89%
- **Severe hypoxemia:** <85% - emergency
- **Note:** May be unreliable in poor perfusion, hypothermia, or carbon monoxide poisoning

## Advanced ICU Parameters

### Central Venous Pressure (CVP)
- **Normal:** 2-8 mmHg
- **High CVP:** Fluid overload, right heart failure, cardiac tamponade
- **Low CVP:** Hypovolemia, dehydration

### Cardiac Output (CO) & Cardiac Index (CI)
- **Normal CO:** 4-8 L/min
- **Normal CI:** 2.5-4.0 L/min/m²

### Intracranial Pressure (ICP)
- **Normal:** 5-15 mmHg
- **Elevated:** >20 mmHg - requires intervention
- **CPP (Cerebral Perfusion Pressure):** MAP - ICP (target >60 mmHg)

## Vital Signs Trends
- A single reading is less important than the trend
- Always compare with the patient's baseline
- Look for patterns: gradual decline vs sudden change
- Correlate vital signs with each other (e.g., tachycardia + hypotension = shock)
- Document and report significant changes promptly`,
      sortOrder: 5,
    },
    {
      slug: "icu-ventilator-basics",
      titleAr: "أساسيات جهاز التنفس الصناعي",
      titleEn: "Ventilator Basics",
      contentAr: "أساسيات جهاز التنفس الصناعي",
      contentEn: `# Ventilator Basics

## Introduction
Mechanical ventilation is one of the most common interventions in the ICU. Understanding ventilator modes, settings, and troubleshooting is essential for ICU nurses.

## Indications for Mechanical Ventilation
- Respiratory failure (Type I or Type II)
- Airway protection (GCS ≤8)
- Post-operative support
- Neuromuscular disease
- Severe sepsis/shock

## Key Ventilator Settings

### FiO2 (Fraction of Inspired Oxygen)
- Range: 21% (room air) to 100%
- Goal: Maintain SpO2 >92% with lowest FiO2 possible
- FiO2 >60% for prolonged periods causes oxygen toxicity

### Tidal Volume (Vt)
- Volume of air delivered per breath
- Lung-protective: 6-8 mL/kg of ideal body weight
- Higher volumes cause ventilator-induced lung injury (VILI)

### Respiratory Rate (RR)
- Number of breaths per minute delivered by the ventilator
- Typical: 12-20 breaths/min
- Adjust based on PaCO2 and pH

### PEEP (Positive End-Expiratory Pressure)
- Pressure maintained at end of expiration
- Prevents alveolar collapse (atelectasis)
- Normal starting: 5 cmH2O
- ARDS: May need 10-20 cmH2O
- Higher PEEP can decrease venous return and cardiac output

## Common Ventilator Modes

### Volume Control (VC)
- Delivers a set tidal volume
- Pressure varies based on lung compliance
- Risk: High peak pressures if compliance decreases

### Pressure Control (PC)
- Delivers a set pressure
- Tidal volume varies based on lung compliance
- Advantage: Limits peak airway pressure

### SIMV (Synchronized Intermittent Mandatory Ventilation)
- Delivers set number of mandatory breaths
- Patient can breathe spontaneously between mandatory breaths
- Used for weaning

### Pressure Support (PS)
- Patient-triggered, pressure-assisted breaths
- Patient controls rate, inspiratory time, and tidal volume
- Used for weaning and spontaneous breathing trials

## Ventilator Alarms and Troubleshooting

| Alarm | Possible Causes | Nursing Actions |
|-------|----------------|-----------------|
| High pressure | Secretions, biting tube, bronchospasm, pneumothorax | Suction, check tube position, assess breath sounds |
| Low pressure | Circuit disconnect, cuff leak, extubation | Check connections, check cuff pressure, assess patient |
| Low Vt | Leak in circuit, patient effort decreased | Check connections, assess patient |
| High RR | Pain, anxiety, fever, metabolic acidosis | Assess cause, treat underlying issue |
| Apnea | Over-sedation, neurological event | Assess patient, check sedation level |

## VAP Prevention Bundle
- Elevate head of bed 30-45 degrees
- Daily sedation interruption
- Daily readiness-to-extubate assessment
- Oral care with chlorhexidine every 6-8 hours
- DVT and stress ulcer prophylaxis`,
      sortOrder: 6,
    },
    {
      slug: "icu-abg",
      titleAr: "تحليل غازات الدم الشرياني ABG",
      titleEn: "ABG - Arterial Blood Gas Analysis",
      contentAr: "شرح سهل لتحليل غازات الدم الشرياني",
      contentEn: `# ABG - Arterial Blood Gas Analysis (Easy Explanation)

## What is an ABG?
An Arterial Blood Gas (ABG) is a blood test drawn from an artery (usually radial) that measures the body's acid-base balance and oxygenation status. It is one of the most important tests in critical care.

## Normal ABG Values

| Parameter | Normal Range | What It Tells Us |
|-----------|-------------|------------------|
| pH | 7.35 - 7.45 | Acid-base status |
| PaCO2 | 35 - 45 mmHg | Respiratory component |
| HCO3 | 22 - 26 mEq/L | Metabolic component |
| PaO2 | 80 - 100 mmHg | Oxygenation |
| SaO2 | 95 - 100% | Oxygen saturation |
| Base Excess | -2 to +2 | Metabolic status |

## The 5-Step ABG Interpretation Method

### Step 1: Look at the pH
- pH < 7.35 → **Acidosis**
- pH > 7.45 → **Alkalosis**
- pH 7.35-7.45 → Normal (but check for compensation)

### Step 2: Check PaCO2 (Respiratory Component)
- PaCO2 > 45 → Respiratory acidosis (hypoventilation)
- PaCO2 < 35 → Respiratory alkalosis (hyperventilation)

### Step 3: Check HCO3 (Metabolic Component)
- HCO3 < 22 → Metabolic acidosis
- HCO3 > 26 → Metabolic alkalosis

### Step 4: Match the Primary Disorder
- If pH is acidotic AND PaCO2 is high → **Respiratory Acidosis**
- If pH is acidotic AND HCO3 is low → **Metabolic Acidosis**
- If pH is alkalotic AND PaCO2 is low → **Respiratory Alkalosis**
- If pH is alkalotic AND HCO3 is high → **Metabolic Alkalosis**

### Step 5: Check for Compensation
- If the opposite system is also abnormal, compensation is occurring
- **Full compensation:** pH is within normal range
- **Partial compensation:** pH is still abnormal but moving toward normal

## Common Clinical Scenarios

### Respiratory Acidosis (pH↓, PaCO2↑)
- Causes: COPD, over-sedation, pneumonia, neuromuscular disease
- Treatment: Improve ventilation, bronchodilators, reduce sedation

### Metabolic Acidosis (pH↓, HCO3↓)
- Causes: DKA, lactic acidosis, renal failure, diarrhea
- Use MUDPILES mnemonic: Methanol, Uremia, DKA, Propylene glycol, INH/Iron, Lactic acidosis, Ethylene glycol, Salicylates

### Respiratory Alkalosis (pH↑, PaCO2↓)
- Causes: Anxiety, pain, fever, PE, over-ventilation
- Treatment: Treat underlying cause, adjust ventilator

### Metabolic Alkalosis (pH↑, HCO3↑)
- Causes: Vomiting, NG suction, diuretics, hypokalemia
- Treatment: Replace fluids and electrolytes

## Quick Memory Trick: ROME
- **R**espiratory = **O**pposite (pH and PaCO2 move in opposite directions)
- **M**etabolic = **E**qual (pH and HCO3 move in the same direction)`,
      sortOrder: 7,
    },
    {
      slug: "icu-ecg-nurses",
      titleAr: "تخطيط القلب للممرضات ECG",
      titleEn: "ECG for Nurses",
      contentAr: "تخطيط القلب للممرضات",
      contentEn: `# ECG for Nurses

## Introduction
Electrocardiography (ECG/EKG) is a fundamental skill for ICU nurses. Understanding basic rhythm interpretation helps detect life-threatening arrhythmias quickly.

## ECG Basics

### The Conduction System
1. **SA Node** (Sinoatrial) → Natural pacemaker (60-100 bpm)
2. **AV Node** (Atrioventricular) → Delays signal (40-60 bpm backup)
3. **Bundle of His** → Conducts to ventricles
4. **Bundle Branches** → Right and Left
5. **Purkinje Fibers** → Ventricular contraction (20-40 bpm backup)

### ECG Waveforms
- **P wave:** Atrial depolarization (contraction)
- **PR interval:** Time from atrial to ventricular depolarization (0.12-0.20 sec)
- **QRS complex:** Ventricular depolarization (0.06-0.12 sec)
- **ST segment:** Early ventricular repolarization
- **T wave:** Ventricular repolarization
- **QT interval:** Total ventricular activity (varies with HR)

## Systematic ECG Interpretation (6 Steps)

### 1. Rate
- Regular rhythm: 300 ÷ (number of large boxes between R-R)
- Or count R waves in 6-second strip × 10

### 2. Rhythm
- Regular or irregular?
- Regularly irregular or irregularly irregular?

### 3. P Waves
- Present? One P before each QRS?
- Upright in Lead II?

### 4. PR Interval
- Normal: 0.12-0.20 seconds (3-5 small boxes)
- Prolonged: >0.20 sec (first-degree heart block)

### 5. QRS Duration
- Normal: <0.12 seconds (3 small boxes)
- Wide: >0.12 sec (bundle branch block or ventricular origin)

### 6. ST Segment
- Elevated: Possible STEMI (heart attack)
- Depressed: Possible ischemia

## Common Rhythms ICU Nurses Must Know

| Rhythm | Rate | Regularity | Key Features |
|--------|------|------------|--------------|
| Normal Sinus | 60-100 | Regular | Normal P, QRS, T |
| Sinus Tachycardia | >100 | Regular | Normal morphology, fast |
| Sinus Bradycardia | <60 | Regular | Normal morphology, slow |
| Atrial Fibrillation | Variable | Irregularly irregular | No P waves, fibrillatory baseline |
| Atrial Flutter | ~150 | Regular | Sawtooth pattern |
| SVT | 150-250 | Regular | Narrow QRS, no visible P waves |
| V-Tach | 100-250 | Regular | Wide QRS, no P waves |
| V-Fib | None | Chaotic | No organized rhythm - EMERGENCY |
| Asystole | None | Flat line | No electrical activity - EMERGENCY |

## ST Changes and Acute Coronary Syndrome
- **ST Elevation:** Acute MI (STEMI) → Activate cath lab
- **ST Depression:** Ischemia or NSTEMI
- **T wave inversion:** Ischemia
- **New LBBB:** Treat as STEMI equivalent

## Nursing Actions for Critical Rhythms
1. **V-Fib/Pulseless V-Tach:** Start CPR, defibrillate immediately
2. **Asystole/PEA:** Start CPR, give epinephrine
3. **Symptomatic bradycardia:** Atropine, transcutaneous pacing
4. **Unstable tachycardia:** Synchronized cardioversion`,
      sortOrder: 8,
    },
    {
      slug: "icu-cvp-monitoring",
      titleAr: "مراقبة الضغط الوريدي المركزي CVP",
      titleEn: "CVP Monitoring, Checking and Reading",
      contentAr: "مراقبة وقراءة الضغط الوريدي المركزي",
      contentEn: `# CVP Monitoring, Checking and Reading

## What is CVP?
Central Venous Pressure (CVP) is the pressure measured in the superior vena cava or right atrium. It reflects the right heart preload and intravascular volume status.

## Normal CVP Values
- **Normal range:** 2-8 mmHg (3-11 cmH2O)
- **Low CVP (<2 mmHg):** Hypovolemia, dehydration
- **High CVP (>12 mmHg):** Fluid overload, right heart failure, cardiac tamponade, tension pneumothorax

## Central Venous Catheter (CVC) Sites
| Site | Advantages | Disadvantages |
|------|-----------|---------------|
| Internal Jugular | Easy access, low pneumothorax risk | Infection risk, uncomfortable |
| Subclavian | Lower infection rate, comfortable | Pneumothorax risk, difficult compression |
| Femoral | Easy access, no pneumothorax risk | Highest infection rate, limits mobility |

## How to Set Up CVP Monitoring

### Equipment Needed
- Pressure transducer
- Pressure tubing with flush system
- Monitor with pressure module
- IV pole and transducer holder

### Setup Steps
1. Connect pressure tubing to the distal port of the CVC
2. Flush the system to remove all air bubbles
3. Level the transducer to the phlebostatic axis
4. Zero the transducer
5. Observe the waveform on the monitor

## The Phlebostatic Axis
- **Location:** Intersection of the 4th intercostal space and the mid-axillary line
- This represents the level of the right atrium
- The transducer MUST be leveled here for accurate readings
- Re-level whenever the patient's position changes

## Reading CVP Waveform
The CVP waveform has three positive waves and two negative descents:
- **a wave:** Atrial contraction (follows P wave on ECG)
- **c wave:** Tricuspid valve closure (follows QRS)
- **v wave:** Venous filling during ventricular systole
- **x descent:** Atrial relaxation
- **y descent:** Tricuspid valve opening

## Nursing Responsibilities
1. **Level and zero** the transducer every shift and with position changes
2. **Assess the waveform** - should correlate with ECG
3. **Monitor trends** - single readings are less valuable than trends
4. **Maintain patency** - flush system, check for blood backup
5. **Prevent infection** - sterile dressing changes per protocol, assess insertion site
6. **Document** - CVP value, patient position, time of measurement
7. **Report** - significant changes (>4 mmHg change from baseline)

## CVP and Fluid Management
- CVP is ONE indicator of fluid status - do not use in isolation
- Combine with: urine output, MAP, lactate, clinical assessment
- **Fluid challenge test:** Give 250-500 mL bolus, if CVP rises >2 mmHg and stays elevated, patient may be fluid-replete
- Dynamic parameters (PPV, SVV) are more reliable than static CVP`,
      sortOrder: 9,
    },
    {
      slug: "icu-mors",
      titleAr: "نظام الإنذار المبكر MORS/MEWS",
      titleEn: "Modified Early Warning Score (MEWS/MORS)",
      contentAr: "نظام الإنذار المبكر المعدل",
      contentEn: `# Modified Early Warning Score (MEWS/MORS)

## Introduction
The Modified Early Warning Score (MEWS), sometimes called MORS (Modified Obstetric Risk Score) in specific settings, is a bedside scoring tool that helps identify patients at risk of clinical deterioration. Early recognition and intervention can prevent cardiac arrests and ICU admissions.

## MEWS Scoring Parameters

| Parameter | Score 3 | Score 2 | Score 1 | Score 0 | Score 1 | Score 2 | Score 3 |
|-----------|---------|---------|---------|---------|---------|---------|---------|
| Systolic BP | <70 | 71-80 | 81-100 | 101-199 | - | ≥200 | - |
| Heart Rate | - | <40 | 41-50 | 51-100 | 101-110 | 111-129 | ≥130 |
| Respiratory Rate | - | <9 | - | 9-14 | 15-20 | 21-29 | ≥30 |
| Temperature | - | <35.0 | - | 35.0-38.4 | - | ≥38.5 | - |
| AVPU | - | - | - | Alert | Voice | Pain | Unresponsive |

## AVPU Scale
- **A** - Alert: Patient is awake and responsive
- **V** - Voice: Responds to verbal stimulation
- **P** - Pain: Responds only to painful stimulation
- **U** - Unresponsive: No response to any stimulation

## Score Interpretation and Actions

| Total Score | Risk Level | Action Required |
|-------------|-----------|-----------------|
| 0-1 | Low risk | Continue routine monitoring every 4-6 hours |
| 2-3 | Medium risk | Increase monitoring to every 1-2 hours, inform charge nurse |
| 4-5 | High risk | Notify physician immediately, consider ICU transfer |
| ≥6 | Critical | Activate Rapid Response Team (RRT), prepare for ICU |
| ≥7 | Emergency | Immediate medical emergency response |

## Nursing Responsibilities

### Assessment
- Calculate MEWS at every vital signs check
- Document the total score and individual parameters
- Reassess more frequently if score is trending upward

### Communication
- Use SBAR format when reporting elevated MEWS
- **S:** "Patient X has a MEWS of 5, increased from 2 four hours ago"
- **B:** Relevant medical history and current treatment
- **A:** Your assessment of the clinical picture
- **R:** What you think needs to happen (e.g., physician review, labs, ICU transfer)

### Escalation
- Follow your hospital's escalation protocol
- Do not wait for the next scheduled assessment if concerned
- Document all communications and actions taken

## Limitations
- Does not replace clinical judgment
- May not capture all deteriorating patients
- Some conditions (e.g., sepsis) may present with normal vital signs initially
- Should be used alongside other assessment tools

## Benefits of Early Warning Scores
- Standardized approach to detecting deterioration
- Empowers nurses to escalate care
- Reduces failure-to-rescue events
- Improves patient outcomes and survival rates`,
      sortOrder: 10,
    },
    {
      slug: "icu-ngt-insertion-feeding",
      titleAr: "إدخال الأنبوب الأنفي المعدي والتغذية",
      titleEn: "NGT Insertion and Feeding",
      contentAr: "إدخال الأنبوب الأنفي المعدي والتغذية",
      contentEn: `# NGT Insertion and Feeding

## What is an NGT?
A Nasogastric Tube (NGT) is a flexible tube inserted through the nose, down the esophagus, and into the stomach. It is used for feeding, medication administration, and gastric decompression.

## Indications
- **Feeding:** Patients unable to swallow safely (stroke, intubated, neurological conditions)
- **Decompression:** Bowel obstruction, post-operative ileus, gastric distension
- **Medication administration:** When oral route is not available
- **Gastric lavage:** Poisoning or overdose

## Types of NGT
| Type | Size | Use | Duration |
|------|------|-----|----------|
| Levin tube | 14-18 Fr | Decompression, short-term feeding | Short-term (<4 weeks) |
| Salem sump | 14-18 Fr | Continuous suction | Short-term |
| Dobhoff/Feeding tube | 8-12 Fr | Enteral feeding | Medium-term |

## NGT Insertion Procedure

### Equipment
- Appropriate size NGT
- Water-soluble lubricant
- 60 mL catheter-tip syringe
- Stethoscope
- pH indicator strips
- Tape or nasal bridle for securing
- Emesis basin, tissues, glass of water with straw

### Steps
1. **Verify order** and explain procedure to patient
2. **Position patient:** High Fowler's (45-90 degrees), head slightly flexed
3. **Measure tube length:** NEX measurement (Nose → Ear → Xiphoid process), mark with tape
4. **Lubricate** the tip of the tube with water-soluble lubricant
5. **Insert** through the nostril, directing posteriorly and downward
6. **Advance** to the oropharynx, ask patient to swallow (sips of water help)
7. **Continue advancing** to the measured mark
8. **Verify placement** (see below)
9. **Secure** the tube to the nose with tape
10. **Document** tube size, nostril used, length at nostril, and verification method

## Confirming NGT Placement (CRITICAL)

### Gold Standard: Chest X-ray
- Required before first use for feeding
- Tip should be below the diaphragm in the stomach

### pH Testing
- Aspirate gastric contents using a syringe
- Test with pH indicator strips
- **Gastric pH:** 1-5.5 (confirms gastric placement)
- **Intestinal pH:** 6-7
- **Respiratory pH:** >7 (DANGER - tube may be in lungs)

### NEVER Use Auscultation Alone
- The "whoosh test" (air injection + listening) is unreliable
- It cannot distinguish between gastric and pulmonary placement

## Enteral Feeding via NGT

### Before Feeding
- Verify tube placement (pH check)
- Check gastric residual volume (GRV)
- Elevate HOB to 30-45 degrees
- Check feeding order: type, rate, volume

### Feeding Methods
- **Continuous:** Pump-controlled, 10-40 mL/hr, preferred in ICU
- **Intermittent/Bolus:** 200-400 mL over 30-60 min, every 4-6 hours

### Monitoring During Feeding
- GRV every 4-6 hours (hold if >500 mL per most guidelines)
- Abdominal distension and bowel sounds
- Signs of aspiration: coughing, desaturation, respiratory distress
- Blood glucose monitoring
- Daily weight and I&O

## Complications
- **Aspiration pneumonia** - most serious complication
- **Tube displacement/migration**
- **Nasal erosion and sinusitis**
- **Tube clogging** - flush with 30 mL warm water every 4-6 hours
- **Electrolyte imbalances** - monitor labs regularly`,
      sortOrder: 11,
    },
    {
      slug: "icu-ifc-insertion",
      titleAr: "إدخال القسطرة البولية IFC",
      titleEn: "Indwelling Foley Catheter (IFC) Insertion",
      contentAr: "إدخال القسطرة البولية الساكنة",
      contentEn: `# Indwelling Foley Catheter (IFC) Insertion

## What is an IFC?
An Indwelling Foley Catheter is a flexible tube inserted through the urethra into the bladder to drain urine continuously. It has an inflatable balloon that holds it in place inside the bladder.

## Indications
- Accurate urine output monitoring in critically ill patients
- Urinary retention
- Perioperative use
- Bladder irrigation
- Patient immobility with incontinence
- End-of-life comfort care

## Catheter Sizes
| Size | Patient | Use |
|------|---------|-----|
| 12-14 Fr | Female adults | Standard |
| 16-18 Fr | Male adults | Standard |
| 20-22 Fr | Post-surgical, clots | Irrigation |
| 6-10 Fr | Pediatric | Age-appropriate |

## Equipment (Sterile Catheterization Kit)
- Foley catheter (appropriate size)
- Sterile drape and gloves
- Antiseptic solution (povidone-iodine or chlorhexidine)
- Sterile lubricant (10 mL syringe for males)
- 10 mL syringe with sterile water for balloon inflation
- Urine collection bag
- Specimen container if needed

## Female Catheterization Procedure
1. Position patient supine with knees bent, feet flat (frog-leg position)
2. Perform hand hygiene, open sterile kit, don sterile gloves
3. Drape the perineal area
4. With non-dominant hand, separate labia to expose urethral meatus
5. Cleanse with antiseptic: front to back, one swab per stroke
6. Lubricate catheter tip
7. Insert catheter gently until urine flows (approximately 5-7 cm)
8. Advance 2-3 cm more after urine appears
9. Inflate balloon with sterile water (usually 10 mL)
10. Gently pull back until resistance is felt
11. Secure catheter to inner thigh
12. Attach to drainage bag below bladder level

## Male Catheterization Procedure
1. Position patient supine
2. Perform hand hygiene, open sterile kit, don sterile gloves
3. Drape the area
4. With non-dominant hand, hold penis at 90-degree angle, retract foreskin if present
5. Cleanse meatus with antiseptic in circular motion
6. Instill 10 mL lubricant into urethra (or lubricate catheter generously)
7. Insert catheter gently (approximately 17-22 cm) until urine flows
8. Advance 2-3 cm more after urine appears
9. Inflate balloon with sterile water
10. Gently pull back until resistance is felt
11. Replace foreskin if retracted
12. Secure catheter to upper thigh or abdomen
13. Attach to drainage bag below bladder level

## CAUTI Prevention Bundle
- **C** - Consider alternatives (condom catheter, intermittent catheterization)
- **A** - Aseptic insertion technique
- **U** - Urine flow maintained (no kinks, bag below bladder)
- **T** - Timely removal (daily reassessment of need)
- **I** - Infection monitoring (cloudy urine, fever, WBC elevation)

## Nursing Monitoring
- Urine output: minimum 0.5 mL/kg/hr
- Color, clarity, and odor of urine
- Catheter patency - no kinks or dependent loops
- Insertion site for signs of infection or irritation
- Balloon integrity
- Secure positioning to prevent traction injury
- Daily assessment of continued need - remove ASAP`,
      sortOrder: 12,
    },
    {
      slug: "icu-tracheostomy-care",
      titleAr: "العناية بفتحة القصبة الهوائية",
      titleEn: "Tracheostomy Care",
      contentAr: "العناية بفتحة القصبة الهوائية",
      contentEn: `# Tracheostomy Care

## What is a Tracheostomy?
A tracheostomy is a surgical opening (stoma) made in the anterior wall of the trachea to establish an airway. A tracheostomy tube is inserted through this opening to maintain the airway.

## Indications
- Prolonged mechanical ventilation (>14 days)
- Upper airway obstruction
- Airway protection in neurological conditions
- Facilitation of pulmonary toilet (secretion management)
- Failed extubation

## Types of Tracheostomy Tubes
| Type | Features | Use |
|------|----------|-----|
| Cuffed | Inflatable cuff prevents air leak | Mechanical ventilation, aspiration risk |
| Uncuffed | No cuff | Weaning, long-term, speaking |
| Fenestrated | Hole in outer cannula | Speaking, weaning |
| Double cannula | Inner + outer cannula | Easier cleaning, prevents obstruction |

## Tracheostomy Care Procedure

### Equipment
- Suction equipment (inline or open)
- Tracheostomy care kit
- Sterile saline or hydrogen peroxide (per policy)
- Clean tracheostomy ties/holder
- Sterile gauze and dressing
- Spare tracheostomy tube (same size AND one size smaller) at bedside

### Suctioning
1. Pre-oxygenate with 100% FiO2 for 30-60 seconds
2. Insert suction catheter without applying suction
3. Insert to just beyond the tip of the tracheostomy tube
4. Apply intermittent suction while withdrawing (max 10-15 seconds)
5. Allow patient to rest between passes
6. Re-oxygenate after suctioning
7. Assess secretion color, amount, consistency, and odor

### Inner Cannula Care
1. Remove inner cannula
2. Clean with sterile saline or hydrogen peroxide solution
3. Rinse thoroughly with sterile saline
4. Reinsert and lock in place
5. Frequency: every 4-8 hours or as needed

### Stoma Care
1. Remove old dressing
2. Clean around stoma with sterile saline using cotton-tipped applicators
3. Clean in circular motion from stoma outward
4. Dry thoroughly
5. Apply pre-cut sterile gauze dressing
6. Change tracheostomy ties (two-person technique recommended)

## Cuff Management
- Check cuff pressure every 8-12 hours
- Maintain cuff pressure: 20-25 cmH2O (minimal occlusive pressure)
- Over-inflation causes tracheal mucosal ischemia and necrosis
- Under-inflation causes aspiration risk and air leak

## Emergency Preparedness
### Always Keep at Bedside:
- Spare tracheostomy tube (same size)
- One size smaller tracheostomy tube
- Obturator for the current tube
- Tracheal dilator (for fresh tracheostomy)
- Ambu bag with tracheostomy adapter
- Suction equipment

### Accidental Decannulation
1. Call for help
2. If fresh tracheostomy (<7 days): DO NOT attempt reinsertion - bag-mask ventilate via mouth/nose
3. If mature tracheostomy (>7 days): Attempt reinsertion, use smaller tube if needed
4. If unable to reinsert: cover stoma, ventilate via mouth/nose
5. Monitor SpO2 and call physician

## Communication Strategies
- Speaking valves (Passy-Muir) for uncuffed or deflated cuff
- Communication boards
- Writing materials
- Electronic communication devices`,
      sortOrder: 13,
    },
    {
      slug: "icu-code-blue",
      titleAr: "أساسيات الشفرة الزرقاء Code Blue",
      titleEn: "Code Blue Basics",
      contentAr: "أساسيات الاستجابة لحالات توقف القلب",
      contentEn: `# Code Blue Basics

## What is a Code Blue?
A Code Blue is an emergency code used in hospitals to indicate a patient in cardiac or respiratory arrest. It activates the resuscitation team for immediate life-saving interventions.

## Chain of Survival
1. **Early recognition** and call for help
2. **Early CPR** with emphasis on chest compressions
3. **Early defibrillation**
4. **Advanced life support** (ACLS)
5. **Post-cardiac arrest care**

## BLS (Basic Life Support) - CAB Approach

### C - Compressions
- **Rate:** 100-120 compressions per minute
- **Depth:** At least 5 cm (2 inches), no more than 6 cm
- **Allow full chest recoil** between compressions
- **Minimize interruptions** (<10 seconds for any pause)
- **Location:** Lower half of sternum
- **Ratio:** 30:2 (compressions to breaths) without advanced airway

### A - Airway
- Head tilt-chin lift (if no cervical spine injury)
- Jaw thrust (if cervical spine injury suspected)
- Insert oral airway (OPA) if no gag reflex
- Prepare for advanced airway (ETT or supraglottic)

### B - Breathing
- Bag-valve-mask (BVM) ventilation
- 1 breath every 6 seconds with advanced airway
- Avoid excessive ventilation
- Watch for chest rise

## Shockable vs Non-Shockable Rhythms

### Shockable Rhythms (Defibrillation Needed)
- **Ventricular Fibrillation (VF):** Chaotic, no organized rhythm
- **Pulseless Ventricular Tachycardia (pVT):** Wide, fast, regular, no pulse

### Non-Shockable Rhythms (No Defibrillation)
- **Asystole:** Flat line (confirm in 2 leads)
- **Pulseless Electrical Activity (PEA):** Organized rhythm but no pulse

## ACLS Medications

| Medication | Dose | Indication | Frequency |
|------------|------|------------|-----------|
| Epinephrine | 1 mg IV/IO | All cardiac arrest rhythms | Every 3-5 minutes |
| Amiodarone | 300 mg IV (1st), 150 mg (2nd) | VF/pVT refractory to shock | After 3rd shock |
| Lidocaine | 1-1.5 mg/kg IV | Alternative to amiodarone | After 3rd shock |
| Atropine | 1 mg IV | Symptomatic bradycardia | Every 3-5 min (max 3 mg) |
| Sodium Bicarbonate | 1 mEq/kg IV | Known acidosis, hyperkalemia | As needed |

## Reversible Causes (H's and T's)

### The H's
- **H**ypovolemia
- **H**ypoxia
- **H**ydrogen ion (acidosis)
- **H**ypo/Hyperkalemia
- **H**ypothermia

### The T's
- **T**ension pneumothorax
- **T**amponade (cardiac)
- **T**oxins
- **T**hrombosis (pulmonary/coronary)

## Nursing Roles During Code Blue
1. **First responder:** Start CPR, call for help, get defibrillator
2. **Compressor:** High-quality chest compressions, rotate every 2 minutes
3. **Airway manager:** BVM ventilation, assist with intubation
4. **IV/IO access:** Establish access, draw labs, prepare medications
5. **Medication nurse:** Prepare and administer medications per protocol
6. **Recorder/Timer:** Document all events, times, and medications
7. **Runner:** Get supplies, blood products, additional equipment

## Post-ROSC (Return of Spontaneous Circulation) Care
- 12-lead ECG immediately
- Targeted temperature management (32-36°C for 24 hours)
- Hemodynamic optimization (MAP >65, avoid hypotension)
- Avoid hyperoxia (target SpO2 92-98%)
- Identify and treat cause of arrest
- Continuous monitoring in ICU`,
      sortOrder: 14,
    },
    {
      slug: "icu-hemodynamic-monitoring",
      titleAr: "المراقبة الديناميكية الدموية",
      titleEn: "Hemodynamic Monitoring",
      contentAr: "المراقبة الديناميكية الدموية في العناية المركزة",
      contentEn: `# Hemodynamic Monitoring

## Introduction
Hemodynamic monitoring is the assessment of the cardiovascular system's ability to deliver oxygen and nutrients to tissues. In the ICU, it guides fluid management, vasopressor therapy, and overall treatment decisions.

## Non-Invasive Monitoring

### Blood Pressure (NIBP)
- Automated cuff measurement
- Limitations: inaccurate in shock, arrhythmias, obesity
- Appropriate cuff size is critical (bladder should cover 80% of arm circumference)

### Pulse Oximetry (SpO2)
- Continuous oxygen saturation monitoring
- Limitations: poor perfusion, nail polish, motion artifact, carbon monoxide

## Invasive Monitoring

### Arterial Line (A-Line)
- **Purpose:** Continuous BP monitoring, frequent ABG sampling
- **Sites:** Radial (most common), femoral, brachial, dorsalis pedis
- **Allen's test:** Must be positive before radial artery cannulation
- **Normal waveform:** Sharp upstroke (systole), dicrotic notch, gradual descent (diastole)
- **Nursing care:** Level and zero every shift, assess waveform, monitor for complications

### Central Venous Catheter (CVC)
- **Purpose:** CVP monitoring, medication administration, fluid resuscitation
- **Normal CVP:** 2-8 mmHg
- **Interpretation:** Reflects right heart preload and volume status

### Pulmonary Artery Catheter (Swan-Ganz)
- **Purpose:** Advanced hemodynamic assessment
- **Parameters measured:**
  - PAP (Pulmonary Artery Pressure): Normal 15-30/4-12 mmHg
  - PAWP (Pulmonary Artery Wedge Pressure): Normal 6-12 mmHg (reflects left heart preload)
  - CO (Cardiac Output): Normal 4-8 L/min
  - CI (Cardiac Index): Normal 2.5-4.0 L/min/m²
  - SVR (Systemic Vascular Resistance): Normal 800-1200 dynes/sec/cm⁻⁵

## Hemodynamic Profiles of Shock

| Type | CO/CI | SVR | CVP | PAWP |
|------|-------|-----|-----|------|
| Hypovolemic | ↓ | ↑ | ↓ | ↓ |
| Cardiogenic | ↓ | ↑ | ↑ | ↑ |
| Distributive (Septic) | ↑ (early) / ↓ (late) | ↓ | ↓/Normal | ↓/Normal |
| Obstructive | ↓ | ↑ | ↑ | Variable |

## Dynamic Parameters
More reliable than static measurements for predicting fluid responsiveness:
- **Pulse Pressure Variation (PPV):** >13% suggests fluid responsiveness
- **Stroke Volume Variation (SVV):** >10-15% suggests fluid responsiveness
- **Passive Leg Raise (PLR):** >10% increase in CO suggests fluid responsiveness
- **IVC Collapsibility:** >50% collapse with inspiration suggests hypovolemia

## Key Nursing Responsibilities
1. **Leveling and zeroing** transducers at the phlebostatic axis
2. **Waveform assessment** - recognize damped or whip artifact
3. **Trend monitoring** - single values are less meaningful than trends
4. **Correlate** hemodynamic data with clinical assessment
5. **Titrate** vasopressors and fluids based on parameters and physician orders
6. **Prevent complications:** infection (dressing changes), thrombosis (flush systems), air embolism
7. **Document** all parameters, interventions, and patient responses`,
      sortOrder: 15,
    },
    {
      slug: "icu-emergency-drugs",
      titleAr: "أدوية الطوارئ",
      titleEn: "Emergency Drugs",
      contentAr: "أدوية الطوارئ في العناية المركزة",
      contentEn: `# Emergency Drugs in ICU

## Introduction
ICU nurses must be familiar with emergency medications, their indications, doses, routes, and potential side effects. Quick and accurate administration can be life-saving.

## Cardiac Arrest Medications

### Epinephrine (Adrenaline)
- **Class:** Sympathomimetic (alpha + beta agonist)
- **Dose:** 1 mg IV/IO every 3-5 minutes during cardiac arrest
- **Infusion:** 0.01-0.1 mcg/kg/min for hemodynamic support
- **Indications:** Cardiac arrest (all rhythms), anaphylaxis, severe bradycardia
- **Key points:** Most important drug in cardiac arrest, causes vasoconstriction and increases coronary perfusion

### Amiodarone
- **Class:** Antiarrhythmic (Class III)
- **Dose:** 300 mg IV bolus (1st dose), 150 mg IV (2nd dose) in cardiac arrest
- **Infusion:** 1 mg/min for 6 hours, then 0.5 mg/min for 18 hours
- **Indications:** VF/pVT refractory to defibrillation, stable VT, AF rate control
- **Key points:** Mix in D5W only, monitor for hypotension and bradycardia

### Atropine
- **Class:** Anticholinergic (parasympatholytic)
- **Dose:** 0.5-1 mg IV every 3-5 minutes (max 3 mg)
- **Indications:** Symptomatic bradycardia, organophosphate poisoning
- **Key points:** NOT recommended for asystole/PEA in current ACLS guidelines

## Vasopressors

### Norepinephrine (Levophed)
- **Class:** Alpha-1 agonist (primary), Beta-1 agonist (secondary)
- **Dose:** 0.01-3 mcg/kg/min IV infusion
- **Indications:** First-line vasopressor for septic shock
- **Key points:** Central line preferred, monitor for tissue ischemia, titrate to MAP >65

### Vasopressin
- **Class:** Antidiuretic hormone analog
- **Dose:** 0.03-0.04 units/min IV (fixed dose, not titrated)
- **Indications:** Adjunct to norepinephrine in septic shock, cardiac arrest
- **Key points:** Does not increase heart rate, can be given peripherally short-term

### Dopamine
- **Class:** Dose-dependent sympathomimetic
- **Dose:** 2-20 mcg/kg/min IV
- **Effects by dose:**
  - Low (1-5): Renal vasodilation (dopaminergic)
  - Medium (5-10): Increased CO (beta-1)
  - High (>10): Vasoconstriction (alpha-1)
- **Key points:** Higher arrhythmia risk than norepinephrine

### Dobutamine
- **Class:** Beta-1 agonist (inotrope)
- **Dose:** 2-20 mcg/kg/min IV
- **Indications:** Cardiogenic shock, low cardiac output
- **Key points:** Increases contractility, may cause hypotension (beta-2 vasodilation)

## Other Critical Medications

### Adenosine
- **Dose:** 6 mg rapid IV push (1st), 12 mg (2nd and 3rd)
- **Indications:** SVT (supraventricular tachycardia)
- **Key points:** Must give rapid push followed by 20 mL NS flush, warn patient about brief chest discomfort

### Naloxone (Narcan)
- **Dose:** 0.4-2 mg IV/IM/IN, repeat every 2-3 minutes
- **Indications:** Opioid overdose/respiratory depression
- **Key points:** Short half-life, may need repeat doses or infusion

### Dextrose 50% (D50)
- **Dose:** 25-50 mL IV (12.5-25 g glucose)
- **Indications:** Severe hypoglycemia (<70 mg/dL with symptoms)
- **Key points:** Check blood glucose before and after, very hypertonic - central line preferred

### Calcium Chloride/Gluconate
- **Dose:** CaCl 500-1000 mg IV or Ca Gluconate 1-3 g IV
- **Indications:** Hyperkalemia, calcium channel blocker overdose, hypocalcemia
- **Key points:** CaCl has 3x more elemental calcium, give slowly, monitor ECG

### Sodium Bicarbonate
- **Dose:** 1 mEq/kg IV
- **Indications:** Severe metabolic acidosis (pH <7.1), hyperkalemia, TCA overdose
- **Key points:** Do not mix with calcium, monitor ABGs

## Nursing Responsibilities with Emergency Drugs
1. **Know** the location of the crash cart and emergency medications
2. **Check** crash cart daily - medications, expiration dates, equipment
3. **Calculate** weight-based doses quickly (know patient's weight in kg)
4. **Verify** the 5 Rights: Right patient, drug, dose, route, time
5. **Monitor** for therapeutic effects and side effects
6. **Document** all medications given with exact times
7. **Communicate** clearly during emergencies using closed-loop communication`,
      sortOrder: 16,
    },
  ];

  // Insert lessons
  const lessonIds = [];
  for (const lesson of icuLessons) {
    try {
      const existing = await db.select().from(lessons).where(eq(lessons.slug, lesson.slug)).limit(1);
      if (existing.length > 0) {
        lessonIds.push(existing[0]);
        console.log(`⏩ Lesson exists: ${lesson.titleEn}`);
        continue;
      }
      const result = await db.insert(lessons).values({
        ...lesson,
        sectionId: icuSectionId,
      });
      lessonIds.push({ id: result[0].insertId });
      console.log(`✅ Lesson: ${lesson.titleEn}`);
    } catch (e) {
      console.log(`❌ Error: ${lesson.titleEn}`, e.message);
      lessonIds.push(null);
    }
  }

  // Step 4: Add quizzes for each lesson
  const quizData = [
    { lessonIndex: 0, titleEn: "Quiz: Nursing Health Assessment", questions: [
      { questionEn: "What does the 'A' in the ABCDE approach stand for?", optionAEn: "Assessment", optionBEn: "Airway", optionCEn: "Abdomen", optionDEn: "Auscultation", correctOption: "B" },
      { questionEn: "How often should GCS be assessed in ICU?", optionAEn: "Once daily", optionBEn: "Every 8 hours", optionCEn: "Every 1-4 hours", optionDEn: "Only on admission", correctOption: "C" },
      { questionEn: "What is the minimum acceptable urine output per hour?", optionAEn: "0.5 mL/kg/hr", optionBEn: "1 mL/kg/hr", optionCEn: "2 mL/kg/hr", optionDEn: "0.1 mL/kg/hr", correctOption: "A" },
      { questionEn: "Which scale is used for pressure injury risk assessment?", optionAEn: "Glasgow Scale", optionBEn: "RASS Scale", optionCEn: "Braden Scale", optionDEn: "Norton Scale", correctOption: "C" },
    ]},
    { lessonIndex: 1, titleEn: "Quiz: Glasgow Coma Scale", questions: [
      { questionEn: "What is the maximum GCS score?", optionAEn: "12", optionBEn: "15", optionCEn: "10", optionDEn: "20", correctOption: "B" },
      { questionEn: "A GCS of 7 indicates:", optionAEn: "Mild brain injury", optionBEn: "Moderate brain injury", optionCEn: "Severe brain injury", optionDEn: "Normal consciousness", correctOption: "C" },
      { questionEn: "What score is given for 'Localizing pain' in motor response?", optionAEn: "4", optionBEn: "5", optionCEn: "3", optionDEn: "6", correctOption: "B" },
      { questionEn: "How is verbal response recorded for intubated patients?", optionAEn: "Score 1", optionBEn: "Not assessed", optionCEn: "Recorded as 'T'", optionDEn: "Score 5", correctOption: "C" },
    ]},
    { lessonIndex: 2, titleEn: "Quiz: RASS Scale", questions: [
      { questionEn: "What RASS score indicates 'Alert and Calm'?", optionAEn: "-1", optionBEn: "0", optionCEn: "+1", optionDEn: "-2", correctOption: "B" },
      { questionEn: "RASS +4 means the patient is:", optionAEn: "Drowsy", optionBEn: "Restless", optionCEn: "Combative", optionDEn: "Deeply sedated", correctOption: "C" },
      { questionEn: "What is the target RASS for general ICU patients?", optionAEn: "-4 to -5", optionBEn: "0 to -2", optionCEn: "+2 to +4", optionDEn: "-3 to -4", correctOption: "B" },
      { questionEn: "CAM-ICU cannot be performed if RASS is:", optionAEn: "0", optionBEn: "-1 to -2", optionCEn: "-4 or -5", optionDEn: "+1 to +2", correctOption: "C" },
    ]},
    { lessonIndex: 3, titleEn: "Quiz: ICU Basics", questions: [
      { questionEn: "What does MICU stand for?", optionAEn: "Mobile ICU", optionBEn: "Medical ICU", optionCEn: "Maternal ICU", optionDEn: "Minor ICU", correctOption: "B" },
      { questionEn: "What is the typical nurse-to-patient ratio in ICU?", optionAEn: "1:4", optionBEn: "1:6", optionCEn: "1:1 or 1:2", optionDEn: "1:8", correctOption: "C" },
      { questionEn: "What does the 'D' in ABCDEF bundle stand for?", optionAEn: "Drugs", optionBEn: "Delirium", optionCEn: "Documentation", optionDEn: "Discharge", correctOption: "B" },
      { questionEn: "Which vasopressor is first-line for septic shock?", optionAEn: "Dopamine", optionBEn: "Dobutamine", optionCEn: "Norepinephrine", optionDEn: "Vasopressin", correctOption: "C" },
    ]},
    { lessonIndex: 4, titleEn: "Quiz: Vital Signs in ICU", questions: [
      { questionEn: "What is the formula for MAP?", optionAEn: "(SBP + DBP) / 2", optionBEn: "(SBP + 2×DBP) / 3", optionCEn: "SBP - DBP", optionDEn: "(2×SBP + DBP) / 3", correctOption: "B" },
      { questionEn: "What is the target MAP for organ perfusion?", optionAEn: ">50 mmHg", optionBEn: ">65 mmHg", optionCEn: ">80 mmHg", optionDEn: ">100 mmHg", correctOption: "B" },
      { questionEn: "Normal ICP range is:", optionAEn: "0-5 mmHg", optionBEn: "5-15 mmHg", optionCEn: "15-25 mmHg", optionDEn: "25-35 mmHg", correctOption: "B" },
      { questionEn: "SpO2 may be unreliable in all EXCEPT:", optionAEn: "Poor perfusion", optionBEn: "Carbon monoxide poisoning", optionCEn: "Normal circulation", optionDEn: "Hypothermia", correctOption: "C" },
    ]},
    { lessonIndex: 5, titleEn: "Quiz: Ventilator Basics", questions: [
      { questionEn: "What is the lung-protective tidal volume?", optionAEn: "10-12 mL/kg", optionBEn: "6-8 mL/kg IBW", optionCEn: "15-20 mL/kg", optionDEn: "2-4 mL/kg", correctOption: "B" },
      { questionEn: "What does PEEP prevent?", optionAEn: "Tachycardia", optionBEn: "Alveolar collapse", optionCEn: "Hypertension", optionDEn: "Fever", correctOption: "B" },
      { questionEn: "High pressure alarm may indicate:", optionAEn: "Circuit disconnect", optionBEn: "Secretions or bronchospasm", optionCEn: "Cuff leak", optionDEn: "Low tidal volume", correctOption: "B" },
      { questionEn: "FiO2 above what percentage can cause oxygen toxicity?", optionAEn: "40%", optionBEn: "50%", optionCEn: "60%", optionDEn: "80%", correctOption: "C" },
    ]},
    { lessonIndex: 6, titleEn: "Quiz: ABG Analysis", questions: [
      { questionEn: "Normal blood pH range is:", optionAEn: "7.25-7.35", optionBEn: "7.35-7.45", optionCEn: "7.45-7.55", optionDEn: "7.0-7.2", correctOption: "B" },
      { questionEn: "pH 7.28, PaCO2 55, HCO3 24 indicates:", optionAEn: "Metabolic acidosis", optionBEn: "Respiratory acidosis", optionCEn: "Respiratory alkalosis", optionDEn: "Metabolic alkalosis", correctOption: "B" },
      { questionEn: "In the ROME mnemonic, 'Respiratory = Opposite' means:", optionAEn: "pH and HCO3 move opposite", optionBEn: "pH and PaCO2 move in opposite directions", optionCEn: "PaCO2 and HCO3 are opposite", optionDEn: "None of the above", correctOption: "B" },
      { questionEn: "DKA typically causes:", optionAEn: "Respiratory acidosis", optionBEn: "Metabolic alkalosis", optionCEn: "Metabolic acidosis", optionDEn: "Respiratory alkalosis", correctOption: "C" },
    ]},
    { lessonIndex: 7, titleEn: "Quiz: ECG for Nurses", questions: [
      { questionEn: "The SA node fires at a rate of:", optionAEn: "20-40 bpm", optionBEn: "40-60 bpm", optionCEn: "60-100 bpm", optionDEn: "100-150 bpm", correctOption: "C" },
      { questionEn: "Normal PR interval is:", optionAEn: "0.06-0.10 sec", optionBEn: "0.12-0.20 sec", optionCEn: "0.20-0.30 sec", optionDEn: "0.30-0.40 sec", correctOption: "B" },
      { questionEn: "Atrial fibrillation is characterized by:", optionAEn: "Regular rhythm with P waves", optionBEn: "Irregularly irregular with no P waves", optionCEn: "Sawtooth pattern", optionDEn: "Wide QRS complexes", correctOption: "B" },
      { questionEn: "V-Fib requires immediate:", optionAEn: "Atropine", optionBEn: "Defibrillation", optionCEn: "Adenosine", optionDEn: "Observation", correctOption: "B" },
    ]},
    { lessonIndex: 8, titleEn: "Quiz: CVP Monitoring", questions: [
      { questionEn: "Normal CVP range is:", optionAEn: "2-8 mmHg", optionBEn: "10-20 mmHg", optionCEn: "0-1 mmHg", optionDEn: "20-30 mmHg", correctOption: "A" },
      { questionEn: "The phlebostatic axis is at the:", optionAEn: "2nd intercostal space, midclavicular line", optionBEn: "4th intercostal space, mid-axillary line", optionCEn: "6th intercostal space, anterior axillary line", optionDEn: "Sternal notch", correctOption: "B" },
      { questionEn: "High CVP may indicate:", optionAEn: "Dehydration", optionBEn: "Hemorrhage", optionCEn: "Right heart failure", optionDEn: "Hypovolemia", correctOption: "C" },
      { questionEn: "The 'a' wave in CVP waveform represents:", optionAEn: "Ventricular contraction", optionBEn: "Atrial contraction", optionCEn: "Valve closure", optionDEn: "Venous filling", correctOption: "B" },
    ]},
    { lessonIndex: 9, titleEn: "Quiz: MEWS/MORS", questions: [
      { questionEn: "A MEWS score of 5 requires:", optionAEn: "Routine monitoring", optionBEn: "Notify physician, consider ICU", optionCEn: "No action needed", optionDEn: "Discharge planning", correctOption: "B" },
      { questionEn: "In AVPU, 'P' stands for:", optionAEn: "Pulse", optionBEn: "Pressure", optionCEn: "Pain response", optionDEn: "Pupil reaction", correctOption: "C" },
      { questionEn: "What communication format should be used for elevated MEWS?", optionAEn: "SOAP", optionBEn: "SBAR", optionCEn: "DAR", optionDEn: "PIE", correctOption: "B" },
      { questionEn: "MEWS score ≥7 indicates:", optionAEn: "Low risk", optionBEn: "Medium risk", optionCEn: "High risk", optionDEn: "Emergency response needed", correctOption: "D" },
    ]},
    { lessonIndex: 10, titleEn: "Quiz: NGT Insertion and Feeding", questions: [
      { questionEn: "NEX measurement is from:", optionAEn: "Nose to Ear to Xiphoid", optionBEn: "Neck to Elbow to Xiphoid", optionCEn: "Nose to Eye to Xiphoid", optionDEn: "Navel to Ear to Xiphoid", correctOption: "A" },
      { questionEn: "Gastric pH for confirming NGT placement should be:", optionAEn: "7-8", optionBEn: "1-5.5", optionCEn: "6-7", optionDEn: "8-10", correctOption: "B" },
      { questionEn: "The gold standard for NGT placement verification is:", optionAEn: "Auscultation", optionBEn: "pH testing alone", optionCEn: "Chest X-ray", optionDEn: "Visual inspection", correctOption: "C" },
      { questionEn: "GRV should be held if it exceeds:", optionAEn: "100 mL", optionBEn: "250 mL", optionCEn: "500 mL", optionDEn: "50 mL", correctOption: "C" },
    ]},
    { lessonIndex: 11, titleEn: "Quiz: IFC Insertion", questions: [
      { questionEn: "Standard catheter size for adult females is:", optionAEn: "6-10 Fr", optionBEn: "12-14 Fr", optionCEn: "20-22 Fr", optionDEn: "24-26 Fr", correctOption: "B" },
      { questionEn: "What does CAUTI stand for?", optionAEn: "Catheter-Associated Urinary Tract Infection", optionBEn: "Central Access Urinary Treatment Indication", optionCEn: "Catheter Adjustment Under Treatment Instruction", optionDEn: "Clinical Assessment of Urinary Tract Integrity", correctOption: "A" },
      { questionEn: "Minimum acceptable urine output is:", optionAEn: "0.5 mL/kg/hr", optionBEn: "1 mL/kg/hr", optionCEn: "2 mL/kg/hr", optionDEn: "0.1 mL/kg/hr", correctOption: "A" },
      { questionEn: "The most important CAUTI prevention measure is:", optionAEn: "Using the largest catheter", optionBEn: "Timely removal when no longer needed", optionCEn: "Changing catheter daily", optionDEn: "Using antibiotics prophylactically", correctOption: "B" },
    ]},
    { lessonIndex: 12, titleEn: "Quiz: Tracheostomy Care", questions: [
      { questionEn: "Recommended cuff pressure for tracheostomy is:", optionAEn: "10-15 cmH2O", optionBEn: "20-25 cmH2O", optionCEn: "30-40 cmH2O", optionDEn: "5-10 cmH2O", correctOption: "B" },
      { questionEn: "Maximum suctioning time per pass is:", optionAEn: "5 seconds", optionBEn: "10-15 seconds", optionCEn: "30 seconds", optionDEn: "60 seconds", correctOption: "B" },
      { questionEn: "What should always be kept at the bedside of a tracheostomy patient?", optionAEn: "Only suction equipment", optionBEn: "Spare tube same size AND one size smaller", optionCEn: "Oxygen mask only", optionDEn: "Feeding supplies", correctOption: "B" },
      { questionEn: "For a fresh tracheostomy (<7 days) that accidentally comes out, you should:", optionAEn: "Reinsert immediately", optionBEn: "Bag-mask ventilate via mouth/nose, do NOT reinsert", optionCEn: "Wait for the doctor", optionDEn: "Apply oxygen to the stoma", correctOption: "B" },
    ]},
    { lessonIndex: 13, titleEn: "Quiz: Code Blue Basics", questions: [
      { questionEn: "Chest compression rate should be:", optionAEn: "60-80/min", optionBEn: "100-120/min", optionCEn: "80-100/min", optionDEn: "120-150/min", correctOption: "B" },
      { questionEn: "Epinephrine dose in cardiac arrest is:", optionAEn: "0.5 mg", optionBEn: "1 mg every 3-5 min", optionCEn: "2 mg once", optionDEn: "5 mg once", correctOption: "B" },
      { questionEn: "Which rhythm requires defibrillation?", optionAEn: "Asystole", optionBEn: "PEA", optionCEn: "Ventricular Fibrillation", optionDEn: "Sinus bradycardia", correctOption: "C" },
      { questionEn: "The H's and T's help identify:", optionAEn: "Medication doses", optionBEn: "Reversible causes of cardiac arrest", optionCEn: "ECG rhythms", optionDEn: "Ventilator settings", correctOption: "B" },
    ]},
    { lessonIndex: 14, titleEn: "Quiz: Hemodynamic Monitoring", questions: [
      { questionEn: "Allen's test is performed before cannulating which artery?", optionAEn: "Femoral", optionBEn: "Radial", optionCEn: "Brachial", optionDEn: "Carotid", correctOption: "B" },
      { questionEn: "Normal cardiac output is:", optionAEn: "1-3 L/min", optionBEn: "4-8 L/min", optionCEn: "10-15 L/min", optionDEn: "0.5-1 L/min", correctOption: "B" },
      { questionEn: "In septic shock (early), CO is typically:", optionAEn: "Decreased", optionBEn: "Increased", optionCEn: "Normal", optionDEn: "Absent", correctOption: "B" },
      { questionEn: "PPV >13% suggests the patient is:", optionAEn: "Fluid overloaded", optionBEn: "Fluid responsive", optionCEn: "In cardiac arrest", optionDEn: "Hypertensive", correctOption: "B" },
    ]},
    { lessonIndex: 15, titleEn: "Quiz: Emergency Drugs", questions: [
      { questionEn: "First-line vasopressor for septic shock is:", optionAEn: "Dopamine", optionBEn: "Norepinephrine", optionCEn: "Dobutamine", optionDEn: "Epinephrine", correctOption: "B" },
      { questionEn: "Adenosine is used for:", optionAEn: "Cardiac arrest", optionBEn: "SVT (supraventricular tachycardia)", optionCEn: "Bradycardia", optionDEn: "Hypertension", correctOption: "B" },
      { questionEn: "Naloxone reverses the effects of:", optionAEn: "Benzodiazepines", optionBEn: "Opioids", optionCEn: "Beta-blockers", optionDEn: "Calcium channel blockers", correctOption: "B" },
      { questionEn: "Amiodarone in cardiac arrest: first dose is:", optionAEn: "150 mg", optionBEn: "300 mg", optionCEn: "450 mg", optionDEn: "100 mg", correctOption: "B" },
    ]},
  ];

  for (const q of quizData) {
    if (!lessonIds[q.lessonIndex]) continue;
    const lessonId = lessonIds[q.lessonIndex].id;
    try {
      const existing = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).limit(1);
      if (existing.length > 0) {
        console.log(`⏩ Quiz exists: ${q.titleEn}`);
        continue;
      }
      const quizResult = await db.insert(quizzes).values({
        lessonId,
        titleAr: q.titleEn,
        titleEn: q.titleEn,
        passingScore: 70,
      });
      const quizId = quizResult[0].insertId;
      for (let i = 0; i < q.questions.length; i++) {
        const qn = q.questions[i];
        await db.insert(quizQuestions).values({
          quizId,
          questionAr: qn.questionEn,
          questionEn: qn.questionEn,
          optionAAr: qn.optionAEn,
          optionBAr: qn.optionBEn,
          optionCAr: qn.optionCEn,
          optionDAr: qn.optionDEn,
          optionAEn: qn.optionAEn,
          optionBEn: qn.optionBEn,
          optionCEn: qn.optionCEn,
          optionDEn: qn.optionDEn,
          correctOption: qn.correctOption,
          sortOrder: i,
        });
      }
      console.log(`✅ Quiz: ${q.titleEn} (${q.questions.length} questions)`);
    } catch (e) {
      console.log(`❌ Quiz error: ${q.titleEn}`, e.message);
    }
  }

  console.log("\n🎉 ICU section with 16 lessons and quizzes added successfully!");
  process.exit(0);
}

seed().catch(e => {
  console.error("❌ Error:", e);
  process.exit(1);
});
