import { useState } from 'react';
import { X, Check, Sparkles, Zap, ArrowRight, Gift } from 'lucide-react';
import { updateUserTier, getUsers } from '../lib/auditLogger';

export default function PricingModal({ 
  onClose,
  currentUserEmail = 'ai'
}: { 
  onClose: () => void;
  currentUserEmail?: string;
}) {
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpgraded, setIsUpgraded] = useState(false);

  // Check current tier
  const users = getUsers();
  const currentUser = users.find(u => u.email === currentUserEmail);
  const currentTier = currentUser?.tier || (localStorage.getItem('nexus_admin_session') ? 'admin' : 'free');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    const validCodes = ['VAKANTIE', 'PRO2026', 'JUNIE-PRO', 'NIELS-VIP', 'GOOGLE2026'];
    if (validCodes.includes(clean)) {
      if (currentUser) {
        updateUserTier(currentUser.id, 'pro');
      }
      localStorage.setItem('junie_user_tier', 'pro');
      setIsUpgraded(true);
      setPromoMessage({ text: 'Gefeliciteerd! Junie Pro is succesvol geactiveerd voor jouw account.', isError: false });
    } else {
      setPromoMessage({ text: 'Ongeldige vouchercode. Probeer bijvoorbeeld "VAKANTIE" of "PRO2026".', isError: true });
    }
  };

  const handleCheckoutStripe = () => {
    // Open payment link or simulate instant checkout
    alert('Doorverwijzen naar veilige Stripe Checkout...\n\n(Tip: Je kunt voor demo/test ook direct de vouchercode "VAKANTIE" hieronder invoeren!)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-[#ffffff] w-full max-w-4xl rounded-3xl border border-[#e1e3e1] shadow-2xl flex flex-col overflow-hidden text-[#1f1f1f]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#f8fafd] border-b border-[#e1e3e1] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1f1f1f]">Junie Abonnementen</h2>
              <p className="text-xs text-[#444746]">Kies het juiste model- en analysepakket voor jouw werkzaamheden</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#e9eef6] text-[#444746] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
          
          {/* Plan Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Junie Free */}
            <div className="rounded-3xl border border-[#e1e3e1] p-6 bg-white flex flex-col justify-between hover:border-[#c2e7ff] transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#f0f4f9] text-[#444746]">
                    Starter
                  </span>
                  <span className="text-2xl font-bold text-[#1f1f1f]">€0</span>
                </div>

                <h3 className="text-lg font-bold text-[#1f1f1f]">Junie Free</h3>
                <p className="text-xs text-[#444746] mt-1 mb-6">Ideaal voor dagelijkse snelle vragen en standaard AI-assistentie.</p>

                <ul className="space-y-3 text-xs text-[#444746]">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span>Toegang tot Groq LPU (Qwen & Llama modellen)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span>1 NotebookLM Research projectruimte</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span>Max. 3 actieve bronnen per analyse</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span>Toegang tot de algemene chatroom</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[#727775]">
                    <span className="w-4 text-center">-</span>
                    <span>Geen Perplexity live web search grounding</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-[#f0f4f9]">
                <button
                  disabled={currentTier === 'free'}
                  className="w-full py-2.5 px-4 rounded-full text-xs font-medium border border-[#e1e3e1] bg-[#f0f4f9] text-[#444746] transition-colors"
                >
                  {currentTier === 'free' ? 'Huidig Abonnement' : 'Standaard Versie'}
                </button>
              </div>
            </div>

            {/* Junie Pro */}
            <div className="rounded-3xl border-2 border-[#0b57d0] p-6 bg-[#f8fafd] flex flex-col justify-between shadow-lg relative">
              <div className="absolute -top-3 right-6">
                <span className="bg-gradient-to-r from-[#1a73e8] to-[#0b57d0] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles size={11} /> Aanbevolen
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#c2e7ff] text-[#001d35]">
                    Professioneel
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#1f1f1f]">€19</span>
                    <span className="text-xs text-[#727775]"> / maand</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#1f1f1f]">Junie Pro</h3>
                <p className="text-xs text-[#444746] mt-1 mb-6">Voor diepgaande research, psychologische dynamieken en complexe code.</p>

                <ul className="space-y-3 text-xs text-[#1f1f1f]">
                  <li className="flex items-center gap-2.5 font-medium">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span><strong>GPT-OSS 120B</strong> Supermodel (ongeëvenaarde intelligentie)</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-medium">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span><strong>Perplexity Sonar Pro</strong> met realtime web grounding</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span>Onbeperkte NotebookLM projectruimtes & bronnen</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span>Toegang tot alle thematische chatrooms (#psychologie, #code)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#0b57d0] shrink-0" />
                    <span>High-Availability Cloud Failover & nul vertraging</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-[#e1e3e1]">
                <button
                  onClick={handleCheckoutStripe}
                  className="w-full py-3 px-4 rounded-full text-xs font-semibold bg-[#0b57d0] hover:bg-[#0842a0] text-white shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={14} />
                  <span>{currentTier === 'pro' || isUpgraded ? 'Pro is Geactiveerd' : 'Word nu Pro Lid'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Promo code redemption card */}
          <div className="p-5 rounded-2xl bg-[#f0f4f9] border border-[#e1e3e1]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1f1f1f] mb-2">
              <Gift size={16} className="text-[#0b57d0]" />
              <span>Heb je een vouchercode of partnertoegang?</span>
            </div>
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Voer bijv. VAKANTIE of PRO2026 in..."
                className="flex-1 bg-white border border-[#e1e3e1] rounded-full px-4 py-2 text-xs text-[#1f1f1f] uppercase tracking-wider outline-none focus:border-[#0b57d0]"
              />
              <button
                type="submit"
                className="bg-[#1f1f1f] hover:bg-black text-white px-5 py-2 rounded-full text-xs font-medium transition-all"
              >
                Inwisselen
              </button>
            </form>
            {promoMessage && (
              <div className={`mt-2.5 text-xs font-medium ${promoMessage.isError ? 'text-[#ba1a1a]' : 'text-emerald-700'}`}>
                {promoMessage.text}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
