export type CurrencyType = 'D' | 'U'; // D = IQD, U = USD

export interface ExpenseTx {
  id?: string;
  c: number; // category index (0-31)
  d: string; // YYYY-MM-DD
  a: number; // amount
  cu: CurrencyType;
  r: number; // exchange rate at entry time
  w: number; // person index
  s?: number; // 1 = shared expense, 0 = individual
  ph?: string; // photo data / id
  n?: string; // note / description
}

export interface SavingsDeposit {
  g: number; // goal index
  a: number; // amount
  d: string; // YYYY-MM-DD
}

export interface MonthDoc {
  inc: number[]; // salary per family member
  oi: number; // other income
  bud: number[]; // budget per category index
  tx: ExpenseTx[];
  sv: SavingsDeposit[];
  closed?: number; // 1 if month is closed
  rec?: number; // 1 if recurring applied
}

export interface SavingsGoal {
  n: string; // name
  t: number; // target amount
  s: number; // saved so far
  dt?: string; // target month YYYY-MM
}

export interface RecurringExpense {
  c: number;
  a: number;
  w: number;
  cu: CurrencyType;
  n?: string;
  dd?: number; // due day (1-31)
}

export interface DebtItem {
  n: string; // person name
  k: 'l' | 'b'; // 'l' = lent (قەرزم داوە), 'b' = borrowed (قەرزم وەرگرتووە)
  a: number; // total amount
  cu: CurrencyType;
  p: number; // paid so far
  due?: string; // due date YYYY-MM-DD
  rd?: number; // reminder days before
  m?: number; // monthly instalment
  d?: string; // creation date
}

export interface ShopItem {
  n: string;
  q?: string;
  pr: number; // estimated price
  ck: number; // 1 if checked, 0 otherwise
}

export interface KumalaItem {
  n: string; // name
  a: number; // monthly amount
  m: number; // number of members
  s: string; // start month YYYY-MM
  t: number; // my turn (1 to m)
  dd: number; // pay day of the month
  pd: number[]; // 1 for paid months, 0 for unpaid
  rc: number; // 1 if payout received
}

export interface GoldItem {
  d: string; // date YYYY-MM-DD
  g: number; // grams
  k: number; // karat: 24, 22, 21, 18
  p: number; // purchase price paid per gram (IQD)
  n?: string; // note
}

export interface EventCheckItem {
  n: string;
  pr: number;
  ck: number;
}

export interface EventItem {
  n: string;
  d?: string; // event date YYYY-MM-DD
  b: number; // budget
  sv: number; // saved amount
  it: EventCheckItem[];
}

export interface ImportantDateItem {
  n: string; // title
  d: string; // date YYYY-MM-DD
  rd?: number; // reminder days
  y?: number; // 1 if repeats yearly
}

export interface AssetItem {
  n: string;
  k: 'i' | 'u' | 'g' | 'o'; // 'i'=IQD cash, 'u'=USD cash, 'g'=gold grams, 'o'=other
  v: number;
}

export interface SinkingFundItem {
  n: string;
  a: number; // total yearly amount
}

export interface WealthData {
  as: AssetItem[];
  fu: SinkingFundItem[];
}

export interface FamilyMember {
  n: string;
  e: string; // icon name: 'user' | 'user-round' | 'smile' | 'heart' | 'star' | 'crown' | 'baby' | etc.
  x?: number; // 1 if soft deleted
}

export interface WorkspaceAccount {
  id: string; // '' for main, random id for others
  n: string;
  i: string; // icon
}

export interface SpendingLimitConfig {
  p?: number; // % threshold to warn, e.g. 80
  m?: '' | 'p' | 'a'; // mode: '' = none, 'p' = % of income, 'a' = fixed amount
  v?: number; // value
}

export interface NamesConfig {
  mem: FamilyMember[];
  fx: number; // USD rate in IQD (default 1500)
  gp: number; // Gold price per 21k gram (IQD)
  fxd?: string; // last date USD rate updated
  gpd?: string; // last date gold price updated
  lim?: SpendingLimitConfig;
  accs?: WorkspaceAccount[];
  mn?: string; // main workspace name
  mi?: string; // main workspace icon
  p1?: string;
  p2?: string;
  rd?: number; // default reminder days
}

export interface UIAppearanceConfig {
  fs: number; // font size (13-19)
  r: number; // corner roundness px (0-28)
  d: number; // card spacing / padding
  hg: number; // 1 if gradient header, 0 otherwise
  pal: string; // '' | 'warm' | 'mint' | 'sky' | 'black'
  ff: number; // font family index (0 = Noto Sans Arabic, 1 = Noto Naskh Arabic)
  hc: string; // header custom color
  bgl: string; // light bg
  bgd: string; // dark bg
  cdl: string; // light card
  cdd: string; // dark card
}

export interface SettingsConfig {
  l: number; // language index: 0=ckb, 1=ar, 2=en, 3=kmr, 4=fa, 5=tr
  th: 'auto' | 'light' | 'dark';
  ac: string; // accent color hex
  ui?: Partial<UIAppearanceConfig>;
  pin?: string; // hashed PIN
  acc?: string; // active workspace id
  hh?: string; // household sharing code
}
