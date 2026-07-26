import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { isRouteIdentifier, routeLabels } from './routeMeta';

export function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const items = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    const label = isRouteIdentifier(segment) ? 'Chi tiết' : routeLabels[segment] ?? segment;
    const isValidLink = !isLast && !isRouteIdentifier(segment) && path !== '/admin';
    return { path, label, isLast, isValidLink };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--color-text-subtle)] sm:text-sm">
        <li className="hidden sm:flex">
          <Link
            to="/dashboard"
            aria-label="Tổng quan"
            className="rounded p-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          >
            <Home size={15} aria-hidden="true" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.path} className={`min-w-0 items-center gap-1.5 ${index < items.length - 2 ? 'hidden md:flex' : 'flex'}`}>
            {(index > 0 || items.length > 0) && <ChevronRight size={14} className="hidden shrink-0 sm:block" aria-hidden="true" />}
            {item.isValidLink ? (
              <Link
                to={item.path}
                className="truncate rounded px-1 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={item.isLast ? 'page' : undefined}
                className={item.isLast ? 'truncate font-semibold text-[var(--color-text)]' : 'truncate'}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
