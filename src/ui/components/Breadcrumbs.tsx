import { Link } from 'react-router';
export function Breadcrumbs({
  items,
}: {
  readonly items: readonly { readonly label: string; readonly href?: string }[];
}) {
  return (
    <nav aria-label="Хлебные крошки">
      <ol className="breadcrumbs">
        {items.map((item, i) => (
          <li key={i}>
            {item.href ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
