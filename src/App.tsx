import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard,
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  Filter, 
  Plus, 
  UserPlus,
  Settings2, 
  User as UserIcon, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  Check,
  Printer,
  X,
  QrCode,
  Bell,
  History,
  ShieldCheck,
  Building2,
  Package,
  Users,
  FileText,
  Loader2,
  Boxes,
  ShoppingBag,
  PartyPopper,
  Menu as MenuIcon
} from 'lucide-react';
import Barcode from 'react-barcode';

// Components
import { Login } from './components/auth/Login';
import { NavItem } from './components/ui/NavItem';
import { ProductCard } from './components/inventory/ProductCard';
import { ParticipantCard } from './components/employees/ParticipantCard';
import { PantryLogItem } from './components/logs/PantryLogItem';
import { AddProductForm } from './components/inventory/AddProductForm';
import { EditProductForm } from './components/inventory/EditProductForm';
import { AddParticipantForm } from './components/employees/AddParticipantForm';
import { EditParticipantForm } from './components/employees/EditParticipantForm';
import { AddPantryLogForm } from './components/logs/AddPantryLogForm';
import { PartySettings } from './components/party/PartySettings';
import { ProductMovementModal } from './components/inventory/ProductMovementModal';
import { PartyManager } from './components/party/PartyManager';
import { RequestsView } from './components/inventory/RequestsView';
import { AuditLogsView } from './components/logs/AuditLogsView';
import { DeleteConfirmationModal } from './components/ui/DeleteConfirmationModal';
import { Dashboard } from './components/dashboard/Dashboard';

