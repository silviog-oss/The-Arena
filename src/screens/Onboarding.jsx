import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { Button, Disclaimer } from '../components/UI.jsx';
import { BodyForm, GoalForm } from '../components/Body.jsx';
import { bodyComplete } from '../lib/body.js';

const LEVELS = [
  { id: 'beginner', label: 'New to training', sub: 'Starts with easier variations (wall/knee push-ups, assisted squats).' },
  { id: 'some', label: 'Some experience', sub: 'Starts with standard variations.' },
  { id: 'trained', label: 'Trained regularly', sub: 'Standard variations — switch to advanced any time.' },
];

export default function Onboarding() {
  const { state, actions } = useGame();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [exp, setExp] = useState('beginner');
  const [agree, setAgree] = useState(false);

  return (
    <div className="onboarding">
      {step === 0 && (
        <div className="ob-step ob-intro">
          <LogoMark size={112} glow />
          <h1 className="ob-title">
            THE <b>ARENA</b>
          </h1>
          <p className="ob-lead">31 days. 31 missions. Every completed mission makes you stronger — in real life and on the board.</p>
          <ul className="ob-points">
            <li>Daily missions with built-in timers</li>
            <li>Earn XP, level up STR · END · AGI · VIT</li>
            <li>Climb from E-Rank to S-Rank</li>
            <li>Bodyweight + optional dumbbells only</li>
          </ul>
          <Button size="lg" className="w-full" onClick={() => setStep(1)}>
            Begin
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="ob-step">
          <p className="eyebrow">Step 1 of 4</p>
          <h2>Who enters the Arena?</h2>
          <input
            className="input"
            placeholder="Hunter name (optional)"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
          />
          <h3 className="ob-sub">Current training level</h3>
          <div className="choice-list">
            {LEVELS.map((l) => (
              <button key={l.id} className={`choice ${exp === l.id ? 'selected' : ''}`} onClick={() => setExp(l.id)}>
                <b>{l.label}</b>
                <small>{l.sub}</small>
              </button>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="ob-step">
          <p className="eyebrow">Step 2 of 4</p>
          <h2>Body profile</h2>
          <p className="muted">Used to calculate your BMI and a daily water target. Stays on this device.</p>
          <BodyForm
            initial={state.profile.body}
            saveLabel="Continue"
            onSave={(b) => {
              actions.setBody(b);
              setStep(3);
            }}
            onSkip={() => setStep(4)}
          />
          <button className="link-btn" onClick={() => setStep(1)}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="ob-step">
          <p className="eyebrow">Step 3 of 4</p>
          <h2>Your goal</h2>
          <p className="muted">Set a goal weight or BMI and how fast you want to get there. Your pace adjusts workout difficulty, and S-Rank requires getting close to this goal.</p>
          {bodyComplete(state.profile.body) ? (
            <GoalForm
              body={state.profile.body}
              onSave={(goal) => {
                actions.setBody({ goal });
                setStep(4);
              }}
            />
          ) : (
            <p className="note">A goal needs your weight and height. Go back to add them, or set a goal later in Profile.</p>
          )}
          <button className="link-btn" onClick={() => setStep(4)}>Skip — set a goal later</button>
          <button className="link-btn" onClick={() => setStep(2)}>Back</button>
        </div>
      )}

      {step === 4 && (
        <div className="ob-step">
          <p className="eyebrow">Step 4 of 4</p>
          <h2>Before you start</h2>
          <Disclaimer />
          <ul className="ob-points small">
            <li>Every workout starts with a short warm-up.</li>
            <li>Pick an easier variation whenever form breaks down.</li>
            <li>Missed a day? Your streak resets, but your program progress never does.</li>
          </ul>
          <label className="check-row">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I understand and will train within my limits.</span>
          </label>
          <Button
            size="lg"
            className="w-full"
            disabled={!agree}
            onClick={() => actions.onboard({ name: name.trim(), experience: exp, disclaimerAccepted: Date.now() })}
          >
            Enter The Arena
          </Button>
          <button className="link-btn" onClick={() => setStep(bodyComplete(state.profile.body) ? 3 : 2)}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
