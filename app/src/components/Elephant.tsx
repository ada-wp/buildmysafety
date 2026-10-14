export function Elephant({ large = false, name }: { large?: boolean; name?: string | null }) {
  return <img className={large ? 'elephant large' : 'elephant'} src={`${import.meta.env.BASE_URL}elephant.svg`}
    alt={name || 'Your lavender elephant companion'} />;
}
