import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, History, Settings, FileAudio } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-screen fixed left-0 top-0 transition-colors duration-300">
      <div className="flex items-center h-16 shrink-0 px-6 border-b border-gray-200 dark:border-gray-700">
        <Link
          to="/"
          className="flex items-center gap-2 text-brand-600 dark:text-indigo-400 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          <FileAudio className="w-6 h-6" />
          Minutely
        </Link>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 gap-2">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase mb-2 px-2">
          Menu
        </div>
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                twMerge(
                  clsx(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-brand-50 dark:bg-indigo-900/40 text-brand-600 dark:text-indigo-400 shadow-sm ring-1 ring-brand-100 dark:ring-indigo-800'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  )
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={clsx(
                      'mr-3 shrink-0 h-5 w-5',
                      isActive ? 'text-brand-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

