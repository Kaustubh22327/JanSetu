import React, { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.jpeg'
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [creatorDropdownOpen, setCreatorDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [])

  const handleLogOut =()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    toast.success("Successfully Logged out")
    setIsLoggedIn(false);
    navigate("/login")
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setCreatorDropdownOpen(false);
  };

  return (
    <nav style={{ backgroundColor: 'rgb(251, 251, 249)' }} className="shadow-sm px-4 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <a href="/" className="text-black font-bold flex items-center gap-2 text-xl">
            <img className='rounded-full w-[50px]' src={logo} alt="" />
            Janhit
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors">Home</Link>

          <div className="relative">
            <Link
              to="/mycomplaints"
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
            >
              My Complaints
            </Link>
          </div>

          <div className="relative">
            <button
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
              onClick={() => setCreatorDropdownOpen(!creatorDropdownOpen)}
            >
              Government Officials <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${creatorDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {creatorDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 animate-fadeIn transition-all">
                {[
                  'Municipal Officer',
                  'City Engineer',
                  'Sanitation Department',
                  'Road & Transport Authority',
                  'Water Supply Officer',
                  'Public Safety & Surveillance',
                ].map((role) => (
                  <Link
                    key={role}
                    to={`/officials?role=${encodeURIComponent(role)}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {role}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/aboutus" className="text-gray-700 hover:text-gray-900 transition-colors">About</Link>
          <Link to="/contactUs" className="text-gray-700 hover:text-gray-900 transition-colors">Contact Us</Link>
          <Link to="/admin/login" className="text-gray-700 hover:text-gray-900 transition-colors">Admin</Link>
          {
            isLoggedIn 
            ? 
            <>
            <Link to="/dashboardUser" className="inline-block">
                <img
                  src="\public\Profile.png"
                  alt="User"
                  className="rounded-full border border-black size-12"
                />
              </Link>
              <button
                onClick={handleLogOut}
                className="text-gray-700 cursor-pointer"
              >
                Logout
              </button>

            </>
            : <Link to="/login" className="text-gray-700 hover:text-gray-900 transition-colors">Login</Link>
          }
          <Link to="/map" className="bg-gray-800 text-white px-4 py-2 rounded-md flex items-center hover:bg-gray-700 transition-colors">
            Report an issue →
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button onClick={toggleMenu} className="text-gray-700 hover:text-gray-900 focus:outline-none">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-gray-200 animate-slideDown origin-top transition-all duration-300 ease-in-out">
          <div className="space-y-6 px-4 pb-6">
            {/* My Complaints (mobile) */}
            <div>
              <Link onClick={closeMenu} to="/mycomplaints" className="block text-gray-700 hover:text-gray-900">
                My Complaints
              </Link>
            </div>

            {/* Government Officials (mobile) */}
            <div>
              <button
                onClick={() => setCreatorDropdownOpen(!creatorDropdownOpen)}
                className="flex items-center justify-between w-full text-gray-700 hover:text-gray-900"
              >
                Government Officials <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${creatorDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {creatorDropdownOpen && (
                <div className="pl-4 mt-2 space-y-2 animate-fadeIn">
                  {[
                    'Municipal Officer',
                    'City Engineer',
                    'Sanitation Department',
                    'Road & Transport Authority',
                    'Water Supply Officer',
                    'Public Safety & Surveillance',
                  ].map((role) => (
                    <a
                      key={role}
                      onClick={closeMenu}
                      href="#"
                      className="block py-1 text-gray-700 hover:text-gray-900"
                    >
                      <Link to='/dashboardOfficial'>{role}</Link>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Other links */}
            <Link onClick={closeMenu} to="/" className="block text-gray-700 hover:text-gray-900">Home</Link>
            <Link onClick={closeMenu} to="/aboutus" className="block text-gray-700 hover:text-gray-900">About</Link>
            <Link onClick={closeMenu} to="/contactUs" className="block text-gray-700 hover:text-gray-900">Contact Us</Link>
            <Link onClick={closeMenu} to="/admin/login" className="block text-gray-700 hover:text-gray-900">Admin</Link>
            {isLoggedIn ? (
              <>
                <Link onClick={closeMenu} to="/dashboardUser" className="block text-gray-700 hover:text-gray-900">Profile</Link>
                <button onClick={() => { handleLogOut(); closeMenu(); }} className="block text-left w-full text-gray-700">Logout</button>
              </>
            ) : (
              <Link onClick={closeMenu} to="/login" className="block text-gray-700 hover:text-gray-900">Login</Link>
            )}
            <Link
              onClick={closeMenu}
              to="/map"
              className="block w-full bg-gray-800 text-white px-4 py-2 rounded-md text-center hover:bg-gray-700 transition-colors"
            >
              Report an issue →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
