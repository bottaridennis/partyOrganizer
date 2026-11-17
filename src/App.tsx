import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Login } from './components/auth/Login';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { InventoryView } from './components/inventory/InventoryView';
import { ShoppingList } from './components/inventory/ShoppingList';
import { RequestsView } from './components/inventory/RequestsView';
import { ProductForm } from './components/inventory/ProductForm';
import { ProductMovementModal } from './components/inventory/ProductMovementModal';
import { ParticipantsView } from './components/employees/ParticipantsView';
import { ContributionsView } from './components/employees/ContributionsView';
import { LogsView } from './components/logs/LogsView';
import { AuditLogsView } from './components/logs/AuditLogsView';
import { PartySettings } from './components/party/PartySettings';
import { PartySwitcher, type SwitcherMode } from './components/party/PartySwitcher';
import { FullScreenLoader, NoPartyScreen, PendingScreen } from './components/party/Onboarding';
import { ConfirmDialog } from './components/ui/Modal';
import { useToast } from './components/ui/Toast';
import { useAuth } from './hooks/useAuth';
import { useParties } from './hooks/useParties';
import { useFirebaseData } from './hooks/useFirebaseData';
import { usePantryActions } from './hooks/usePantryActions';
import { PartyProvider, type DeleteTarget, type PartyContextValue } from './lib/party-context';
import { clearPendingInvite, pendingInviteCode, takeInviteCodeFromUrl, useHashRoute } from './lib/router';
import type { Product } from './types';

// Read an invite link before anything else rewrites the URL.
const inviteFromUrl = takeInviteCodeFromUrl();

const DELETE_LABEL: Record<DeleteTarget['type'], string> = {
  product: 'il prodotto',
  participant: 'il partecipante',
  log: 'il movimento',
  category: 'la categoria',
  group: 'il gruppo',
  role: 'il compito',
};

