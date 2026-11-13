// Store: two parts from the client's Store Map.
//   Explore Store — buy from Parallax Flow:  Catalogue · Licences & access · Purchases
//   My Store      — sell to your students:  Products · Bundles · Offers & discounts · Sales  (paid add-on)
import { Check, Lock, ShoppingBag, Sparkles, Store as StoreIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { Button, Card, Dialog, Glide, Tabs } from '../components/ui';
import { href, navigate, type StoreTab } from '../lib/router';
import { useShop } from '../lib/shop';
import { inr } from '../lib/store';
import { cn } from '../lib/utils';
import { Catalogue } from './store/Explore';
import { Licences } from './store/Licences';
import { Bundles, Offers, Sales } from './store/MyMore';
import { MyProducts } from './store/MyProducts';
import { Purchases } from './store/Purchases';

const PARTS = {
  explore: { label: 'Explore Store', sub: 'Buy from Parallax Flow', icon: ShoppingBag, tabs: [['catalogue', 'Store catalogue'], ['licences', 'Licences & access'], ['purchases', 'Purchases']] },
  mine: { label: 'My Store', sub: 'Sell to your students', icon: StoreIcon, tabs: [['products', 'Products'], ['bundles', 'Bundles'], ['offers', 'Offers & discounts'], ['sales', 'Sales']] },
} as const;

export function Store({ tab }: { tab: StoreTab }) {
  const { addon, licences } = useShop();
  const [upgrade, setUpgrade] = useState(false);
  const part = (['catalogue', 'licences', 'purchases'] as string[]).includes(tab) ? 'explore' : 'mine';
  const onUpgrade = () => setUpgrade(true);
  return (
    <Page crumbs={[{ label: 'Store' }]} screen="store">
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Store</h1><p className="text-sm text-muted">Buy Parallax Flow material for your students, or sell your own.</p></div>
      <div role="tablist" className="relative mb-5 grid grid-cols-2 gap-1 rounded-[22px] bg-subtle p-1 ring-1 ring-inset ring-border sm:inline-grid sm:min-w-[440px]">
        <Glide value={part} className="rounded-[18px] bg-panel shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]" />
        {(Object.keys(PARTS) as (keyof typeof PARTS)[]).map((k) => {
          const P = PARTS[k], on = part === k;
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => navigate({ page: 'store', tab: P.tabs[0][0] })} className={cn('relative flex items-center gap-2.5 rounded-[18px] px-3 py-2.5 text-left', on ? 'text-fg' : 'text-muted hover:text-fg')}>
              <span className={cn('relative grid size-9 place-items-center rounded-full', on ? 'bg-pop text-pop-fg' : 'bg-panel ring-1 ring-border')}><P.icon className="size-4" /></span>
              <span className="relative"><span className="block text-sm font-semibold">{P.label}{k === 'mine' && !addon && <Lock className="ml-1.5 inline size-3" />}</span><span className="block text-2xs text-muted">{P.sub}</span></span>
            </button>
          );
        })}
      </div>
      {part === 'mine' && !addon && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-fg p-4 text-bg">
          <span className="grid size-10 place-items-center rounded-full bg-pop text-pop-fg"><Lock className="size-4" /></span>
          <div className="min-w-0 flex-1"><div className="font-semibold">Preview · My Store is an add-on</div><div className="text-xs opacity-70">Build products, bundles and offers as drafts now. Unlock to publish and start selling.</div></div>
          <Button className="border-transparent bg-pop text-pop-fg hover:bg-pop/90" onClick={onUpgrade}><Sparkles /> Unlock</Button>
        </div>
      )}
      <Card>
        <Tabs value={tab} onChange={(t) => navigate({ page: 'store', tab: t })} tabs={PARTS[part].tabs.map(([v, l]) => ({ value: v, label: l, count: v === 'licences' ? licences.length : undefined }))} />
        <div key={tab} className="animate-fade-in p-4 sm:p-5">
          {tab === 'catalogue' && <Catalogue />}{tab === 'licences' && <Licences />}{tab === 'purchases' && <Purchases />}
          {tab === 'products' && <MyProducts onUpgrade={onUpgrade} />}{tab === 'bundles' && <Bundles onUpgrade={onUpgrade} />}{tab === 'offers' && <Offers />}{tab === 'sales' && <Sales />}
        </div>
      </Card>
      <p className="mt-3 text-2xs text-faint">Sample store: payments here take no money. Licence validity, cycles and add-on pricing are set in <a className="underline" href={href({ page: 'settings', tab: 'store' })}>Settings → Store rules</a>.</p>
      {upgrade && <UpgradeDialog onClose={() => setUpgrade(false)} />}
    </Page>
  );
}

function UpgradeDialog({ onClose }: { onClose: () => void }) {
  const { rules, unlock } = useShop();
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} title="Unlock My Store to sell" desc="Your work is saved as a draft. Publishing needs the My Store add-on."
      footer={<><Button onClick={onClose}>Not now</Button><Button variant="primary" onClick={() => { unlock(); toast.success('My Store unlocked', { description: 'Sample: no payment taken. Publish your drafts from Products.' }); onClose(); }}><Sparkles /> Unlock for {inr(rules.addonPrice)}/month</Button></>}>
      <ul className="space-y-2 pb-2 text-sm">
        {['Sell e-books, PDFs, question banks and test series to your students', 'Bundles, offers and coupons', rules.payout === 'parallax' ? `Payments collected for you; ${rules.commission}% commission per sale` : 'Payments go straight to your own payment account', 'Sales, refunds and student access in one place'].map((t) => (
          <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-good" />{t}</li>
        ))}
      </ul>
    </Dialog>
  );
}
