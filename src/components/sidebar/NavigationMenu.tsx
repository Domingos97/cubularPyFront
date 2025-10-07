
import { Link } from 'react-router-dom';
import { MenuItem } from '@/types/sidebar';
import { useLocation } from 'react-router-dom';

interface NavigationMenuProps {
  items: MenuItem[];
  isOpen: boolean;
  isMobile: boolean;
  onMobileItemClick: () => void;
}

export const NavigationMenu = ({ items, isOpen, isMobile, onMobileItemClick }: NavigationMenuProps) => {
  const location = useLocation();
  
  return (
    <nav className="space-y-2">
      {items.map((item) => {
        // Use exact path matching to ensure only one item is active at a time
        const isActive = location.pathname === item.path;
        const isDisabled = item.path === "#";
        
        if (isDisabled) {
          return (
            <div
              key={item.title}
              className="flex items-center px-4 py-3 rounded-lg transition-colors text-sm font-medium text-gray-500 cursor-not-allowed"
              title={!isOpen && !isMobile ? item.title : undefined}
            >
              <div className="flex items-center w-full">
                {item.icon}
                {(isOpen || isMobile) && (
                  <span className="ml-3">
                    {item.title}
                  </span>
                )}
              </div>
            </div>
          );
        }
        
        return (
          <Link
            key={item.title}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors text-sm font-medium
              ${isActive 
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400' 
                : 'hover:bg-gray-800/50 text-gray-300 hover:text-white'
              }`}
            title={!isOpen && !isMobile ? item.title : undefined}
            onClick={() => isMobile && onMobileItemClick()}
          >
            <div className="flex items-center w-full">
              {item.icon}
              {(isOpen || isMobile) && (
                <span className="ml-3">
                  {item.title}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  );
};
