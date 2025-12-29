import { Link, NavLink } from "react-router-dom";
import Logo from "../assets/icon.svg"

type NavItem = {
  name: string;
  path: string;
};

const navItems: NavItem[] = [
  { name: "Courses", path: "../courses" },
  { name: "Questions", path: "/questions" },
  { name: "Mentors", path: "/mentors" },
  { name: "Pricings", path: "/pricing" },
  {name: "About", path: "/about"}
];

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 w-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src= {Logo}   // put logo in public folder
              alt="GyanLearnia Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
