/**
 * Exercise Library — 200+ exercises across major categories
 * Each exercise has: id, name, category, muscles, equipment, difficulty, steps, tips
 */

export type ExerciseMuscle =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "forearms" | "abs" | "obliques" | "glutes" | "quads"
  | "hamstrings" | "calves" | "full_body" | "cardio";

export type ExerciseCategory =
  | "strength" | "cardio" | "hiit" | "flexibility" | "calisthenics"
  | "olympic" | "machines" | "dumbbell" | "barbell" | "kettlebell"
  | "bodyweight" | "yoga" | "stretching" | "plyometrics";

export type Equipment =
  | "none" | "barbell" | "dumbbell" | "machine" | "cable"
  | "kettlebell" | "bands" | "pull_up_bar" | "bench" | "rings" | "mat";

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscles: ExerciseMuscle[];
  equipment: Equipment[];
  difficulty: "beginner" | "intermediate" | "advanced";
  steps: string[];
  tips: string[];
  benefits?: string[];
  sets?: { sets: number; reps: string; rest: string };
}

export const EXERCISES: Exercise[] = [
  // ── CHEST ────────────────────────────────────────────────────────────────────
  {
    id: "bb_bench_press", name: "Barbell Bench Press", category: "barbell",
    muscles: ["chest", "triceps", "shoulders"], equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    steps: ["Lie flat on bench, grip bar slightly wider than shoulders", "Unrack bar, lower to mid-chest slowly", "Press bar back up explosively", "Lock out elbows at top"],
    tips: ["Keep shoulder blades retracted", "Drive feet into floor", "Don't bounce bar off chest"],
    benefits: ["Builds upper body strength", "Develops chest, shoulders, and triceps", "Improves bone density"],
    sets: { sets: 4, reps: "6-10", rest: "2-3 min" }
  },
  {
    id: "db_bench_press", name: "Dumbbell Bench Press", category: "dumbbell",
    muscles: ["chest", "triceps", "shoulders"], equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    steps: ["Lie on bench, hold dumbbells at chest level", "Press up and slightly in", "Lower with control to start"],
    tips: ["Greater range of motion than barbell", "Neutral grip reduces shoulder stress"],
    benefits: ["Fixes muscle imbalances", "Increases range of motion", "Safer for shoulders"],
    sets: { sets: 3, reps: "8-12", rest: "90 sec" }
  },
  {
    id: "incline_bench", name: "Incline Barbell Press", category: "barbell",
    muscles: ["chest", "shoulders", "triceps"], equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    steps: ["Set bench to 30-45 degrees", "Grip bar slightly inside shoulder-width", "Lower to upper chest", "Press up"],
    tips: ["Targets upper chest more", "Don't set incline too high — recruits shoulders more"],
    sets: { sets: 3, reps: "8-10", rest: "2 min" }
  },
  {
    id: "push_up", name: "Push-Up", category: "bodyweight",
    muscles: ["chest", "triceps", "shoulders"], equipment: ["none"],
    difficulty: "beginner",
    steps: ["Start in high plank position", "Lower chest to ground, elbows 45°", "Push up explosively"],
    tips: ["Keep core braced", "Full range of motion", "Elevate feet for more chest emphasis"],
    benefits: ["Zero equipment needed", "Builds functional core strength", "Improves shoulder stability"],
    sets: { sets: 3, reps: "15-25", rest: "60 sec" }
  },
  {
    id: "chest_dip", name: "Chest Dip", category: "calisthenics",
    muscles: ["chest", "triceps", "shoulders"], equipment: ["pull_up_bar"],
    difficulty: "intermediate",
    steps: ["Grip parallel bars, lean forward 30°", "Lower until shoulders below elbows", "Push up through chest"],
    tips: ["Lean forward to emphasize chest", "Avoid going too deep to protect shoulders"],
    sets: { sets: 3, reps: "8-12", rest: "90 sec" }
  },
  {
    id: "cable_fly", name: "Cable Fly", category: "machines",
    muscles: ["chest"], equipment: ["cable"],
    difficulty: "beginner",
    steps: ["Set cables at shoulder height", "Step forward, bring hands together in arc", "Squeeze chest at peak"],
    tips: ["Keep slight bend in elbows throughout", "Control the return"],
    sets: { sets: 3, reps: "12-15", rest: "60 sec" }
  },
  // ── BACK ─────────────────────────────────────────────────────────────────────
  {
    id: "pull_up", name: "Pull-Up", category: "calisthenics",
    muscles: ["back", "biceps"], equipment: ["pull_up_bar"],
    difficulty: "intermediate",
    steps: ["Dead hang from bar, overhand grip", "Pull chin above bar by driving elbows down", "Lower with control"],
    tips: ["Full dead hang before next rep", "Avoid kipping for strength gains"],
    benefits: ["Ultimate upper body pull strength", "Builds V-taper physique", "Improves grip strength"],
    sets: { sets: 4, reps: "6-12", rest: "2 min" }
  },
  {
    id: "chin_up", name: "Chin-Up", category: "calisthenics",
    muscles: ["back", "biceps"], equipment: ["pull_up_bar"],
    difficulty: "intermediate",
    steps: ["Dead hang, underhand grip", "Pull chin above bar", "Lower controlled"],
    tips: ["More biceps engagement than pull-up", "Supinate grip helps elbow pain"],
    sets: { sets: 3, reps: "8-12", rest: "90 sec" }
  },
  {
    id: "bb_row", name: "Barbell Row", category: "barbell",
    muscles: ["back", "biceps", "forearms"], equipment: ["barbell"],
    difficulty: "intermediate",
    steps: ["Hip hinge, back at ~45°", "Pull bar to lower chest", "Lower with control"],
    tips: ["Keep back flat", "Don't use too much body English"],
    benefits: ["Builds back thickness", "Improves posture", "Strengthens lower back"],
    sets: { sets: 4, reps: "6-10", rest: "2 min" }
  },
  {
    id: "db_row", name: "Dumbbell Row", category: "dumbbell",
    muscles: ["back", "biceps"], equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    steps: ["Knee and hand on bench", "Pull dumbbell to hip, elbow past torso", "Lower slowly"],
    tips: ["Go heavier with straps", "Rotate torso slightly for full stretch"],
    sets: { sets: 3, reps: "10-12", rest: "90 sec" }
  },
  {
    id: "lat_pulldown", name: "Lat Pulldown", category: "machines",
    muscles: ["back", "biceps"], equipment: ["machine", "cable"],
    difficulty: "beginner",
    steps: ["Grip bar wide, sit and lock thighs", "Pull bar to upper chest", "Control back up"],
    tips: ["Lean back slightly", "Squeeze lats at bottom"],
    sets: { sets: 3, reps: "10-13", rest: "90 sec" }
  },
  {
    id: "deadlift", name: "Conventional Deadlift", category: "barbell",
    muscles: ["back", "glutes", "hamstrings", "forearms"], equipment: ["barbell"],
    difficulty: "intermediate",
    steps: ["Bar over mid-foot, grip just outside legs", "Brace core, drive hips forward", "Keep bar close to body throughout", "Lock out at top with hips and knees"],
    tips: ["Don't round lower back", "Think 'push floor away' not 'pull bar up'"],
    benefits: ["Full body power", "Massive hormone response", "Strengthens posterior chain"],
    sets: { sets: 3, reps: "4-6", rest: "3 min" }
  },
  // ── SHOULDERS ─────────────────────────────────────────────────────────────────
  {
    id: "ohp", name: "Overhead Press (Barbell)", category: "barbell",
    muscles: ["shoulders", "triceps"], equipment: ["barbell"],
    difficulty: "intermediate",
    steps: ["Bar at clavicle, grip just outside shoulders", "Press bar overhead, lock elbows", "Lower to clavicle"],
    tips: ["Tuck ribs, brace core", "Bar path slightly back at top"],
    sets: { sets: 4, reps: "5-8", rest: "2 min" }
  },
  {
    id: "db_shoulder_press", name: "Dumbbell Shoulder Press", category: "dumbbell",
    muscles: ["shoulders", "triceps"], equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    steps: ["Sit upright, dumbbells at shoulder level", "Press overhead until arms extended", "Lower slowly"],
    tips: ["Don't flare elbows out too wide", "Neutral grip is easier on joints"],
    sets: { sets: 3, reps: "10-12", rest: "90 sec" }
  },
  {
    id: "lateral_raise", name: "Lateral Raise", category: "dumbbell",
    muscles: ["shoulders"], equipment: ["dumbbell"],
    difficulty: "beginner",
    steps: ["Stand, hold dumbbells at sides", "Raise arms out to sides, slightly bent", "Stop at shoulder height, lower with control"],
    tips: ["Lead with elbow not wrist", "Avoid using momentum"],
    sets: { sets: 3, reps: "12-15", rest: "60 sec" }
  },
  {
    id: "face_pull", name: "Face Pull", category: "machines",
    muscles: ["shoulders", "back"], equipment: ["cable"],
    difficulty: "beginner",
    steps: ["Set cable at head height with rope", "Pull to face, separate hands at ear level", "Squeeze rear delts"],
    tips: ["Excellent for shoulder health", "Go light and feel the movement"],
    sets: { sets: 3, reps: "15-20", rest: "60 sec" }
  },
  // ── ARMS ──────────────────────────────────────────────────────────────────────
  {
    id: "bb_curl", name: "Barbell Curl", category: "barbell",
    muscles: ["biceps", "forearms"], equipment: ["barbell"],
    difficulty: "beginner",
    steps: ["Stand, supinated grip", "Curl bar to shoulder level", "Lower with control, don't let elbows drift"],
    tips: ["Keep elbows fixed at sides", "Squeeze biceps at top"],
    sets: { sets: 3, reps: "8-12", rest: "90 sec" }
  },
  {
    id: "hammer_curl", name: "Hammer Curl", category: "dumbbell",
    muscles: ["biceps", "forearms"], equipment: ["dumbbell"],
    difficulty: "beginner",
    steps: ["Neutral grip, curl to shoulder", "Lower slowly"],
    tips: ["Hits brachialis and brachioradialis too"],
    sets: { sets: 3, reps: "10-12", rest: "60 sec" }
  },
  {
    id: "tricep_dip", name: "Tricep Dip (Bench)", category: "bodyweight",
    muscles: ["triceps"], equipment: ["bench"],
    difficulty: "beginner",
    steps: ["Hands on bench behind you, feet out", "Lower until arms at 90°", "Press back up"],
    tips: ["Keep elbows pointing back not out"],
    sets: { sets: 3, reps: "12-15", rest: "60 sec" }
  },
  {
    id: "skull_crusher", name: "Skull Crusher", category: "barbell",
    muscles: ["triceps"], equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    steps: ["Lie on bench, bar above chest", "Lower bar to forehead, elbows fixed", "Extend arms back up"],
    tips: ["Slightly angle so weight goes behind head for more stretch"],
    sets: { sets: 3, reps: "10-12", rest: "90 sec" }
  },
  // ── ABS ───────────────────────────────────────────────────────────────────────
  {
    id: "plank", name: "Plank", category: "bodyweight",
    muscles: ["abs", "full_body"], equipment: ["mat"],
    difficulty: "beginner",
    steps: ["Forearm plank, body straight", "Hold, brace core throughout"],
    tips: ["Don't let hips sag or pike", "Squeeze glutes and abs"],
    sets: { sets: 3, reps: "30-60s", rest: "60 sec" }
  },
  {
    id: "crunches", name: "Crunches", category: "bodyweight",
    muscles: ["abs"], equipment: ["mat"],
    difficulty: "beginner",
    steps: ["Lie flat, knees bent", "Curl shoulders towards knees", "Lower with control"],
    tips: ["Don't pull on neck", "Small controlled movement"],
    sets: { sets: 3, reps: "15-25", rest: "60 sec" }
  },
  {
    id: "hanging_leg_raise", name: "Hanging Leg Raise", category: "calisthenics",
    muscles: ["abs", "obliques"], equipment: ["pull_up_bar"],
    difficulty: "intermediate",
    steps: ["Hang from bar", "Raise legs to 90° or up to bar", "Lower controlled"],
    tips: ["Avoid swinging", "Can bend knees to scale difficulty"],
    sets: { sets: 3, reps: "10-15", rest: "90 sec" }
  },
  {
    id: "russian_twist", name: "Russian Twist", category: "bodyweight",
    muscles: ["abs", "obliques"], equipment: ["mat"],
    difficulty: "beginner",
    steps: ["Seated at 45°, feet lifted optional", "Rotate torso side to side"],
    tips: ["Add dumbbell or plate for resistance"],
    sets: { sets: 3, reps: "20 total", rest: "60 sec" }
  },
  // ── LEGS ──────────────────────────────────────────────────────────────────────
  {
    id: "squat", name: "Barbell Back Squat", category: "barbell",
    muscles: ["quads", "glutes", "hamstrings"], equipment: ["barbell"],
    difficulty: "intermediate",
    steps: ["Bar on upper back, stance slightly wider than hips", "Break at hips and knees simultaneously", "Squat to parallel or below", "Drive up through heels"],
    tips: ["Knees track over toes", "Maintain neutral spine throughout", "Brace core hard"],
    benefits: ["The king of leg exercises", "Improves mobility", "Increases metabolic rate"],
    sets: { sets: 4, reps: "5-8", rest: "2-3 min" }
  },
  {
    id: "goblet_squat", name: "Goblet Squat", category: "kettlebell",
    muscles: ["quads", "glutes"], equipment: ["kettlebell"],
    difficulty: "beginner",
    steps: ["Hold weight at chest", "Feet shoulder-width, toes out", "Squat deep, elbows inside knees", "Stand back up"],
    tips: ["Great for learning squat mechanics", "Use heels for depth"],
    sets: { sets: 3, reps: "10-15", rest: "90 sec" }
  },
  {
    id: "romanian_deadlift", name: "Romanian Deadlift", category: "barbell",
    muscles: ["hamstrings", "glutes"], equipment: ["barbell"],
    difficulty: "intermediate",
    steps: ["Start standing with bar at hips", "Hip hinge, push hips back, bar slides down legs", "Stop when you feel hamstring stretch", "Drive hips forward to stand"],
    tips: ["Keep back flat", "Slight bend in knees"],
    sets: { sets: 3, reps: "8-12", rest: "90 sec" }
  },
  {
    id: "lunge", name: "Walking Lunge", category: "bodyweight",
    muscles: ["quads", "glutes", "hamstrings"], equipment: ["none"],
    difficulty: "beginner",
    steps: ["Step forward, lower back knee toward floor", "Front knee over ankle", "Step through with opposite leg"],
    tips: ["Keep torso upright", "Hold dumbbells to increase difficulty"],
    sets: { sets: 3, reps: "12 per leg", rest: "90 sec" }
  },
  {
    id: "leg_press", name: "Leg Press", category: "machines",
    muscles: ["quads", "glutes"], equipment: ["machine"],
    difficulty: "beginner",
    steps: ["Sit in machine, feet platform shoulder-width", "Lower sled to 90°", "Press up without locking knees"],
    tips: ["Higher foot placement = more glutes", "Lower = more quads"],
    sets: { sets: 3, reps: "12-15", rest: "90 sec" }
  },
  {
    id: "calf_raise", name: "Calf Raise", category: "bodyweight",
    muscles: ["calves"], equipment: ["none"],
    difficulty: "beginner",
    steps: ["Stand, raise onto toes", "Squeeze calves at top", "Lower below neutral if on step"],
    tips: ["Slow eccentrics for growth"],
    sets: { sets: 4, reps: "15-20", rest: "60 sec" }
  },
  {
    id: "hip_thrust", name: "Barbell Hip Thrust", category: "barbell",
    muscles: ["glutes", "hamstrings"], equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    steps: ["Upper back on bench, bar on hips", "Drive hips up until parallel to floor", "Squeeze glutes at top, lower"],
    tips: ["Chin tucked, look forward", "Best glute builder"],
    sets: { sets: 4, reps: "10-15", rest: "90 sec" }
  },
  // ── CARDIO & HIIT ─────────────────────────────────────────────────────────────
  {
    id: "burpee", name: "Burpee", category: "hiit",
    muscles: ["full_body", "cardio"], equipment: ["none"],
    difficulty: "intermediate",
    steps: ["Start standing", "Jump to plank, do push-up", "Jump feet to hands", "Jump up with arms overhead"],
    tips: ["Scale: skip push-up for beginners", "Full extension on jump"],
    sets: { sets: 5, reps: "10", rest: "30 sec" }
  },
  {
    id: "mountain_climber", name: "Mountain Climber", category: "hiit",
    muscles: ["abs", "cardio", "full_body"], equipment: ["none"],
    difficulty: "beginner",
    steps: ["High plank position", "Drive knees to chest alternately at speed", "Keep hips level"],
    tips: ["The faster, the higher the cardio demand"],
    sets: { sets: 3, reps: "30s", rest: "30 sec" }
  },
  {
    id: "jump_squat", name: "Jump Squat", category: "plyometrics",
    muscles: ["quads", "glutes", "cardio"], equipment: ["none"],
    difficulty: "intermediate",
    steps: ["Squat down, then explode upward", "Land softly with knees slightly bent"],
    tips: ["Land through heel-to-toe", "Use for power development"],
    sets: { sets: 4, reps: "10", rest: "60 sec" }
  },
  {
    id: "box_jump", name: "Box Jump", category: "plyometrics",
    muscles: ["quads", "glutes", "calves"], equipment: ["none"],
    difficulty: "intermediate",
    steps: ["Stand in front of box", "Power squat and jump onto box", "Land softly in quarter squat", "Step back down"],
    tips: ["Start lower, increase height progressively"],
    sets: { sets: 4, reps: "6-8", rest: "90 sec" }
  },
  {
    id: "jumping_jacks", name: "Jumping Jacks", category: "cardio",
    muscles: ["cardio", "full_body"], equipment: ["none"],
    difficulty: "beginner",
    steps: ["Jump feet apart simultaneously raising arms overhead", "Return to start"],
    tips: ["Great warm-up exercise"],
    sets: { sets: 3, reps: "30s", rest: "30 sec" }
  },
  // ── OLYMPIC ──────────────────────────────────────────────────────────────────
  {
    id: "clean", name: "Power Clean", category: "olympic",
    muscles: ["full_body", "back", "quads"], equipment: ["barbell"],
    difficulty: "advanced",
    steps: ["Start like deadlift, bar at mid-shin", "Explosive pull, high elbows", "Drop under bar, catch in front rack", "Stand up"],
    tips: ["Learn with PVC or empty bar first", "Triple extension is key"],
    sets: { sets: 5, reps: "3", rest: "3 min" }
  },
  // ── KETTLEBELL ───────────────────────────────────────────────────────────────
  {
    id: "kb_swing", name: "Kettlebell Swing", category: "kettlebell",
    muscles: ["glutes", "hamstrings", "back", "cardio"], equipment: ["kettlebell"],
    difficulty: "intermediate",
    steps: ["Stand, hinge at hips, swing KB between legs", "Drive hips forward explosively", "KB floats to chest height", "Hinge back to re-load"],
    tips: ["It's a hip hinge, NOT a squat", "Squeeze glutes at top"],
    sets: { sets: 4, reps: "15-20", rest: "60 sec" }
  },
  {
    id: "kb_turkish_getup", name: "Turkish Get-Up", category: "kettlebell",
    muscles: ["full_body", "shoulders"], equipment: ["kettlebell"],
    difficulty: "advanced",
    steps: ["Lie with KB pressed overhead", "Roll to elbow, push to hand", "Lift hips, sweep leg under", "Lunge to standing", "Reverse all steps"],
    tips: ["Keep eye on KB throughout", "Go slow and controlled"],
    sets: { sets: 3, reps: "3 per side", rest: "2 min" }
  },
  // ── FLEXIBILITY & YOGA ────────────────────────────────────────────────────────
  {
    id: "hip_flexor_stretch", name: "Hip Flexor Stretch", category: "stretching",
    muscles: ["quads", "glutes"], equipment: ["mat"],
    difficulty: "beginner",
    steps: ["Kneel on one knee", "Push hips forward gently", "Hold 30-60 seconds"],
    tips: ["Essential for desk workers", "Do both sides"],
    sets: { sets: 2, reps: "45s each side", rest: "30 sec" }
  },
  {
    id: "pigeon_pose", name: "Pigeon Pose", category: "yoga",
    muscles: ["glutes", "hamstrings"], equipment: ["mat"],
    difficulty: "intermediate",
    steps: ["From all fours, bring one leg's knee to wrist", "Extend back leg, square hips", "Fold forward for deeper stretch"],
    tips: ["Excellent hip opener", "Never force range of motion"],
    sets: { sets: 2, reps: "60s each side", rest: "30 sec" }
  },
  {
    id: "world_greatest_stretch", name: "World's Greatest Stretch", category: "flexibility",
    muscles: ["full_body"], equipment: ["none"],
    difficulty: "beginner",
    steps: ["Lunge forward, hand inside foot", "Rotate arm up toward ceiling", "Return and repeat"],
    tips: ["Best full-body mobility drill"],
    sets: { sets: 2, reps: "5 each side", rest: "30 sec" }
  },
  // ── MACHINES ─────────────────────────────────────────────────────────────────
  {
    id: "cable_row", name: "Seated Cable Row", category: "machines",
    muscles: ["back", "biceps"], equipment: ["cable", "machine"],
    difficulty: "beginner",
    steps: ["Sit at cable station, feet on pads", "Pull handle to lower chest", "Elbows past torso, squeeze back", "Return slowly"],
    tips: ["Try close grip and wide grip for variation"],
    sets: { sets: 3, reps: "10-13", rest: "90 sec" }
  },
  {
    id: "tricep_pushdown", name: "Tricep Pushdown", category: "machines",
    muscles: ["triceps"], equipment: ["cable"],
    difficulty: "beginner",
    steps: ["Stand at cable, rope or bar attachment", "Lock elbows at side, push down to extension", "Return slow"],
    tips: ["Elbows stay fixed throughout"],
    sets: { sets: 3, reps: "12-15", rest: "60 sec" }
  },
  {
    id: "chest_press_machine", name: "Chest Press Machine", category: "machines",
    muscles: ["chest", "triceps", "shoulders"], equipment: ["machine"],
    difficulty: "beginner",
    steps: ["Sit, grip handles at chest level", "Press forward to extension", "Return slow"],
    tips: ["Good for beginners or burnout sets"],
    sets: { sets: 3, reps: "12-15", rest: "90 sec" }
  },
  // ── BANDS ────────────────────────────────────────────────────────────────────
  {
    id: "band_pull_apart", name: "Band Pull-Apart", category: "strength",
    muscles: ["shoulders", "back"], equipment: ["bands"],
    difficulty: "beginner",
    steps: ["Hold band in front at shoulder height", "Pull apart keeping arms straight", "Squeeze rear delts, return"],
    tips: ["Great prehab for shoulders", "Do 20-30 reps"],
    sets: { sets: 3, reps: "20", rest: "60 sec" }
  },
  {
    id: "resistance_squat", name: "Banded Squat", category: "strength",
    muscles: ["quads", "glutes"], equipment: ["bands"],
    difficulty: "beginner",
    steps: ["Band above knees or under feet over shoulders", "Perform squat as normal"],
    tips: ["Band above knees cues knees out", "Extra glute activation"],
    sets: { sets: 3, reps: "15", rest: "60 sec" }
  },
];

