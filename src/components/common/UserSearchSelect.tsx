import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { Search, User as UserIcon, Check, ChevronDown, X, Building2 } from 'lucide-react';

interface UserSearchSelectProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (user: User) => void;
  label?: string;
  required?: boolean;
  themeColor?: 'blue' | 'teal' | 'cyan';
  placeholder?: string;
  helperText?: string;
  id?: string;
}

export const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  label = 'Nama Pemohon (Karyawan / Guru)',
  required = true,
  themeColor = 'blue',
  placeholder = 'Cari nama, unit, atau departemen...',
  helperText,
  id = 'user-search-select'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // Theme styling helpers
  const colorStyles = {
    blue: {
      ring: 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
      activeBg: 'bg-blue-50 text-blue-900 border-blue-200',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      avatarBg: 'bg-blue-600 text-white',
      accentText: 'text-blue-600',
      selectedItem: 'bg-blue-50 text-blue-900',
      borderFocus: 'border-blue-500'
    },
    teal: {
      ring: 'focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500',
      activeBg: 'bg-teal-50 text-teal-900 border-teal-200',
      badge: 'bg-teal-100 text-teal-800 border-teal-200',
      avatarBg: 'bg-teal-600 text-white',
      accentText: 'text-teal-600',
      selectedItem: 'bg-teal-50 text-teal-900',
      borderFocus: 'border-teal-500'
    },
    cyan: {
      ring: 'focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500',
      activeBg: 'bg-cyan-50 text-cyan-900 border-cyan-200',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      avatarBg: 'bg-cyan-700 text-white',
      accentText: 'text-cyan-700',
      selectedItem: 'bg-cyan-50 text-cyan-900',
      borderFocus: 'border-cyan-500'
    }
  }[themeColor];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (u.name || '').toLowerCase().includes(q);
    const unitMatch = (u.unit || '').toLowerCase().includes(q);
    const deptMatch = (u.department || '').toLowerCase().includes(q);
    const roleMatch = (u.role || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    return nameMatch || unitMatch || deptMatch || roleMatch || emailMatch;
  });

  const handleSelect = (user: User) => {
    onSelectUser(user);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef} id={id}>
      {label && (
        <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <UserIcon className={`w-3.5 h-3.5 ${colorStyles.accentText}`} />
            <span>{label} {required && '*'}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Pencarian Cepat
          </span>
        </label>
      )}

      {/* Main trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 bg-white border border-slate-300 rounded-lg text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all hover:border-slate-400 ${
          isOpen ? `${colorStyles.borderFocus} ring-1` : ''
        }`}
      >
        {selectedUser ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-6 h-6 rounded-full ${colorStyles.avatarBg} flex items-center justify-center text-[10px] font-bold shrink-0`}>
              {getInitials(selectedUser.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 truncate text-xs">
                {selectedUser.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                <span>{selectedUser.department || selectedUser.role}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{selectedUser.unit || 'Umum'}</span>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 font-normal">Pilih nama pemohon...</span>
        )}

        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-medium focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
              <span>{filteredUsers.length} nama ditemukan</span>
              <span>Ketik nama/unit/departemen</span>
            </div>
          </div>

          {/* User items list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isSelected = user.id === selectedUserId;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={`w-full p-2 text-left rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected ? colorStyles.selectedItem : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected ? colorStyles.avatarBg : 'bg-slate-200 text-slate-700'
                      }`}>
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
                          {user.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                          <span>{user.department || user.role}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{user.unit || 'Umum'}</span>
                          {user.email && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">{user.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className={`w-4 h-4 shrink-0 ${colorStyles.accentText}`} />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                Tidak ada data pemohon dengan kata kunci "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}

      {helperText && (
        <span className="text-[10px] text-slate-500 mt-0.5 block">
          {helperText}
        </span>
      )}
    </div>
  );
};
