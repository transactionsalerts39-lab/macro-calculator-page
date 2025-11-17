"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";

interface FormState {
  age: string;
  sex: string;
  height: string;
  weight: string;
  activity: "" | "low" | "medium" | "high";
  goal: "" | "lose" | "maintain" | "gain";
  meals: "4" | "5";
}

interface PlanResult {
  maintenance: number;
  target: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  proteinPerMeal: number;
  carbsPerMeal: number;
  fatsPerMeal: number;
  meals: number;
}

type Particle = {
  id: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  rotation: number;
  color: string;
};

function calculatePlan({ age, heightCm, weightKg, sex, activityLevel, goal, numMeals }: {
  age: number;
  heightCm: number;
  weightKg: number;
  sex: "male" | "female";
  activityLevel: "low" | "medium" | "high";
  goal: "lose" | "maintain" | "gain";
  numMeals: number;
}): PlanResult {
  // Step 1 – BMR (Mifflin–St Jeor)
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);

  // Step 2 – Activity factor
  let factor = 1.5;
  if (activityLevel === "low") factor = 1.3;
  if (activityLevel === "medium") factor = 1.5;
  if (activityLevel === "high") factor = 1.7;

  const maintenance = Math.round(bmr * factor);

  // Step 3 – Goal calories
  let target = maintenance;
  if (goal === "lose") {
    target = maintenance - 300;
  } else if (goal === "gain") {
    target = maintenance + 300;
  }

  // Safety guardrails
  if (sex === "female" && target < 1200) {
    target = 1200;
  }
  if (sex === "male" && target < 1500) {
    target = 1500;
  }

  // Step 4 – Macros (30% P, 45% C, 25% F)
  const proteinCalories = target * 0.3;
  const carbCalories = target * 0.45;
  const fatCalories = target * 0.25;

  const proteinGrams = Math.round(proteinCalories / 4);
  const carbGrams = Math.round(carbCalories / 4);
  const fatGrams = Math.round(fatCalories / 9);

  // Step 5 – Split into meals
  const meals = numMeals;
  const proteinPerMeal = Math.round(proteinGrams / meals);
  const carbsPerMeal = Math.round(carbGrams / meals);
  const fatsPerMeal = Math.round(fatGrams / meals);

  return {
    maintenance,
    target,
    proteinGrams,
    carbGrams,
    fatGrams,
    proteinPerMeal,
    carbsPerMeal,
    fatsPerMeal,
    meals,
  };
}

const defaultForm: FormState = {
  age: "",
  sex: "",
  height: "",
  weight: "",
  activity: "",
  goal: "",
  meals: "4",
};

function makeParticles(count = 38): Particle[] {
  const colors = ["#f2d0c4", "#824e1a", "#c2b6c1", "#f5f3ef"];
  return Array.from({ length: count }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 170 + Math.random() * 180;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    return {
      id,
      dx,
      dy,
      size: 8 + Math.random() * 10,
      delay: Math.random() * 200,
      rotation: Math.random() * 360,
      color: colors[id % colors.length],
    };
  });
}

function useGoalCopy(goal: "" | "lose" | "maintain" | "gain") {
  return useMemo(() => {
    if (goal === "lose") {
      return {
        label: "fat loss",
        explanation:
          "We reduced ~300 kcal below maintenance to create a gentle, sustainable deficit.",
      };
    }
    if (goal === "maintain") {
      return {
        label: "maintenance",
        explanation:
          "We keep you close to maintenance so you can maintain weight while improving strength and habits.",
      };
    }
    if (goal === "gain") {
      return {
        label: "muscle gain",
        explanation:
          "We added ~300 kcal above maintenance to support muscle growth without excessive fat gain.",
      };
    }
    return {
      label: "your goal",
      explanation: "We gently adjust calories based on your goal so results are sustainable.",
    };
  }, [goal]);
}

