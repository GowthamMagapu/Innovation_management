import React from 'react';
import { Rocket, LogIn, LogOut, User as UserIcon, LayoutDashboard, Library } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, logOut } from '../firebase';
import { cn } from '../lib/utils';

interface NavbarProps {
  currentTab: 'validator' | 'dashboard' | 'my-reports';
  setCurrentTab: (tab: 'validator' | 'dashboard' | 'my-reports') => void;
}

export function Navbar({ currentTab, setCurrentTab }: NavbarProps) {
  const { user, loading } = useAuth();

  return (
    <nav className="sticky top-6 z-50 mx-4 sm:mx-6 lg:mx-8 mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-6 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => setCurrentTab('validator')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 tracking-tight">Startup Validator</span>
            </div>
            
            <div className="hidden md:flex space-x-2">
              <button
                onClick={() => setCurrentTab('validator')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center",
                  currentTab === 'validator' ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                )}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Validate
              </button>
              {user && (
                <>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center",
                      currentTab === 'dashboard' ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                    )}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentTab('my-reports')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center",
                      currentTab === 'my-reports' ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                    )}
                  >
                    <Library className="w-4 h-4 mr-2" />
                    My Reports
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {!loading && (
              user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-zinc-300 hidden sm:block pr-1">{user.displayName}</span>
                  </div>
                  <button
                    onClick={logOut}
                    className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/10 rounded-xl transition-all"
                    title="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="inline-flex items-center px-5 py-2.5 bg-white text-black hover:bg-zinc-200 font-medium rounded-xl transition-all text-sm shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
