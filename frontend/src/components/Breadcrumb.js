import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-slate-900 transition-colors"
        data-testid="breadcrumb-home"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-slate-900 transition-colors"
              data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium" data-testid="breadcrumb-current">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
