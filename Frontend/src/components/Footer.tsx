import { Link } from "react-router-dom";
import Logo from "@/assets/icon.svg";

const Footer = () => {
  return (
    <footer className="w-full border-t border-base bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                <img
                  src={Logo}
                  alt="GyanLearnia Logo"
                  className="h-8 w-auto"
                />
              </div>
            </Link>


            <p className="text-sm leading-6 text-muted">
              Curriculum-aligned learning, verified guidance, skill-based courses,
              and certification — designed for learners across Nepal.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-basec">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/courses" className="text-muted hover:text-basec">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/questions" className="text-muted hover:text-basec">
                  Questions & Answers
                </Link>
              </li>
              <li>
                <Link to="/tutors" className="text-muted hover:text-basec">
                  Find a Tutor
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted hover:text-basec">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-basec">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-muted hover:text-basec">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted hover:text-basec">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted hover:text-basec">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-base pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} GyanLearnia. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm">
            <a
              href="mailto:support@gyanlearnia.com"
              className="text-muted hover:text-basec"
            >
              support@gyanlearnia.com
            </a>
            <span className="text-muted/60">|</span>
            <span className="text-muted">Kathmandu, Nepal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
