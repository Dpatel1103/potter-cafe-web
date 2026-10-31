import { Courier } from "@/types";

export const COURIERS: Courier[] = [
  {
    id: "courier-hedwig",
    name: "Hedwig Express",
    title: "Snowy Owl • Royal Express",
    speed: "Priority Aerial (10-15 mins)",
    avatarIcon: "owl",
    description: "Immaculate white feathers, razor-sharp navigation through rain or fog. The most faithful and dependable delivery owl in all of Great Britain.",
  },
  {
    id: "courier-errol",
    name: "Errol",
    title: "Weasley Family Great Grey • Veteran Flyer",
    speed: "Standard Drift (25-35 mins)",
    avatarIcon: "feather",
    description: "An elderly veteran of countless missions. May occasionally collide with your dormitory windowpane, but never drops a parcel.",
  },
  {
    id: "courier-neville",
    name: "Neville Longbottom",
    title: "Herbology Apprentice • Nimbus 2000 Carrier",
    speed: "Ground & Broom Express (15-20 mins)",
    avatarIcon: "broom",
    description: "Dispatched on a classic Nimbus 2000 broomstick. Brings extra protective care and treats every hot brew with botanical reverence.",
  },
  {
    id: "courier-floo",
    name: "Floo Powder Express",
    title: "Ministry Fireplace Network • Instant Hearth Hop",
    speed: "Instantaneous Teleport (5-10 mins)",
    avatarIcon: "flame",
    description: "Transports your order directly into your registered common room fireplace via emerald Floo flames. Heat retention guaranteed.",
  },
];
