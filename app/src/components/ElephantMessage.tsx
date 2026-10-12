import { Elephant } from './Elephant';

/** Authored encouragement, selected locally. Never an AI chat or a completion award. */
export function ElephantMessage({ message, name, compact = false }: {
  message: { title: string; body: string }; name?: string | null; compact?: boolean;
}) {
  return <div className={`elephant-message${compact ? ' compact' : ''}`}>
    <div className="companion-hello"><Elephant large name={name} /></div>
    <div className="companion-bubble">
      <h1 tabIndex={-1}>{message.title}</h1>
      <p>{message.body}</p>
    </div>
  </div>;
}
