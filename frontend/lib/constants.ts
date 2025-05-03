export const DEFAULT_URL = 'http://192.168.255.108:5001';
// export const DEFAULT_URL2 = 'http://10.0.2.2:5001';
export const DEFAULT_URL_3 = 'http://192.168.255.108:3000';


export const menuItems = [
  {
    heading: "Account",
    items: [
      { icon: "personal-info", title: "Personal information", path: "/profile" },
      { icon: "credit-card", title: "Card and accounts", path: "/card-accounts" },
      { icon: "location-marker", title: "Saved addresses", path: "/saved-addresses" },
    ],
  },
  // {
  //   heading: "Benefits",
  //   items: [
  //     { icon: "rating", title: "Rewards", path: "/rewards", subtitle: "You have 177 points" },
  //   ],
  // },
  {
    heading: "Support",
    items: [
      { icon: "rating", title: "Rate the app", path: "/rate-app" },
      { icon: "help-center", title: "Help Center", path: "/help-center" }
    ],
  },
  {
    heading: "History",
    items: [
      { icon: "earth", title: "Trips", path: "/language", },
    ],
  },
];
