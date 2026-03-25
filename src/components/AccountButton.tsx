import Link from "next/link";

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  href?: string; // Optional href for navigation
  action?: () => void; // Optional action for custom functionality
}

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface AccountButtonProps {
  dropdownItems: DropdownItem[];
  user?: User | null;
  onItemClick?: () => void;
}

const AccountButton: React.FC<AccountButtonProps> = ({
  dropdownItems,
  user,
  onItemClick,
}) => {
  return (
    <div className="w-56 bg-[#ddd] rounded-lg shadow-sm  border border-gray-200">
      {/* Dropdown */}
      <div className="bg-white shadow-lg rounded-lg">
        {/* User Info Section */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {/* <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div> */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
        <ul className="rounded-lg">

          {dropdownItems.map((item, index) => (
            <li key={index}>
              {item.href ? (
                <Link href={item.href} onClick={onItemClick}>
                  <span className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-orange-100 hover:text-orange-600">
                    <span className="text-primary flex-shrink-0">{item.icon}</span>
                    <span className="ms-3">{item.label}</span>
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (item.action) item.action();
                    if (onItemClick) onItemClick();
                  }}
                  className={`flex items-center  w-full px-4 py-2 text-sm text-gray-600 
                    hover:bg-orange-100 hover:text-primary  
                    ${index === dropdownItems.length - 1
                      ? "rounded-b-lg border-t pt-2"
                      : ""
                    } `}
                >
                  <span className="text-primary flex-shrink-0">{item.icon}</span>
                  <span className="ms-3">{item.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AccountButton;