export default function App() {
  const auth = useAuth();
  const { user, userProfile: profile } = auth;
  const partyActions = useParties(profile);
  const { parties } = partyActions;
  const toast = useToast();
  const { route, param, navigate } = useHashRoute();

  const [switcher, setSwitcher] = useState<{ open: boolean; mode: SwitcherMode; code?: string }>({ open: false, mode: 'select' });
  const [productForm, setProductForm] = useState<{ open: boolean; product?: Product; key: number }>({ open: false, key: 0 });
  const [movement, setMovement] = useState<{ product: Product; type: 'withdraw' | 'return' } | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);

  const party = parties.find(p => p.id === profile?.partyId);
  const isOwner = !!user && party?.ownerUid === user.uid;
  const isOrganizer = !!user && !!party && (isOwner || party.memberRoles?.[user.uid] === 'organizer');
  // Members without a status entry predate the approval flow: treat them as active.
  const isActive = !!user && !!party && (isOwner || (party.memberStatus?.[user.uid] ?? 'active') === 'active');

  const data = useFirebaseData(party?.id, isOrganizer, isActive);
  const actions = usePantryActions(profile, isOrganizer, data.participants);
  const me = useMemo(() => data.participants.find(p => p.uid === user?.uid), [data.participants, user?.uid]);

  // ------------------------------------------------------------ side effects

  // The active party was deleted or we were removed from it: fall back to another one.
  const fallbackRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !profile?.partyId || partyActions.loading || party || parties.length === 0) return;
    if (fallbackRef.current === profile.partyId) return;
    fallbackRef.current = profile.partyId;
    partyActions.selectParty(user.uid, parties[0].id!).catch(err => console.warn(err));
  }, [user, profile?.partyId, party, parties, partyActions]);

  // Join automatically after following an invite link.
  const joiningRef = useRef(false);
  useEffect(() => {
    const code = inviteFromUrl || pendingInviteCode();
    if (!code || !profile || partyActions.loading || joiningRef.current) return;
    joiningRef.current = true;
    clearPendingInvite();
    partyActions
      .joinParty(code, profile)
      .then(r => toast.success(r.alreadyMember ? `Sei già in "${r.name}"` : `Richiesta inviata a "${r.name}"`))
      .catch(err => {
        toast.error(err);
        setSwitcher({ open: true, mode: 'join', code });
      });
  }, [profile, partyActions, toast]);

  // Old parties may lack the participant record of a member.
  const ensuredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!party?.id || !isActive || data.loading || data.error || me || ensuredRef.current === party.id) return;
    ensuredRef.current = party.id;
    actions.ensureMemberRecord(party).catch(err => console.warn('Record partecipante non creato', err));
  }, [party, isActive, data.loading, data.error, me, actions]);

  // Non-organizers landing on an organizer-only page go home.
  useEffect(() => {
    if (party && !isOrganizer && (route === 'registro' || route === 'impostazioni')) navigate('home');
  }, [party, isOrganizer, route, navigate]);

  const openPartySwitcher = useCallback((mode: SwitcherMode = 'select') => setSwitcher({ open: true, mode }), []);
  const logout = useCallback(() => {
    auth.logout();
    navigate('home');
  }, [auth, navigate]);

  // ------------------------------------------------------------ gates

  if (auth.loading || (user && !profile)) return <FullScreenLoader />;

  if (!user || !profile) {
    return (
      <Login
        onGoogleLogin={auth.loginWithGoogle}
        onEmailLogin={auth.loginWithEmail}
        onRegister={auth.registerWithEmail}
        onResetPassword={auth.resetPassword}
        inviteCode={inviteFromUrl || pendingInviteCode()}
      />
    );
  }

  if (partyActions.loading) return <FullScreenLoader label="Carico le tue feste…" />;

  const switcherModal = (
    <PartySwitcher
      open={switcher.open}
      onClose={() => setSwitcher(s => ({ ...s, open: false }))}
      initialMode={switcher.mode}
      initialCode={switcher.code}
      parties={parties}
      profile={profile}
      onSelect={id => partyActions.selectParty(user.uid, id).then(() => navigate('home'))}
      onCreate={async name => {
        await partyActions.createParty(name, profile);
        navigate('home');
        toast.success(`"${name.trim()}" è pronta! Invita gli amici 🎉`);
      }}
      onJoin={async code => {
        const r = await partyActions.joinParty(code, profile);
        navigate('home');
        toast.success(r.alreadyMember ? `Sei già in "${r.name}"` : `Richiesta inviata a "${r.name}"`);
      }}
    />
  );

  if (!party) {
    return (
      <>
        <NoPartyScreen profile={profile} onCreate={() => openPartySwitcher('create')} onJoin={() => openPartySwitcher('join')} onLogout={logout} />
        {switcherModal}
      </>
    );
  }

  if (!isActive) {
    return (
      <>
        <PendingScreen
          partyName={party.name}
          onSwitch={() => openPartySwitcher('select')}
          onLeave={() => toast.run(() => partyActions.leaveParty(party.id!, user.uid), 'Richiesta annullata')}
          onLogout={logout}
        />
        {switcherModal}
      </>
    );
  }

  const ctx: PartyContextValue = {
    user,
    profile,
    party,
    isOrganizer,
    isOwner,
    me,
    data,
    actions,
    partyActions,
    navigate,
    openPartySwitcher,
    openProductForm: product => setProductForm(f => ({ open: true, product, key: f.key + 1 })),
    openMovement: (product, type = 'withdraw') => setMovement({ product, type }),
    confirmDelete: setDeleting,
  };

  const page = (() => {
    switch (route) {
      case 'dispensa': return <InventoryView ownerFilter={param} />;
      case 'spesa': return <ShoppingList />;
      case 'amici': return <ParticipantsView />;
      case 'richieste': return <RequestsView />;
      case 'movimenti': return <LogsView />;
      case 'contributi': return <ContributionsView />;
      case 'registro': return isOrganizer ? <AuditLogsView /> : null;
      case 'impostazioni': return isOrganizer ? <PartySettings /> : null;
      default: return <Dashboard />;
    }
  })();

  // Keep the movement dialog in sync with live quantities.
  const liveMovementProduct = movement && (data.products.find(p => p.id === movement.product.id) || movement.product);

  return (
    <PartyProvider value={ctx}>
      <AppShell route={route} onLogout={logout} onQuickAdd={() => ctx.openProductForm()}>
        {data.error && (
          <div role="alert" className="mb-6 flex gap-3 p-4 rounded-2xl bg-danger-soft text-danger-soft-ink text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {data.error}
          </div>
        )}
        {page}
      </AppShell>

      {productForm.open && <ProductForm key={productForm.key} open onClose={() => setProductForm(f => ({ ...f, open: false }))} product={productForm.product} />}
      {liveMovementProduct && <ProductMovementModal key={liveMovementProduct.id} product={liveMovementProduct} initialType={movement!.type} onClose={() => setMovement(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Eliminare ${deleting ? DELETE_LABEL[deleting.type] : ''}?`}
        message={<><strong className="text-ink">{deleting?.name}</strong> verrà eliminato definitivamente.</>}
        onConfirm={async () => {
          if (deleting) await toast.run(() => actions.deleteEntity(deleting.type, deleting.id, deleting.name), 'Eliminato');
        }}
      />
      {switcherModal}
    </PartyProvider>
  );
}
