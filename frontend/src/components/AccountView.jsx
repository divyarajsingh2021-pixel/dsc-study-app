import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Users,
  Mail,
  Calendar,
  Lock,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Crown
} from 'lucide-react';
import { changePassword, registerUser, fetchUsers, deleteUser, adminResetPassword } from '../api';

export default function AccountView({ currentUser, onLogout }) {
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.username === 'admin';

  // --- Change Own Password ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);

  // --- Create User (admin only) ---
  const [newUsername, setNewUsername]     = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName]     = useState('');
  const [newUserEmail, setNewUserEmail]   = useState('');
  const [newUserRole, setNewUserRole]     = useState('Student');
  const [newUserRecovery, setNewUserRecovery] = useState('');
  const [regLoading, setRegLoading]   = useState(false);
  const [regError, setRegError]       = useState(null);
  const [regSuccess, setRegSuccess]   = useState(null);

  // --- Admin Reset Password ---
  const [resetTarget, setResetTarget]       = useState(null); // username being reset
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPw, setShowResetPw]         = useState(false);
  const [resetLoading, setResetLoading]       = useState(false);
  const [resetError, setResetError]           = useState(null);
  const [resetSuccess, setResetSuccess]       = useState(null);

  // --- Delete Confirm ---
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState(null);

  // --- User List ---
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers(currentUser?.username || '');
      setUsersList(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null); setPwSuccess(null);
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    if (newPassword.length < 4) { setPwError('Password must be at least 4 characters'); return; }
    try {
      setPwLoading(true);
      await changePassword(currentUser.username, currentPassword, newPassword);
      setPwSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(null); setRegSuccess(null);
    try {
      setRegLoading(true);
      await registerUser({
        username: newUsername, password: newUserPassword,
        name: newUserName, email: newUserEmail,
        role: newUserRole, recovery_code: newUserRecovery,
      });
      setRegSuccess(`Account "@${newUsername}" created successfully!`);
      setNewUsername(''); setNewUserPassword(''); setNewUserName('');
      setNewUserEmail(''); setNewUserRole('Student'); setNewUserRecovery('');
      await loadUsers();
    } catch (err) {
      setRegError(err.message || 'Failed to create account');
    } finally { setRegLoading(false); }
  };

  const handleDelete = async (username) => {
    setDeleteError(null);
    try {
      setDeleteLoading(true);
      await deleteUser(username, currentUser.username);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally { setDeleteLoading(false); }
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    setResetError(null); setResetSuccess(null);
    if (resetNewPassword.length < 4) { setResetError('Password must be at least 4 characters'); return; }
    try {
      setResetLoading(true);
      await adminResetPassword(resetTarget, resetNewPassword, currentUser.username);
      setResetSuccess(`Password for @${resetTarget} has been reset!`);
      setResetNewPassword(''); setResetTarget(null);
    } catch (err) {
      setResetError(err.message || 'Failed to reset password');
    } finally { setResetLoading(false); }
  };

  const InputField = ({ label, type = 'text', value, onChange, placeholder, show, onToggle, required = false }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show !== undefined ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors pr-10"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* My Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20 shrink-0">
            {currentUser?.name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 truncate">{currentUser?.name}</h2>
              {isAdmin && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  <Crown size={11} /> ADMIN
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">@{currentUser?.username} · {currentUser?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">Joined {currentUser?.created_at}</p>
          </div>
          <button
            onClick={onLogout}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors shrink-0"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Change Own Password */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Change My Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3" autoComplete="off">
          {pwError   && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2"><AlertCircle size={14} />{pwError}</div>}
          {pwSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 size={14} />{pwSuccess}</div>}
          <InputField label="Current Password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" show={showCur} onToggle={() => setShowCur(v => !v)} required />
          <InputField label="New Password" value={newPassword} onChange={setNewPassword} placeholder="Min 4 characters" show={showNew} onToggle={() => setShowNew(v => !v)} required />
          <InputField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" show={showConf} onToggle={() => setShowConf(v => !v)} required />
          <button type="submit" disabled={pwLoading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2">
            <Lock size={14} />{pwLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ===== ADMIN ONLY SECTION ===== */}
      {isAdmin && (
        <>
          {/* Create New Account */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={18} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Create New Account</h3>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Admin Only</span>
            </div>
            <form onSubmit={handleRegister} className="space-y-3" autoComplete="off">
              {regError   && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2"><AlertCircle size={14} />{regError}</div>}
              {regSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 size={14} />{regSuccess}</div>}
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Username *" value={newUsername} onChange={setNewUsername} placeholder="e.g. student4" required />
                <InputField label="Password *" value={newUserPassword} onChange={setNewUserPassword} placeholder="Min 4 chars" show={false} onToggle={() => {}} required />
              </div>
              <InputField label="Full Name *" value={newUserName} onChange={setNewUserName} placeholder="e.g. Rahul Sharma" required />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Email" value={newUserEmail} onChange={setNewUserEmail} placeholder="email@example.com" />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                    <option>Student</option>
                    <option>Faculty</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>
              <InputField label="Recovery Code" value={newUserRecovery} onChange={setNewUserRecovery} placeholder="Secret recovery code" />
              <button type="submit" disabled={regLoading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                <UserPlus size={14} />{regLoading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Admin Reset Password Modal */}
          {resetTarget && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-1">Reset Password</h3>
                <p className="text-xs text-slate-500 mb-4">Set a new password for <strong>@{resetTarget}</strong></p>
                {resetError   && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{resetError}</div>}
                {resetSuccess && <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">{resetSuccess}</div>}
                {!resetSuccess && (
                  <form onSubmit={handleAdminResetPassword} className="space-y-3" autoComplete="off">
                    <div className="relative">
                      <input type={showResetPw ? 'text' : 'password'} value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)}
                        placeholder="New password (min 4 chars)" required autoComplete="off"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 pr-10" />
                      <button type="button" onClick={() => setShowResetPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showResetPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setResetTarget(null); setResetNewPassword(''); setResetError(null); }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors">Cancel</button>
                      <button type="submit" disabled={resetLoading}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all disabled:opacity-70">
                        {resetLoading ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </div>
                  </form>
                )}
                {resetSuccess && (
                  <button onClick={() => { setResetTarget(null); setResetSuccess(null); setResetNewPassword(''); }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors">Done</button>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirm Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={22} className="text-red-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-center mb-1">Delete Account?</h3>
                <p className="text-xs text-slate-500 text-center mb-4">Account <strong>@{deleteTarget}</strong> and all their data will be permanently removed.</p>
                {deleteError && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{deleteError}</div>}
                <div className="flex gap-2">
                  <button onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors">Cancel</button>
                  <button onClick={() => handleDelete(deleteTarget)} disabled={deleteLoading}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-1.5">
                    <Trash2 size={14} />{deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All Users Table — Admin Only */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">All Registered Accounts ({usersList.length})</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Admin View</span>
              </div>
              <button onClick={loadUsers} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Refresh">
                <RefreshCw size={15} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Recovery Code</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {u.name?.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-blue-600 font-medium">@{u.username}</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'Faculty' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>{u.role}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{u.email}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-700 text-[11px] font-medium">
                        {u.recovery_code || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{u.created_at}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => { setResetTarget(u.username); setResetError(null); setResetSuccess(null); setResetNewPassword(''); }}
                            className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Reset password"
                          >
                            <KeyRound size={11} /> Reset
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => { setDeleteTarget(u.username); setDeleteError(null); }}
                              className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Delete account"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Non-admin: only their own info, no user list */}
      {!isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Account Activity</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <User size={16} className="text-blue-500" />
              <span><strong>Role:</strong> {currentUser?.role}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <Mail size={16} className="text-blue-500" />
              <span><strong>Email:</strong> {currentUser?.email}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <Calendar size={16} className="text-blue-500" />
              <span><strong>Joined:</strong> {currentUser?.created_at}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