export default function Home() {
  const calculatorRef = useRef<HTMLElement | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const goalCopy = useGoalCopy(form.goal);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCelebrate(false);
    setIsSubmitting(true);

    const age = Number(form.age);
    const heightCm = Number(form.height);
    const weightKg = Number(form.weight);
    const activity = form.activity;
    const goal = form.goal;
    const meals = Number(form.meals);
    const sex = form.sex;

    if (
      !age ||
      !sex ||
      !heightCm ||
      !weightKg ||
      !activity ||
      !goal ||
      !meals
    ) {
      setPlan(null);
      setError("Please fill in all fields before generating your plan.");
      setIsSubmitting(false);
      return;
    }

    if (age < 14 || age > 90) {
      setPlan(null);
      setError("This calculator is intended for ages between 14 and 90.");
      setIsSubmitting(false);
      return;
    }

    const planResult = calculatePlan({
      age,
      heightCm,
      weightKg,
      sex: sex as "male" | "female",
      activityLevel: activity,
      goal,
      numMeals: meals,
    });

    // Simple loading/celebration flow
    setTimeout(() => {
      setPlan(planResult);
      setIsSubmitting(false);
      setParticles(makeParticles());
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2400);
      requestAnimationFrame(() => {
        const resultsEl = document.getElementById("results");
        resultsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      setTimeout(() => {
        const resultsEl = document.getElementById("results");
        resultsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }, 500);
  };

  const planVisible = Boolean(plan);
  const mealsLabel = plan?.meals ?? Number(form.meals);

  const formatNumber = (value: number | undefined) =>
    typeof value === "number" ? value.toLocaleString("en-US") : "–";

  return (
    <div className="page">
      {/* HERO */}
      <header className="hero">
        <div className="container">
          <div className="hero-inner">
            <div>
              <div className="badge">
                <span className="badge-dot"></span>
                No login · No app · Just your numbers
              </div>
              <h1 className="hero-title">
                Build-Your-Own Diet:
                <span className="hero-highlight"> DIY Calorie & Macro Planner</span>
              </h1>
              <p className="hero-subtitle">
                Enter your age, height, weight and goal to get your daily calories, macros, and a 4–5
                meal breakdown you can start using <strong>today</strong>.
              </p>
              <div className="hero-cta-row">
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => calculatorRef.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span>Start My DIY Plan</span>
                  <span className="icon">↘</span>
                </button>
                <span className="hero-trust">
                  Takes under <strong>30 seconds</strong>. You stay in control.
                </span>
              </div>
              <p className="hero-trust">
                Built for busy people who want
                <strong> simple, sustainable fat loss & muscle gain</strong>—without obsessing over
                apps all day.
              </p>
            </div>

            <div className="hero-side">
              <div className="hero-card" aria-hidden="true">
                <div className="coach-photo">
                  <Image
                    src="/coach.jpg"
                    alt="Coach in the gym"
                    width={720}
                    height={820}
                    priority
                    className="coach-photo-img"
                  />
                </div>

                <div className="hero-card-label">Sample output · For demo only</div>
                <div className="hero-card-number">
                  2,200<span>kcal / day</span>
                </div>
                <div className="hero-card-pill">
                  <span>Goal:</span> <strong>Lean recomposition</strong>
                </div>
                <div className="hero-card-divider"></div>
                <div className="hero-card-row">
                  <div>
                    Maintenance
                    <br />
                    <span className="value">2,500 kcal</span>
                  </div>
                  <div>
                    Target
                    <br />
                    <span className="value">2,200 kcal</span>
                  </div>
                </div>
                <div className="hero-card-divider"></div>
                <div className="hero-card-row">
                  <div>
                    Daily macros
                    <br />
                    <span className="value">165P · 248C · 61F</span>
                  </div>
                  <div>
                    Per meal (4x)
                    <br />
                    <span className="value">41P · 62C · 15F</span>
                  </div>
                </div>
                <p className="hero-card-note">
                  You’ll get <strong>your own</strong> numbers based on your data — this is just a
                  preview of what the calculator returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">How it works</div>
            <h2 className="section-title">3 steps to your DIY eating blueprint</h2>
            <p className="section-sub">
              No guesswork, no magic foods. Just clear numbers you can plug into the way you already
              like to eat.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-top">
                <div className="step-pill">Step 1</div>
                <h3 className="step-title">Tell the basics</h3>
              </div>
              <p className="step-text">Enter age, height, weight, sex, activity, and goal.</p>
            </div>
            <div className="step-card">
              <div className="step-top">
                <div className="step-pill">Step 2</div>
                <h3 className="step-title">We crunch the numbers</h3>
              </div>
              <p className="step-text">We find maintenance and nudge up/down for your goal.</p>
            </div>
            <div className="step-card">
              <div className="step-top">
                <div className="step-pill">Step 3</div>
                <h3 className="step-title">Get your numbers</h3>
              </div>
              <p className="step-text">See calories, macros, and per-meal split to start today.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULATOR + RESULTS */}
      <section id="calculator" ref={calculatorRef}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">DIY calculator</div>
            <h2 className="section-title">Build your calorie & macro plan</h2>
            <p className="section-sub">
              Fill in your details below. The numbers you see are an educated starting point — not
              strict rules. Adjust based on your progress and how you feel.
            </p>
          </div>

          <div className="calc-layout">
            {/* FORM */}
            <div className="card">
              <form id="calculator-form" autoComplete="off" onSubmit={handleSubmit}>
                <div className="calc-form-grid">
                  <div className="field">
                    <label htmlFor="age">Age (years)</label>
                    <input
                      className="input"
                      id="age"
                      name="age"
                      type="number"
                      min="14"
                      max="90"
                      inputMode="numeric"
                      placeholder="e.g. 28"
                      required
                      value={form.age}
                      onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                    />
                    <small>Use full years.</small>
                  </div>

                  <div className="field">
                    <label htmlFor="sex">Sex</label>
                    <select
                      className="select"
                      id="sex"
                      name="sex"
                      required
                      value={form.sex}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, sex: e.target.value as FormState["sex"] }))
                      }
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <small>Affects your base metabolism.</small>
                  </div>

                  <div className="field">
                    <label htmlFor="height">Height (cm)</label>
                    <input
                      className="input"
                      id="height"
                      name="height"
                      type="number"
                      min="120"
                      max="220"
                      inputMode="decimal"
                      placeholder="e.g. 175"
                      required
                      value={form.height}
                      onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))}
                    />
                    <small>If you use ft/inches, convert to cm first.</small>
                  </div>

                  <div className="field">
                    <label htmlFor="weight">Weight (kg)</label>
                    <input
                      className="input"
                      id="weight"
                      name="weight"
                      type="number"
                      min="35"
                      max="180"
                      inputMode="decimal"
                      placeholder="e.g. 72"
                      required
                      value={form.weight}
                      onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                    />
                    <small>Use your current weight.</small>
                  </div>

                  <div className="field">
                    <label htmlFor="activity">Activity level</label>
                    <select
                      className="select"
                      id="activity"
                      name="activity"
                      required
                      value={form.activity}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          activity: e.target.value as FormState["activity"],
                        }))
                      }
                    >
                      <option value="">Select</option>
                      <option value="low">Low – Mostly sitting, little/no exercise</option>
                      <option value="medium">Medium – Desk job + 3–4 workouts/week</option>
                      <option value="high">High – Active job or intense training</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="goal">Primary goal</label>
                    <select
                      className="select"
                      id="goal"
                      name="goal"
                      required
                      value={form.goal}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, goal: e.target.value as FormState["goal"] }))
                      }
                    >
                      <option value="">Select</option>
                      <option value="lose">Lose weight / reduce fat</option>
                      <option value="maintain">Maintain weight</option>
                      <option value="gain">Gain weight / build muscle</option>
                    </select>
                  </div>

                  <div className="field field-row-full">
                    <label htmlFor="meals">Meals per day</label>
                    <select
                      className="select"
                      id="meals"
                      name="meals"
                      required
                      value={form.meals}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, meals: e.target.value as FormState["meals"] }))
                      }
                    >
                      <option value="4">4 meals per day</option>
                      <option value="5">5 meals per day</option>
                    </select>
                    <small>Choose what fits your lifestyle — not what looks “perfect”.</small>
                  </div>
                </div>

                <div className="help-row">
                  <strong>What this does:</strong> calculates your maintenance calories, adjusts them
                  by your goal, then splits calories into 30% protein, 45% carbs, 25% fats and
                  divides across 4–5 meals.
                </div>

                <div id="error" className={`error-text ${error ? "" : "hidden"}`}>
                  {error}
                </div>

                <div className="calc-footer">
                  <button type="submit" className="btn-primary">
                    <span>{isSubmitting ? "Crunching…" : "Generate My DIY Plan"}</span>
                    <span className="icon">{isSubmitting ? "⏳" : "⚡"}</span>
                  </button>
                  <p className="calc-note">
                    Safety guardrails: the calculator will not recommend very low calories (below
                    ~1,200 for women / 1,500 for men).
                  </p>
                </div>
              </form>
            </div>

            {/* RESULTS */}
            <div id="results" className={`results-card ${planVisible ? "" : "hidden"}`} aria-live="polite">
              {isSubmitting && (
                <div className="loading-overlay" aria-hidden>
                  <div className="spinner" />
                  <span className="loading-text">Calculating your plan…</span>
                </div>
              )}
              {celebrate && (
                <div className="confetti-burst" aria-hidden>
                  {particles.map((p) => (
                    <div
                      key={p.id}
                      className="particle"
                      style={{
                        "--dx": `${p.dx}px`,
                        "--dy": `${p.dy}px`,
                        "--size": `${p.size}px`,
                        "--delay": `${p.delay}ms`,
                        "--rot": `${p.rotation}deg`,
                        "--color": p.color,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}

              <div className="results-tag">Your DIY plan</div>
              <div className="results-title">
                Daily targets for <span id="goalLabel">{goalCopy.label}</span>
              </div>

              <div className="results-grid">
                <div className="results-block">
                  <div className="results-label">Maintenance calories</div>
                  <div className="results-value">
                    <span id="maintenanceCalories">{formatNumber(plan?.maintenance)}</span>
                    <span className="unit">kcal / day</span>
                  </div>
                  <div className="results-subtext">
                    Approx. calories to maintain your current weight with your activity level.
                  </div>
                </div>

                <div className="results-block">
                  <div className="results-label">Target calories</div>
                  <div className="results-value">
                    <span id="targetCalories">{formatNumber(plan?.target)}</span>
                    <span className="unit">kcal / day</span>
                  </div>
                  <div className="results-subtext" id="targetExplanation">
                    {goalCopy.explanation}
                  </div>
                </div>

                <div className="results-block">
                  <div className="results-label">Daily macros</div>
                  <div className="results-value">
                    <span id="dailyProtein">{formatNumber(plan?.proteinGrams)}</span>P ·
                    <span id="dailyCarbs"> {formatNumber(plan?.carbGrams)}</span>C ·
                    <span id="dailyFats"> {formatNumber(plan?.fatGrams)}</span>F
                  </div>
                  <div className="results-subtext">
                    Based on ~30% protein, 45% carbs, 25% fats of your target calories.
                  </div>
                </div>

                <div className="results-block">
                  <div className="results-label">
                    Per-meal (~<span id="mealsPerDayLabel">{mealsLabel}</span>x / day)
                  </div>
                  <div className="results-value">
                    <span id="perMealProtein">{formatNumber(plan?.proteinPerMeal)}</span>P ·
                    <span id="perMealCarbs"> {formatNumber(plan?.carbsPerMeal)}</span>C ·
                    <span id="perMealFats"> {formatNumber(plan?.fatsPerMeal)}</span>F
                  </div>
                  <div className="results-subtext">
                    If most meals land roughly near these numbers, you’re doing great.
                  </div>
                </div>
              </div>

              <div className="results-footnote">
                Tip: for fat loss, aim to <strong>hit protein first</strong>, then fill the rest of
                your calories with mostly whole-food carbs and fats you enjoy.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLANATION */}
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">What you get</div>
            <h2 className="section-title">Clear numbers you can act on today</h2>
            <p className="section-sub">
              Instead of handing you a random meal plan, we give you the blueprint. Plug these
              numbers into the foods you already like eating and adjust weekly based on progress.
            </p>
          </div>

          <div className="info-grid">
            <div className="info-block">
              <h3>Daily calorie target</h3>
              <p>
                Your target is adjusted up or down by ~300 kcal from maintenance depending on your
                goal. It’s enough to move the needle without wrecking your energy.
              </p>
              <ul>
                <li>Fat loss: modest deficit for sustainability.</li>
                <li>Muscle gain: modest surplus to support growth.</li>
                <li>Maintenance: stay level while improving strength/habits.</li>
              </ul>
            </div>

            <div className="info-block">
              <h3>Macro split</h3>
              <p>
                We use ~30% protein, 45% carbs, 25% fats as a balanced starting point. Adjust based
                on appetite, training style, and food preferences.
              </p>
              <ul>
                <li>Protein keeps you full and supports muscle.</li>
                <li>Carbs fuel training and recovery.</li>
                <li>Fats support hormones and overall health.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MEALS & SOURCES */}
      <section>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Plug & play</div>
            <h2 className="section-title">Food ideas to hit your numbers</h2>
            <p className="section-sub">
              Keep it simple. Build most meals from a protein + carb + fat + veg. Mix and match from
              the lists below.
            </p>
          </div>

          <div className="food-grid">
            <div className="info-block">
              <h3>Protein anchors</h3>
              <div className="chip">Chicken breast / thighs</div> <div className="chip">Lean beef</div>{" "}
              <div className="chip">Eggs / egg whites</div> <div className="chip">Greek yogurt</div>{" "}
              <div className="chip">Cottage cheese</div> <div className="chip">Tofu / tempeh</div>{" "}
              <div className="chip">Fish (salmon, cod, tuna)</div>
              <div className="example-meal">
                150g chicken + 200g potatoes + veggies + olive oil
              </div>
            </div>

            <div className="info-block">
              <h3>Carb sources</h3>
              <div className="chip">Rice / jasmine / basmati</div> <div className="chip">Potatoes</div>{" "}
              <div className="chip">Oats</div> <div className="chip">Pasta</div> <div className="chip">Beans</div>{" "}
              <div className="chip">Quinoa</div> <div className="chip">Fruit</div>
              <div className="example-meal">Overnight oats + whey + berries + peanut butter</div>
            </div>

            <div className="info-block">
              <h3>Fats & flavor</h3>
              <div className="chip">Olive oil</div> <div className="chip">Avocado</div> <div className="chip">Nuts</div>{" "}
              <div className="chip">Nut butters</div> <div className="chip">Cheese</div> <div className="chip">Whole eggs</div>
              <div className="example-meal">Tacos: ground beef, tortillas, salsa, avocado</div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / FAQ */}
      <section>
        <div className="container">
          <div className="about-layout">
            <div>
              <div className="section-header">
                <div className="section-eyebrow">Who built this?</div>
                <h2 className="section-title">About the coach behind the calculator</h2>
              </div>

              <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>
                <div className="avatar"></div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <p>
                    Hi, I’m <strong>[Your Name]</strong>. I help busy people lose fat, gain strength
                    and build a better relationship with food using simple, sustainable methods.
                  </p>
                  <p>
                    I created this DIY planner so you don’t have to guess your calories or macros
                    anymore. Use it as a clear starting point, then adjust based on <em>your</em> life,
                    not someone else’s routine.
                  </p>
                  <p>
                    If you ever want help turning these numbers into a complete weekly meal and
                    training plan, scroll down and reach out.
                  </p>
                  <span className="chip">No fad diets · No detoxes · No nonsense</span>
                </div>
              </div>
            </div>

            <div>
              <div className="section-header">
                <div className="section-eyebrow">FAQ</div>
                <h2 className="section-title">Common questions</h2>
              </div>

              <div className="faq-list">
                <div className="faq-item">
                  <div className="faq-q">Is this 100% accurate?</div>
                  <div className="faq-a">
                    No calculator is perfect. This uses widely accepted formulas to give you an
                    educated estimate. Your progress over 3–4 weeks tells us if we need small tweaks.
                  </div>
                </div>

                <div className="faq-item">
                  <div className="faq-q">Do I have to hit these numbers exactly?</div>
                  <div className="faq-a">
                    No. Think of them as <em>targets</em>, not strict rules. Being roughly close most
                    days is enough for progress.
                  </div>
                </div>

                <div className="faq-item">
                  <div className="faq-q">Can I use this if I have medical conditions?</div>
                  <div className="faq-a">
                    If you have medical conditions, take medication, are pregnant or have a history of
                    eating disorders, please speak to your doctor or a registered dietitian before
                    making big changes.
                  </div>
                </div>

                <div className="faq-item">
                  <div className="faq-q">How fast will I see results?</div>
                  <div className="faq-a">
                    That depends on your consistency, sleep, stress, training and genetics. Most
                    people start noticing changes in 4–8 weeks when they follow a realistic plan
                    consistently.
                  </div>
                </div>
              </div>

              <div className="disclaimer">
                This calculator is for educational purposes only and is not medical or dietetic
                advice. Always consult with a healthcare professional before making major changes to
                your diet, training or lifestyle.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="container">
          <div className="final-cta">
            <h2>Want help turning this into a full plan?</h2>
            <p>
              If you’d like a 100% customized plan based on your results, schedule, and food
              preferences, I can help you shortcut the guesswork.
            </p>
            <button className="btn-primary" type="button">
              <span>Screenshot &amp; DM Me Your Results</span>
              <span className="icon">📲</span>
            </button>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
              Action step: take a screenshot of your numbers, then DM them to me on Instagram
              <strong> @yourhandle</strong> with your main goal.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          DIY Calorie &amp; Macro Planner · Built by [Your Name].
          <br />Editable Next.js app — deploy to Vercel and tweak anything you like.
        </div>
      </footer>
    </div>
  );
}
