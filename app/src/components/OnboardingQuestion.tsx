import { questions } from '../onboarding';
import type { ProfileDraft } from '../profile-draft';

const countryNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
// ISO codes supported by the server. No service availability is implied by this list.
const countryCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const countries = countryCodes.map(code => ({ code, name: countryNames.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name));

export function OnboardingQuestion({ step, draft, values, note, editing, onChoose, onNote, onNext, onSkip, onPickTopic }:
  { step: number; draft: ProfileDraft; values: string[]; note: string; editing: boolean;
    onChoose: (id: string) => void; onNote: (value: string) => void; onNext: () => void; onSkip: () => void; onPickTopic: () => void }) {
  const q = questions[step];
  return <section className="onboarding">
    <div className="question-progress" aria-label={`Question ${step + 1} of ${questions.length}`}>
      {questions.map((_, i) => <span key={i} className={i <= step ? 'filled' : ''} />)}
    </div>
    <span className="eyebrow">Getting to know you · {step + 1}/{questions.length}</span>
    {step === 2 && draft.answers.why === 'trust' && <p className="gentle-comment">We can build from small moments of “I did that.”</p>}
    {step === 7 && <p className="gentle-comment">Small preparations can give us more room to choose how we live.</p>}
    <h1 tabIndex={-1} className="question-title">{q.title}</h1>
    {q.multi && <p className="hint">{q.max ? `Choose up to ${q.max}.` : 'Choose what fits.'}</p>}
    {q.kind === 'country' ? <>
      <label htmlFor="country">Country or region</label>
      <select id="country" value={draft.answers.country || ''} onChange={event => onChoose(event.target.value)}>
        <option value="">Keep it general</option>
        {countries.map(country => <option value={country.code} key={country.code}>{country.name}</option>)}
      </select>
      <p className="hint">For relevant resources. No street address needed.</p>
    </> : q.kind === 'text' ? <>
      <label className="sr-only" htmlFor="onboarding-note">Anything else to understand</label>
      <textarea id="onboarding-note" maxLength={600} value={note} onChange={event => onNote(event.target.value)} placeholder="Only if there is something you want to add…" />
      <p className="hint">Optional. Kept only while this page is open; not saved to your profile.</p>
    </> : <div className="choices" role="group" aria-label={q.title}>
      {q.options?.map(([id, label]) => <button key={id} className={'choice ' + (values.includes(id) ? 'selected' : '')}
        aria-pressed={values.includes(id)} onClick={() => onChoose(id)}>
        <span>{label}</span><span className={q.multi ? 'check' : 'radio'} aria-hidden>{values.includes(id) ? '✓' : ''}</span>
      </button>)}
    </div>}
    <button className="primary" disabled={!q.optional && !values.length} onClick={onNext}>{editing ? 'Keep answer' : 'Continue'}</button>
    {q.optional && <button className="text-button" onClick={onSkip}>Skip for now</button>}
    {!editing && <button className="text-button" onClick={onPickTopic}>I’ll pick a topic instead</button>}
  </section>;
}
