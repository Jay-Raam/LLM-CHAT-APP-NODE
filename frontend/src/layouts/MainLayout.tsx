import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { logout } from '../store/authSlice';
import { setActiveSession } from '../store/chatSlice';
import { MessageSquare, Plus, LogOut, Bot, Menu, X, Trash2 } from 'lucide-react';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { deleteSession } from '../api/chat';
import { removeSession } from '../store/chatSlice';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { sessions, activeSessionId } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    try {
      return window.innerWidth >= 1024; // open by default on large screens
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    const onResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleNewChat = () => {
    dispatch(setActiveSession(null));
    // In a real app, you might call the API to create a session first
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string, sessionTitle: string) => {
    e.stopPropagation();
    setDeleteTarget({ id: sessionId, title: sessionTitle });
  };

  const confirmDeleteSession = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteSession(deleteTarget.id);
      dispatch(removeSession(deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete session', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 transform bg-[#0F0F0F] border-r border-white/5 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full",
          isSidebarOpen && "translate-x-0"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Nexus AI</span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 w-full py-3 mb-6 text-sm font-medium transition-all bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Recent Chats</p>
            {sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => dispatch(setActiveSession(session.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dispatch(setActiveSession(session.id));
                  }
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors group relative cursor-pointer",
                  activeSessionId === session.id
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate pr-6">{session.title}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(e, session.id, session.title)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  aria-label={`Delete chat ${session.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center px-3 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500 font-medium">No chat history yet</p>
                <p className="text-[10px] text-zinc-600 mt-1">Your conversations will appear here</p>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="pt-4 mt-4 border-t border-white/5">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4 rotate-180" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#141414] p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-chat-title"
            >
              <h3 id="delete-chat-title" className="text-base font-semibold text-white">
                Delete this chat?
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                This will permanently delete <span className="text-zinc-200">{deleteTarget.title}</span> and all its messages.
              </p>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSession}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-white/5">
          <button onClick={() => setIsSidebarOpen((s) => !s)} className="p-2 -ml-2 text-zinc-400">
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-semibold">Nexus AI</span>
        </header>

        {children}
      </main>
    </div>
  );
}
