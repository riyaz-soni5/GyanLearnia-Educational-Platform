import { Link } from "react-router-dom";
import Logo from "../assets/icon.svg"

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white w-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src= {Logo} // keep in /public
                alt="GyanLearnia Logo"
                className="h-8 w-auto"
              />
            </Link>

            <p className="text-sm leading-6 text-gray-600">
              Curriculum-aligned learning, verified guidance, skill-based courses,
              and certification — designed for learners across Nepal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/courses" className="text-gray-600 hover:text-gray-900">
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  to="/questions"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Questions & Answers
                </Link>
              </li>
              <li>
                <Link to="/tutors" className="text-gray-600 hover:text-gray-900">
                  Find a Tutor
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-gray-600 hover:text-gray-900"
                >
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-gray-900">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-gray-900">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} GyanLearnia. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm">
            <a
              href="mailto:support@gyanlearnia.com"
              className="text-gray-600 hover:text-gray-900"
            >
              support@gyanlearnia.com
            </a>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">Kathmandu, Nepal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
