export type VehicleType = "car" | "moto";

export type Suggestion = { title: string; subtitle: string; eta: string };

export type Ride = {
  id: string;
  name: string;
  tag: string;
  eta: string;
  priceKz: number;
  capacity: string;
  type: VehicleType;
};

export type Driver = {
  id: string;
  name: string;
  photo: string;
  rating: number;
  trips: number;
  vehicle: string;
  plate: string;
  type: VehicleType;
};

export const fmtKz = (n: number) =>
  `${new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(n)} Kz`;

export const SUGGESTIONS: Suggestion[] = [
  { title: "Aeroporto Internacional 4 de Fevereiro", subtitle: "Luanda — Sul", eta: "28 min" },
  { title: "Estádio 11 de Novembro", subtitle: "Camama, Luanda", eta: "22 min" },
  { title: "Marginal de Luanda", subtitle: "Av. 4 de Fevereiro", eta: "12 min" },
  { title: "Belas Shopping", subtitle: "Talatona", eta: "18 min" },
  { title: "Mercado do Kikolo", subtitle: "Cacuaco", eta: "35 min" },
];

export const RIDES: Ride[] = [
  { id: "x",        name: "RydeX",   tag: "Económico",            eta: "3 min", priceKz: 1800, capacity: "4", type: "car" },
  { id: "comfort",  name: "Comfort", tag: "Mais espaço",          eta: "5 min", priceKz: 2700, capacity: "4", type: "car" },
  { id: "black",    name: "Black",   tag: "Premium",              eta: "7 min", priceKz: 4200, capacity: "4", type: "car" },
  { id: "xl",       name: "XL",      tag: "Até 6 pessoas",        eta: "9 min", priceKz: 5100, capacity: "6", type: "car" },
  { id: "moto",     name: "Moto",       tag: "Mais rápido",         eta: "2 min", priceKz:  900, capacity: "1", type: "moto" },
  { id: "moto-125", name: "Moto 125cc", tag: "Clássica",            eta: "3 min", priceKz: 1100, capacity: "1", type: "moto" },
  { id: "moto-pro", name: "Moto Pro",   tag: "Motociclistas 4,9+",  eta: "4 min", priceKz: 1350, capacity: "1", type: "moto" },
];

export const DRIVERS: Record<VehicleType, Driver> = {
  car: {
    id: "drv-marco",
    name: "Marco Almeida",
    photo: "https://i.pravatar.cc/200?img=12",
    rating: 4.93,
    trips: 2841,
    vehicle: "Toyota Corolla preto",
    plate: "LD-42-18-AB",
    type: "car",
  },
  moto: {
    id: "drv-diego",
    name: "Diego Sebastião",
    photo: "https://i.pravatar.cc/200?img=33",
    rating: 4.97,
    trips: 1572,
    vehicle: "Honda CG 160 vermelha",
    plate: "LD-09-77-MT",
    type: "moto",
  },
};

export type Trip = {
  id: string;
  date: string;
  from: string;
  to: string;
  priceKz: number;
  driver: string;
  rating: number;
  type: VehicleType;
};

export const TRIP_HISTORY: Trip[] = [
  { id: "t1", date: "Hoje, 14:32", from: "Casa",        to: "Belas Shopping",       priceKz: 2400, driver: "Marco Almeida",   rating: 5, type: "car" },
  { id: "t2", date: "Ontem, 09:10", from: "Casa",       to: "Marginal de Luanda",   priceKz: 1900, driver: "Diego Sebastião", rating: 5, type: "moto" },
  { id: "t3", date: "18 Jun, 22:45", from: "Restaurante", to: "Casa",                priceKz: 3100, driver: "Aida Pereira",    rating: 4, type: "car" },
  { id: "t4", date: "15 Jun, 07:55", from: "Casa",      to: "Aeroporto 4 de Fev.",  priceKz: 5800, driver: "João Mateus",     rating: 5, type: "car" },
];

export type Earning = { id: string; date: string; trips: number; amountKz: number };

export const EARNINGS: Earning[] = [
  { id: "e1", date: "Hoje",        trips:  9, amountKz: 21400 },
  { id: "e2", date: "Ontem",       trips: 14, amountKz: 32800 },
  { id: "e3", date: "Sex, 19 Jun", trips: 11, amountKz: 26500 },
  { id: "e4", date: "Qui, 18 Jun", trips: 12, amountKz: 28900 },
  { id: "e5", date: "Qua, 17 Jun", trips:  8, amountKz: 18750 },
];

export type RideRequest = {
  id: string;
  rider: string;
  ratingRider: number;
  from: string;
  to: string;
  distanceKm: number;
  etaMin: number;
  priceKz: number;
  type: VehicleType;
};

export const PENDING_REQUESTS: RideRequest[] = [
  { id: "r1", rider: "Helena C.", ratingRider: 4.9, from: "Talatona",   to: "Marginal",                distanceKm: 7.2,  etaMin: 4, priceKz: 2400, type: "car" },
  { id: "r2", rider: "Paulo M.",  ratingRider: 4.7, from: "Maianga",    to: "Aeroporto 4 de Fev.",     distanceKm: 12.4, etaMin: 6, priceKz: 4100, type: "car" },
  { id: "r3", rider: "Beatriz N.",ratingRider: 5.0, from: "Ingombota",  to: "Belas Shopping",          distanceKm: 9.1,  etaMin: 5, priceKz: 2900, type: "car" },
];
