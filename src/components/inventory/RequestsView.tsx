import React from 'react';
import { 
  Bell, 
  Package, 
  CheckCircle2, 
  History, 
  XCircle,
  Users,
  Pizza,
  Beer,
  Heart
} from 'lucide-react';
import { ProductRequest, Product, Participant, UserProfile, Party } from '../../types';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function RequestsView({ 
  requests, 
  products, 
  participants, 
  userProfile,
  party,
  isOrganizer: isOrganizerProp,
  onApprove,
  onReject,
  onApproveMember
}: { 
  requests: ProductRequest[], 
  products: Product[], 
  participants: Participant[],
  userProfile: UserProfile,
  party?: Party | null,
  isOrganizer?: boolean,
  onApprove: (request: ProductRequest) => Promise<void>,
  onReject: (request: ProductRequest) => Promise<void>,
  onApproveMember?: (uid: string) => Promise<void>
}) {
  const isOrganizer = isOrganizerProp !== undefined ? isOrganizerProp : userProfile.role === 'organizer';
  const myRequests = requests.filter(r => r.userId === userProfile.uid);
  const displayRequests = isOrganizer ? requests : myRequests;

  const pendingRequests = displayRequests.filter(r => r.status === 'pending');
  const historyRequests = displayRequests.filter(r => r.status !== 'pending');

  const pendingMembers = participants.filter(m => 
    m.id?.startsWith('member-') && 
    party?.memberStatus?.[m.uid!] === 'pending'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Richieste e Accessi</h2>
          <p className="text-sm text-slate-500">Gestisci chi vuole unirsi alla festa e le richieste di prelievo.</p>
        </div>
      </div>

      <div className="space-y-6">
        {isOrganizer && pendingMembers.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-pink-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                Richieste Accesso alla Festa ({pendingMembers.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingMembers.map(member => (
                <div key={member.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
                      {member.imageUrl ? <img src={member.imageUrl} alt="" className="w-full h-full object-cover" /> : <Users className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{member.name} {member.surname}</h4>
                      <p className="text-sm text-slate-500">{member.email}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Richiesta inviata il {new Date(member.createdAt).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onApproveMember?.(member.uid!)}
                    className="px-6 py-2.5 bg-pink-600 text-white font-bold text-sm rounded-xl hover:bg-pink-700 transition-all shadow-md shadow-pink-100"
                  >
                    Accetta alla Festa
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Richieste Prelievo ({pendingRequests.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingRequests.length > 0 ? pendingRequests.map(request => (
              <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <Pizza className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{request.productName}</h4>
                    <p className="text-sm text-slate-500">
                      Richiesto da <span className="font-bold text-slate-700">{request.userName}</span> • {request.quantity} pz
                    </p>
                    {request.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic">"{request.notes}"</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                      {new Date(request.createdAt).toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReject(request)}
                    className="px-4 py-2 text-red-600 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
                  >
                    Rifiuta
                  </button>
                  <button
                    onClick={() => onApprove(request)}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                  >
                    Approva
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">Nessuna richiesta pendente.</p>
                <p className="text-xs text-slate-400 mt-1">Tutto sotto controllo in dispensa!</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Storico Richieste
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {historyRequests.length > 0 ? historyRequests.map(request => (
              <div key={request.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-75">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    request.status === 'approved' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  )}>
                    {request.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{request.productName}</h4>
                    <p className="text-sm text-slate-500">
                      {request.userName} • {request.quantity} pz • <span className={cn(
                        "font-bold",
                        request.status === 'approved' ? "text-emerald-600" : "text-red-600"
                      )}>{request.status === 'approved' ? 'Approvata' : 'Rifiutata'}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                      Gestita da {request.handledBy} il {new Date(request.handledAt!).toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-sm italic">Nessuna richiesta nello storico.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
