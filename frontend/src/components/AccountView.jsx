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
  Lock
} from 'lucide-react';
import { changePassword, registerUser, fetchUsers } from '../api';

export default function AccountView({ currentUser, onLogout }) {
  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);

  // Create User state
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Student');
  const [newUserRecovery, setNewUserRecovery] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState(null);
  const [regSuccess, setRegSuccess] = useState(null);

  // User list
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsersList(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPassword.length < 4) {
      setPwError('New password must be at least 4 characters long');
      return;
    }

    try {
      setPwLoading(true);
      await changePassword(currentUser.username, currentPassword, newPassword);
      setPwSuccess('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    try {
      setRegLoading(true);
      const res = await registerUser({
        username: newUsername,
        password: newUserPassword,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        recovery_code: newUserRecovery || 'STUDY2026',
      });
      setRegSuccess(`Account for "${res.name}" (@${res.username}) created successfully!`);
      setNewUsername('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRecovery('');
      loadUsers();
    } catch (err) {
      setRegError(err.message || 'Failed to create account');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. CURRENT USER PROFILE CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-500/20 shrink-0">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                {currentUser?.role || 'Student'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Username: <strong className="text-slate-700">@{currentUser?.username}</strong> • Email: {currentUser?.email}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Active Session • Stored permanently on backend server
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. CHANGE PASSWORD CARD */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500">Update credentials for your account</p>
            </div>
          </div>

          {pwError && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-70 mt-2"
            >
              {pwLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* 3. CREATE NEW ACCOUNT (As requested: "and other remaining i will create later") */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create New Account</h3>
              <p className="text-xs text-slate-500">Add student or faculty logins to the app</p>
            </div>
          </div>

          {regError && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          {regSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{regSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. student4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="sarah@mail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty / Teacher</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recovery Secret Code <span className="text-slate-400 font-normal">(for forgot password)</span>
              </label>
              <input
                type="text"
                value={newUserRecovery}
                onChange={(e) => setNewUserRecovery(e.target.value)}
                placeholder="e.g. SARAH2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-70 mt-1"
            >
              {regLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      {/* 4. REGISTERED USERS DIRECTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Registered App Accounts ({usersList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Pre-configured &amp; created accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Username</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Recovery Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {u.name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-blue-600 font-medium">
                    @{u.username}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'Admin' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : u.role === 'Faculty' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {u.email}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                    {u.recovery_code || 'STUDY2026'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
