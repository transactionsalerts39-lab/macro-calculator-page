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

const instagramHandle = "shruti_fit";
const instagramDMUrl = `https://ig.me/m/${instagramHandle}?text=Fit`;

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
  const heroFormRef = useRef<HTMLDivElement | null>(null);
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
                  onClick={() => heroFormRef.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span>Start My DIY Plan</span>
                  <span className="icon">↘</span>
                </button>
                <span className="hero-trust">
                  Takes under <strong>30 seconds</strong>. You stay in control.
                </span>
              </div>
              <div className="hero-pill alt">
                <span>No fad diets</span>
                <span className="dot">·</span>
                <span>No detoxes</span>
                <span className="dot">·</span>
                <span>No nonsense</span>
              </div>
              <p className="hero-trust">
                Built for busy people who want
                <strong> simple, sustainable fat loss & muscle gain</strong>—without obsessing over
                apps all day.
              </p>

              <div className="card hero-form" ref={heroFormRef}>
                <form id="calculator-form" autoComplete="off" onSubmit={handleSubmit}>
                  <div className="calc-form-grid">
                    <div className="field">
                      <label htmlFor="age">Age</label>
                      <input
                        className="input"
                        id="age"
                        name="age"
                        type="number"
                        min="14"
                        max="90"
                        inputMode="numeric"
                        placeholder="28"
                        required
                        value={form.age}
                        onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                      />
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
                        placeholder="175"
                        required
                        value={form.height}
                        onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))}
                      />
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
                        placeholder="72"
                        required
                        value={form.weight}
                        onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="activity">Activity</label>
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
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="goal">Goal</label>
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
                        <option value="lose">Lose fat</option>
                        <option value="maintain">Maintain</option>
                        <option value="gain">Gain muscle</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="meals">Meals/day</label>
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
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </div>
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
                      Safety guardrails: will not recommend very low calories (below
                      ~1,200 for women / 1,500 for men).
                    </p>
                  </div>
                </form>
              </div>
            </div>

            <div className="hero-side">
              <div className="hero-card coach-card">
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

                <div className="hero-card-label">Your coach</div>
                <div className="hero-card-number">Shrutika Mathur</div>
                <div className="hero-card-pill">
                  <span>Nutrition & training</span> <strong>Coach</strong>
                </div>
                <p className="hero-card-note">
                  Helping busy professionals achieve their dream bodies.
                  <br />
                  No fad diets. No detoxes. No nonsense
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {(planVisible || isSubmitting) && (
        <section className="results-section">
          <div className="container">
            <div className="hero-card results-card" aria-live="polite" id="results">
              {isSubmitting && (
                <div className="loading-overlay" aria-hidden>
                  <div className="spinner" />
                  <span className="loading-text">Calculating…</span>
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
              <div className="results-card-label">Your DIY plan</div>
              <div className="results-card-number">
                {formatNumber(plan?.target)} <span>kcal / day</span>
              </div>
              <div className="results-card-pill">
                <span>Goal:</span> <strong>{goalCopy.label}</strong>
              </div>
              <div className="hero-card-divider"></div>
              <div className="hero-card-row">
                <div>
                  Maintenance
                  <br />
                  <span className="value">{formatNumber(plan?.maintenance)} kcal</span>
                </div>
                <div>
                  Target
                  <br />
                  <span className="value">{formatNumber(plan?.target)} kcal</span>
                </div>
              </div>
              <div className="hero-card-divider"></div>
              <div className="hero-card-row">
                <div>
                  Daily macros
                  <br />
                  <span className="value">
                    {formatNumber(plan?.proteinGrams)}P · {formatNumber(plan?.carbGrams)}C ·{" "}
                    {formatNumber(plan?.fatGrams)}F
                  </span>
                </div>
                <div>
                  Per meal ({mealsLabel}x)
                  <br />
                  <span className="value">
                    {formatNumber(plan?.proteinPerMeal)}P · {formatNumber(plan?.carbsPerMeal)}C ·{" "}
                    {formatNumber(plan?.fatsPerMeal)}F
                  </span>
                </div>
              </div>
              <p className="hero-card-note">
                These numbers are calculated from your inputs — start with these targets.
              </p>
            </div>
          </div>
        </section>
      )}

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
                <div className="about-copy">
                  <p>
                    A national-level athlete with 10+ years of experience in the fitness industry,
                    Shrutika has helped 1500+ clients towards:
                  </p>
                  <ul className="coach-pointers">
                    <li>Sustainable fat loss</li>
                    <li>Strength gains</li>
                    <li>Better food habits</li>
                    <li>Mindset shift</li>
                  </ul>
                  <p>
                    If you’re a busy professional/ corporate employee and want to improve your
                    fitness without derailing your routine, reach out &amp; know more about plans.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="container">
          <div className="final-cta">
            <h2>Need a plan built around your workday?</h2>
            <p>
              If you’re a busy professional/ corporate employee and want to improve your fitness
              without derailing your routine, reach out &amp; know more about plans.
            </p>
            <p style={{ fontWeight: 600, marginTop: "0.4rem" }}>DM “Fit” to join.</p>
            <a className="btn-primary" href={instagramDMUrl} target="_blank" rel="noreferrer">
              <span>Tap to open Instagram &amp; DM “Fit”</span>
              <span className="icon">📲</span>
            </a>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
              Tap the button to open Instagram with <strong>@{instagramHandle}</strong> and send
              “Fit.” I’ll reply with plan options tailored to your schedule and goals.
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
