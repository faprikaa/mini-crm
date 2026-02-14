export type PromoIdea = {
  id: string;
  theme: string;
  segment: string;
  whyNow: string;
  message: string;
  bestTime?: string;
};

export const promoIdeas: PromoIdea[] = [
  {
    id: "caramel-week",
    theme: "Caramel Week",
    segment: "Pelanggan dengan minat sweet drinks atau caramel (42 pelanggan)",
    whyNow: "Minat minuman manis jadi kelompok terbesar minggu ini.",
    message:
      "Hi! New Caramel Cold Brew lagi hadir minggu ini - diskon 10% sampai Minggu. Mau coba besok pagi?",
    bestTime: "Morning rush (07:00 - 10:30)",
  },
  {
    id: "pastry-bundle",
    theme: "Pastry + Coffee Bundle",
    segment: "Pastry lovers + pembeli pagi (18 pelanggan)",
    whyNow: "Tag pastry naik tajam di hari kerja.",
    message:
      "Coba latte + croissant bundle, hemat 10k. Berlaku jam 7-11 pagi. Mau saya siapin?",
    bestTime: "Weekday breakfast (07:00 - 11:00)",
  },
  {
    id: "oat-milk-weekend",
    theme: "Weekend Oat Milk Special",
    segment: "Pelanggan oat milk dan healthy choice (26 pelanggan)",
    whyNow: "Minat oat milk stabil naik selama 3 minggu terakhir.",
    message:
      "Weekend ini ada Oat Latte special 15% off, cuma Sabtu-Minggu. Mau aku kirim menu rekomendasinya?",
    bestTime: "Weekend afternoon (14:00 - 18:00)",
  },
];