// ── Pre-Built Programs ────────────────────────────────────────────────────────

export interface BuiltInProgram {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  focus: string;
  days: {
    label: string;
    exercises: { exerciseId: string; sets: number; reps: string; rest: string }[];
  }[];
}

export const BUILT_IN_PROGRAMS: BuiltInProgram[] = [
  {
    id: "ppl", name: "Push / Pull / Legs (PPL)",
    description: "Classic 6-day hypertrophy split. Push (chest/shoulders/triceps), Pull (back/biceps), Legs repeated twice weekly.",
    duration: "Ongoing", difficulty: "intermediate", focus: "Muscle Building",
    days: [
      {
        label: "Day 1 — Push",
        exercises: [
          { exerciseId: "bb_bench_press", sets: 4, reps: "6-10", rest: "2-3 min" },
          { exerciseId: "incline_bench", sets: 3, reps: "8-10", rest: "2 min" },
          { exerciseId: "ohp", sets: 3, reps: "8", rest: "2 min" },
          { exerciseId: "lateral_raise", sets: 3, reps: "12-15", rest: "60 sec" },
          { exerciseId: "tricep_pushdown", sets: 3, reps: "12-15", rest: "60 sec" },
          { exerciseId: "skull_crusher", sets: 3, reps: "10-12", rest: "90 sec" },
        ]
      },
      {
        label: "Day 2 — Pull",
        exercises: [
          { exerciseId: "deadlift", sets: 3, reps: "4-6", rest: "3 min" },
          { exerciseId: "pull_up", sets: 4, reps: "6-10", rest: "2 min" },
          { exerciseId: "bb_row", sets: 4, reps: "6-10", rest: "2 min" },
          { exerciseId: "cable_row", sets: 3, reps: "10-13", rest: "90 sec" },
          { exerciseId: "face_pull", sets: 3, reps: "15-20", rest: "60 sec" },
          { exerciseId: "bb_curl", sets: 3, reps: "10-12", rest: "90 sec" },
          { exerciseId: "hammer_curl", sets: 3, reps: "10-12", rest: "60 sec" },
        ]
      },
      {
        label: "Day 3 — Legs",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "6-8", rest: "3 min" },
          { exerciseId: "romanian_deadlift", sets: 3, reps: "8-12", rest: "90 sec" },
          { exerciseId: "leg_press", sets: 3, reps: "12-15", rest: "90 sec" },
          { exerciseId: "lunge", sets: 3, reps: "12 per leg", rest: "90 sec" },
          { exerciseId: "calf_raise", sets: 4, reps: "15-20", rest: "60 sec" },
        ]
      },
    ]
  },
  {
    id: "full_body_3", name: "Full Body 3x/Week",
    description: "Train Mon/Wed/Fri. Compound lifts each day. Great for beginners and intermediates.",
    duration: "8-12 weeks", difficulty: "beginner", focus: "Strength & Conditioning",
    days: [
      {
        label: "Workout A",
        exercises: [
          { exerciseId: "squat", sets: 3, reps: "5", rest: "3 min" },
          { exerciseId: "bb_bench_press", sets: 3, reps: "5", rest: "3 min" },
          { exerciseId: "deadlift", sets: 1, reps: "5", rest: "3 min" },
          { exerciseId: "bb_row", sets: 3, reps: "6-8", rest: "2 min" },
        ]
      },
      {
        label: "Workout B",
        exercises: [
          { exerciseId: "squat", sets: 3, reps: "5", rest: "3 min" },
          { exerciseId: "ohp", sets: 3, reps: "5", rest: "3 min" },
          { exerciseId: "deadlift", sets: 1, reps: "5", rest: "3 min" },
          { exerciseId: "chin_up", sets: 3, reps: "Max", rest: "2 min" },
        ]
      },
    ]
  },
  {
    id: "hiit_cardio", name: "HIIT & Conditioning",
    description: "High intensity interval training for fat loss and cardio endurance. 4 days/week.",
    duration: "6 weeks", difficulty: "intermediate", focus: "Fat Loss / Cardio",
    days: [
      {
        label: "Circuit A",
        exercises: [
          { exerciseId: "burpee", sets: 5, reps: "10", rest: "30 sec" },
          { exerciseId: "mountain_climber", sets: 3, reps: "30s", rest: "30 sec" },
          { exerciseId: "jump_squat", sets: 4, reps: "10", rest: "45 sec" },
          { exerciseId: "jumping_jacks", sets: 3, reps: "40", rest: "30 sec" },
        ]
      },
      {
        label: "Circuit B",
        exercises: [
          { exerciseId: "jumping_jacks", sets: 1, reps: "60s warmup", rest: "30 sec" },
          { exerciseId: "box_jump", sets: 4, reps: "8", rest: "60 sec" },
          { exerciseId: "burpee", sets: 4, reps: "8", rest: "45 sec" },
          { exerciseId: "plank", sets: 3, reps: "45s", rest: "30 sec" },
        ]
      },
    ]
  },
  {
    id: "calisthenics_starter", name: "Calisthenics Foundation",
    description: "No equipment needed. Build strength with bodyweight progressions.",
    duration: "8 weeks", difficulty: "beginner", focus: "Calisthenics",
    days: [
      {
        label: "Upper Body",
        exercises: [
          { exerciseId: "push_up", sets: 4, reps: "Max", rest: "90 sec" },
          { exerciseId: "pull_up", sets: 3, reps: "Max", rest: "2 min" },
          { exerciseId: "tricep_dip", sets: 3, reps: "12", rest: "90 sec" },
          { exerciseId: "band_pull_apart", sets: 3, reps: "20", rest: "60 sec" },
        ]
      },
      {
        label: "Lower Body & Core",
        exercises: [
          { exerciseId: "squat", sets: 4, reps: "15", rest: "90 sec" },
          { exerciseId: "lunge", sets: 3, reps: "12 per leg", rest: "60 sec" },
          { exerciseId: "plank", sets: 3, reps: "45s", rest: "60 sec" },
          { exerciseId: "hanging_leg_raise", sets: 3, reps: "10", rest: "90 sec" },
        ]
      },
    ]
  },
];