// Hooks & Utils
import { useAuth } from './hooks/useAuth';
import { useFirebaseData } from './hooks/useFirebaseData';
import { useParties } from './hooks/useParties';
import { usePantryActions } from './hooks/usePantryActions';
import { cn, cleanObject } from './lib/utils';
import { logAudit } from './lib/audit';
import { db } from './firebase';
import { doc, updateDoc, addDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { Product, Participant, PantryLog, Category, Group, ParticipantRole, ProductRequest, AuditLog } from './types';

import { ParticipantContributionTable } from './components/employees/ParticipantContributionTable';

type Tab = 'dashboard' | 'inventory' | 'participants' | 'logs' | 'settings' | 'requests' | 'audit-logs' | 'contributions' | 'add-product' | 'add-participant' | 'add-log';

export default function App() {
  const { user, userProfile, loading: authLoading, loginWithGoogle, loginWithEmail, registerWithEmail, logout } = useAuth();
  const { parties, createParty, joinParty, leaveParty, deleteParty } = useParties(userProfile);
  
  const party = parties.find(w => w.id === userProfile?.partyId);
  const isOrganizer = !!(user && (party?.memberRoles?.[user.uid] === 'organizer' || party?.ownerUid === user.uid));

  const { products, participants, logs, categories, groups, roles, requests, auditLogs, loading: dataLoading } = useFirebaseData(userProfile?.partyId, isOrganizer);
  const { handleProductMovement, approveRequest, rejectRequest, deleteEntity } = usePantryActions(userProfile);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterParticipantId, setFilterParticipantId] = useState<string | null>(null);

  // Modals & Forms
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [movingProduct, setMovingProduct] = useState<Product | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string, name: string, type: 'product' | 'participant' | 'log' | 'category' | 'group' | 'role' } | null>(null);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [partyModalMode, setPartyModalMode] = useState<'select' | 'create' | 'join'>('select');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ensure current user has a participant record
  useEffect(() => {
    if (user && userProfile && party && !authLoading && !dataLoading && participants.length > 0) {
      const hasRecord = participants.some(m => m.uid === user.uid);
      if (!hasRecord) {
        const createMissingRecord = async () => {
          await setDoc(doc(db, 'participants', `member-${party.id}-${user.uid}`), {
            partyId: party.id,
            uid: user.uid,
            name: userProfile.displayName.split(' ')[0] || 'Amico',
            surname: userProfile.displayName.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            group: 'Festa',
            role: party.memberRoles?.[user.uid] || 'Partecipante',
            code: `MEM-${user.uid.substring(0, 5)}`,
            createdAt: new Date().toISOString(),
            imageUrl: userProfile.photoURL || ''
          });
        };
        createMissingRecord();
      }
    }
  }, [user, userProfile, party, authLoading, dataLoading, participants.length]);

  const pendingMembersCount = useMemo(() => {
    if (!party) return 0;
    return Object.values(party.memberStatus || {}).filter(status => status === 'pending').length;
  }, [party]);

  const memberStatus = user ? (party?.memberStatus?.[user.uid] || 'pending') : 'pending';
  const isActive = memberStatus === 'active';

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'low' && p.quantity <= 2) || (statusFilter === 'ok' && p.quantity > 2);
      const matchesParticipant = !filterParticipantId || p.broughtBy === filterParticipantId;

      return matchesSearch && matchesCategory && matchesStatus && matchesParticipant;
    });
  }, [products, searchTerm, filterCategory, statusFilter, filterParticipantId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onGoogleLogin={loginWithGoogle} onEmailLogin={loginWithEmail} onRegister={registerWithEmail} error={null} />;
  }

  if (!userProfile?.partyId && !isPartyModalOpen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Boxes className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Benvenuto su Party Pantry</h1>
            <p className="text-slate-500 mt-2">Per iniziare, crea una nuova festa o unisciti a una esistente.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => { setPartyModalMode('create'); setIsPartyModalOpen(true); }}
              className="group p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-900">Crea Festa</p>
              <p className="text-sm text-slate-500">Organizza un nuovo evento</p>
            </button>

            <button 
              onClick={() => { setPartyModalMode('join'); setIsPartyModalOpen(true); }}
              className="group p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-900">Unisciti a Festa</p>
              <p className="text-sm text-slate-500">Inserisci un codice invito</p>
            </button>
          </div>
          <button 
            onClick={logout}
            className="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition-colors"
          >
            Esci
          </button>
        </div>
      </div>
    );
  }

  if (!isActive && userProfile?.partyId && !isPartyModalOpen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Accesso in Attesa</h1>
            <p className="text-slate-500 mt-2">La tua richiesta di partecipazione alla festa <strong>{party?.name}</strong> è in attesa di approvazione da parte dell'organizzatore.</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-sm text-amber-800">Riceverai l'accesso completo non appena il tuo profilo verrà attivato.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { setPartyModalMode('select'); setIsPartyModalOpen(true); }}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              Cambia Festa
            </button>
            <button 
              onClick={logout}
              className="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
        {isPartyModalOpen && (
          <PartyManager 
            isOpen={isPartyModalOpen}
            onClose={() => setIsPartyModalOpen(false)}
            initialMode={partyModalMode}
            parties={parties}
            userProfile={userProfile!}
            onSelectParty={async (id) => {
              await updateDoc(doc(db, 'users', user.uid), { partyId: id });
              setIsPartyModalOpen(false);
            }}
            onCreateParty={async (name) => {
              await createParty(name, user.uid);
              setIsPartyModalOpen(false);
            }}
            onJoinParty={async (code) => {
              await joinParty(code, user.uid);
              setIsPartyModalOpen(false);
            }}
            onLeaveParty={(id) => leaveParty(id, user.uid)}
            onDeleteParty={deleteParty}
            onUpdateMemberRole={async (pId, uid, role) => {
              await updateDoc(doc(db, 'parties', pId), { [`memberRoles.${uid}`]: role });
            }}
            onRemoveMember={async (pId, uid) => {
              await updateDoc(doc(db, 'parties', pId), { members: parties.find(p => p.id === pId)?.members.filter(m => m !== uid) });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 shadow-sm z-30">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">Party Pantry</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Social Manager</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Menu Principale</p>
          <NavItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={Boxes} label="Dispensa" active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); setFilterParticipantId(null); }} />
          <NavItem icon={Users} label="Partecipanti" active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} />
          {isOrganizer && <NavItem icon={History} label="Movimenti" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />}
          
          {isOrganizer && <div className="pt-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Amministrazione</p>
            {isOrganizer && <NavItem 
              icon={Bell} 
              label="Richieste" 
              active={activeTab === 'requests'} 
              onClick={() => setActiveTab('requests')} 
              badge={(requests.filter(r => r.status === 'pending').length + (isOrganizer ? pendingMembersCount : 0)) || undefined} 
            />}
            {isOrganizer && <NavItem icon={Settings2} label="Impostazioni" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />}
            {isOrganizer && <NavItem icon={ShieldCheck} label="Audit Logs" active={activeTab === 'audit-logs'} onClick={() => setActiveTab('audit-logs')} />}
            {isOrganizer && <NavItem icon={FileText} label="Report Contributi" active={activeTab === 'contributions'} onClick={() => setActiveTab('contributions')} />}
          </div>}

          <div className="pt-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Feste</p>
            <NavItem icon={Boxes} label="Gestisci Feste" active={false} onClick={() => { setPartyModalMode('select'); setIsPartyModalOpen(true); }} />
            <NavItem icon={UserPlus} label="Unisciti a Festa" active={false} onClick={() => { setPartyModalMode('join'); setIsPartyModalOpen(true); }} />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
              {userProfile?.photoURL ? <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <UserIcon className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{userProfile?.displayName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{isOrganizer ? 'Organizzatore' : 'Partecipante'}</p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-20">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 leading-none">
                {party?.name || 'Caricamento...'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Festa Attiva</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => { setPartyModalMode('join'); setIsPartyModalOpen(true); }}
              className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
              title="Unisciti a Festa"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setPartyModalMode('select'); setIsPartyModalOpen(true); }}
              className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
              title="Cambia Festa"
            >
              <Boxes className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 lg:pb-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              products={products} 
              participants={participants} 
              logs={logs} 
            />
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {filterParticipantId && (
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Filtro Partecipante</p>
                      <h3 className="text-lg font-bold text-slate-900">
                        {participants.find(m => m.id === filterParticipantId)?.name} {participants.find(m => m.id === filterParticipantId)?.surname}
                      </h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFilterParticipantId(null)}
                    className="px-4 py-2 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm"
                  >
                    Rimuovi Filtro
                  </button>
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cerca per nome prodotto..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setActiveTab('add-product')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100 whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Aggiungi Prodotto</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => setIsFilterVisible(!isFilterVisible)}
                    className={cn(
                      "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all font-bold text-sm",
                      isFilterVisible ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    Filtri
                  </button>
                  <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                    <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-blue-50 text-blue-600" : "text-slate-400")}><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-blue-50 text-blue-600" : "text-slate-400")}><ListIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {isFilterVisible && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                      <option value="all">Tutte le categorie</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Stato Scorte</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">Tutti gli stati</option>
                      <option value="low">Scorte Basse</option>
                      <option value="ok">Disponibile</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => { setFilterCategory('all'); setFilterGroup('all'); setStatusFilter('all'); setFilterParticipantId(null); }}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      Reset Filtri
                    </button>
                  </div>
                </div>
              )}

              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              )}>
                {filteredProducts.map(product => {
                  const broughtByParticipant = participants.find(p => p.uid === product.broughtBy);
                  const broughtByName = broughtByParticipant ? `${broughtByParticipant.name} ${broughtByParticipant.surname}` : undefined;
                  
                  return (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      viewMode={viewMode}
                      onEdit={() => setEditingProduct(product)}
                      onDelete={() => setDeletingItem({ id: product.id!, name: product.name, type: 'product' })}
                      onMove={() => setMovingProduct(product)}
                      canManage={isOrganizer || product.broughtBy === user?.uid}
                      broughtByName={broughtByName}
                    />
                  );
                })}
              </div>
              {filteredProducts.length === 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nessun prodotto trovato.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Partecipanti</h2>
                  <p className="text-sm text-slate-500">Visualizza gli amici che partecipano alla festa.</p>
                </div>
                {isOrganizer && (
                  <button 
                    onClick={() => setActiveTab('add-participant')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-5 h-5" />
                    Nuovo Partecipante
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {participants.map(participant => (
                    <ParticipantCard 
                      key={participant.id} 
                      participant={participant}
                      onEdit={() => setEditingParticipant(participant)}
                      onDelete={() => setDeletingItem({ id: participant.id!, name: `${participant.name} ${participant.surname}`, type: 'participant' })}
                      onFilter={() => { setFilterParticipantId(participant.id!); setActiveTab('inventory'); }}
                      canManage={isOrganizer}
                      party={party}
                    />
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && isOrganizer && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Movimenti Dispensa</h2>
                  <p className="text-sm text-slate-500">Storico dei prelievi e dei rifornimenti.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('add-log')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
                >
                  <Plus className="w-5 h-5" />
                  Nuovo Movimento
                </button>
              </div>
              <div className="space-y-4">
                {logs.map(log => (
                  <PantryLogItem 
                    key={log.id} 
                    log={log} 
                    participants={participants}
                    onDelete={() => setDeletingItem({ id: log.id!, name: log.description, type: 'log' })}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <RequestsView 
              requests={requests} 
              products={products} 
              participants={participants} 
              userProfile={userProfile!}
              party={party}
              isOrganizer={isOrganizer}
              onApprove={approveRequest}
              onReject={rejectRequest}
              onApproveMember={async (uid) => {
                await updateDoc(doc(db, 'parties', party!.id!), {
                  [`memberStatus.${uid}`]: 'active'
                });
                await logAudit(userProfile, 'update', 'party', party!.id!, party!.name, `Approvato accesso per utente ${uid}`);
              }}
            />
          )}

          {activeTab === 'settings' && isOrganizer && (
            <PartySettings 
              categories={categories}
              groups={groups}
              roles={roles}
              parties={parties}
              userProfile={userProfile}
              onAddCategory={async (name) => { await addDoc(collection(db, 'categories'), { name, partyId: userProfile.partyId }); }}
              onDeleteCategory={async (id) => { 
                const cat = categories.find(c => c.id === id);
                if (cat) setDeletingItem({ id, name: cat.name, type: 'category' });
              }}
              onAddGroup={async (name) => { await addDoc(collection(db, 'groups'), { name, partyId: userProfile.partyId }); }}
              onDeleteGroup={async (id) => { 
                const group = groups.find(a => a.id === id);
                if (group) setDeletingItem({ id, name: group.name, type: 'group' });
              }}
              onAddRole={async (name) => { await addDoc(collection(db, 'participant_roles'), { name, partyId: userProfile.partyId }); }}
              onDeleteRole={async (id) => { 
                const role = roles.find(r => r.id === id);
                if (role) setDeletingItem({ id, name: role.name, type: 'role' });
              }}
              onAddParty={async (name) => { await createParty(name, user.uid); }}
              onDeleteParty={deleteParty}
              onLeaveParty={(id) => leaveParty(id, user.uid)}
              onUpdateMemberRole={async (pId, uid, role) => { await updateDoc(doc(db, 'parties', pId), { [`memberRoles.${uid}`]: role }); }}
              onRemoveMember={async (pId, uid) => { }}
              onClose={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'audit-logs' && isOrganizer && <AuditLogsView logs={auditLogs} />}

          {activeTab === 'contributions' && isOrganizer && <ParticipantContributionTable participants={participants} products={products} />}

          {activeTab === 'add-product' && (
            <AddProductForm 
              categories={categories}
              participants={participants}
              onAdd={async (data) => { await addDoc(collection(db, 'products'), { ...data, partyId: userProfile.partyId }); setActiveTab('inventory'); }}
              onCancel={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'add-participant' && (
            <AddParticipantForm 
              groups={groups}
              roles={roles}
              onAdd={async (data) => { 
                await addDoc(collection(db, 'participants'), { 
                  ...data, 
                  partyId: userProfile!.partyId,
                  createdAt: new Date().toISOString(),
                  uid: '' // Manual participants don't have a UID yet
                }); 
                setActiveTab('participants'); 
              }}
              onCancel={() => setActiveTab('participants')}
            />
          )}

          {editingParticipant && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-4xl my-auto">
                <EditParticipantForm 
                  participant={editingParticipant}
                  groups={groups}
                  roles={roles}
                  party={party}
                  onCancel={() => setEditingParticipant(null)}
                  onUpdate={async (data) => {
                    const { memberStatus, memberRole, ...participantData } = data;
                    
                    if (editingParticipant.id?.startsWith('member-')) {
                      // Update web member
                      const batch = writeBatch(db);
                      const whRef = doc(db, 'parties', party!.id!);
                      const userRef = doc(db, 'users', editingParticipant.uid!);
                      
                      if (memberStatus) batch.update(whRef, { [`memberStatus.${editingParticipant.uid}`]: memberStatus });
                      if (memberRole) {
                        batch.update(whRef, { [`memberRoles.${editingParticipant.uid}`]: memberRole });
                        batch.update(userRef, { role: memberRole });
                      }
                      
                      // Update basic info in users collection
                      batch.update(userRef, {
                        displayName: `${data.name} ${data.surname}`,
                        ...cleanObject(participantData)
                      });
                      
                      await batch.commit();
                    } else {
                      // Update manual participant
                      await updateDoc(doc(db, 'participants', editingParticipant.id!), cleanObject(participantData));
                    }
                    
                    await logAudit(userProfile, 'update', 'participant', editingParticipant.id!, `${data.name} ${data.surname}`, 'Aggiornate informazioni partecipante');
                    setEditingParticipant(null);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'add-log' && (
            <AddPantryLogForm 
              products={products}
              participants={participants}
              onAdd={async (data) => { await addDoc(collection(db, 'pantry_logs'), { ...data, partyId: userProfile.partyId, date: new Date().toISOString() }); setActiveTab('logs'); }}
              onCancel={() => setActiveTab('logs')}
            />
          )}
        </main>

        {/* Mobile Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-between items-center z-40 shadow-2xl pb-safe">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", activeTab === 'dashboard' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", activeTab === 'inventory' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-[10px] font-bold">Dispensa</span>
          </button>

          <div className="relative -mt-12">
            <button 
              onClick={() => setActiveTab('add-product')}
              className="w-14 h-14 bg-pink-600 text-white rounded-2xl shadow-xl shadow-pink-200 flex items-center justify-center hover:bg-pink-700 transition-all active:scale-95 border-4 border-white"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('participants')} 
            className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", activeTab === 'participants' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold">Amici</span>
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", ["logs", "requests", "settings", "audit-logs", "contributions"].includes(activeTab) ? "text-blue-600 bg-blue-50" : "text-slate-400")}
          >
            <MenuIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">Menu</span>
          </button>
        </nav>
      </div>

      {/* Mobile Menu Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Menu Extra</h3>
                <p className="text-xs text-slate-500 font-medium">Altre sezioni della festa</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {isOrganizer && (
                <>
                  <button 
                    onClick={() => { setActiveTab('logs'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
                      activeTab === 'logs' ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <History className="w-8 h-8" />
                    <span className="text-sm font-bold">Movimenti</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('requests'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all relative",
                      activeTab === 'requests' ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <Bell className="w-8 h-8" />
                    <span className="text-sm font-bold">Richieste</span>
                    {(requests.filter(r => r.status === 'pending').length + pendingMembersCount) > 0 && (
                      <span className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {requests.filter(r => r.status === 'pending').length + pendingMembersCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => { setActiveTab('contributions'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
                      activeTab === 'contributions' ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <FileText className="w-8 h-8" />
                    <span className="text-sm font-bold text-center">Report Contributi</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('audit-logs'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
                      activeTab === 'audit-logs' ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <ShieldCheck className="w-8 h-8" />
                    <span className="text-sm font-bold">Audit Logs</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
                      activeTab === 'settings' ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <Settings2 className="w-8 h-8" />
                    <span className="text-sm font-bold">Impostazioni</span>
                  </button>
                </>
              )}
              <button 
                onClick={() => { setPartyModalMode('select'); setIsPartyModalOpen(true); setIsMobileMenuOpen(false); }}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-slate-50 border border-transparent text-slate-600 hover:bg-white hover:border-slate-200 transition-all"
              >
                <PartyPopper className="w-8 h-8" />
                <span className="text-sm font-bold">Gestisci Feste</span>
              </button>
              <button 
                onClick={() => { setPartyModalMode('join'); setIsPartyModalOpen(true); setIsMobileMenuOpen(false); }}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-slate-50 border border-transparent text-slate-600 hover:bg-white hover:border-slate-200 transition-all"
              >
                <UserPlus className="w-8 h-8" />
                <span className="text-sm font-bold text-center">Unisciti a Festa</span>
              </button>
              <button 
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-all"
              >
                <LogOut className="w-8 h-8" />
                <span className="text-sm font-bold">Esci</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <EditProductForm 
              product={editingProduct} 
              categories={categories}
              participants={participants}
              onSave={async (updated) => { 
                await updateDoc(doc(db, 'products', updated.id!), updated as any);
                await logAudit(userProfile, 'update', 'product', updated.id!, updated.name, `Aggiornato prodotto: ${updated.name}`);
                setEditingProduct(null);
              }}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}

      {movingProduct && (
        <ProductMovementModal 
          isOpen={!!movingProduct}
          onClose={() => setMovingProduct(null)}
          product={movingProduct}
          participants={participants}
          userProfile={userProfile!}
          onConfirm={async (data) => { await handleProductMovement(movingProduct!, data); }}
          isOrganizer={isOrganizer}
        />
      )}

      {deletingItem && (
        <DeleteConfirmationModal 
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={() => deleteEntity(deletingItem!.type, deletingItem!.id, deletingItem!.name)}
          title={`Elimina ${
            deletingItem?.type === 'product' ? 'Prodotto' : 
            deletingItem?.type === 'participant' ? 'Partecipante' : 
            deletingItem?.type === 'log' ? 'Log' : 
            deletingItem?.type === 'category' ? 'Categoria' : 
            deletingItem?.type === 'group' ? 'Gruppo' : 'Ruolo'
          }`}
          message={`Sei sicuro di voler eliminare "${deletingItem?.name}"? Questa azione non può essere annullata.`}
          confirmString={deletingItem?.name || ''}
        />
      )}

      {isPartyModalOpen && (
        <PartyManager 
          isOpen={isPartyModalOpen}
          onClose={() => setIsPartyModalOpen(false)}
          initialMode={partyModalMode}
          parties={parties}
          userProfile={userProfile!}
          onSelectParty={async (id) => {
            await updateDoc(doc(db, 'users', user.uid), { partyId: id });
            setIsPartyModalOpen(false);
          }}
          onCreateParty={async (name) => {
            await createParty(name, user.uid);
            setIsPartyModalOpen(false);
          }}
          onJoinParty={async (code) => {
            await joinParty(code, user.uid);
            setIsPartyModalOpen(false);
          }}
          onLeaveParty={(id) => leaveParty(id, user.uid)}
          onDeleteParty={deleteParty}
          onUpdateMemberRole={async (pId, uid, role) => {
            await updateDoc(doc(db, 'parties', pId), { [`memberRoles.${uid}`]: role });
          }}
          onRemoveMember={async (pId, uid) => {
            await updateDoc(doc(db, 'parties', pId), { members: parties.find(p => p.id === pId)?.members.filter(m => m !== uid) });
          }}
        />
      )}
    </div>
  );
}
