const products = [
  {
    id: 1,
    title: "HP Laptop",
    price: 25000,
    category: "Electronics",
    location: "Kibabii Hostel A",
    description: "Solid battery life and ideal for coursework, coding, and project work.",
    tags: ["laptop", "computer", "study"],
    seller: {
      name: "Brian Wekesa",
      status: "online now",
    },
    messages: [
      { id: "1a", sender: "seller", text: "Hi, the laptop is still available.", time: "09:12" },
      { id: "1b", sender: "buyer", text: "Nice. Does it come with the charger?", time: "09:14" },
      { id: "1c", sender: "seller", text: "Yes, charger included and battery is in good shape.", time: "09:15" },
    ],
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 2,
    title: "Scientific Calculator",
    price: 1200,
    category: "Books & Calculators",
    location: "Kibabii Main Gate",
    description: "Exam-ready calculator in clean condition with cover included.",
    tags: ["calculator", "math", "engineering"],
    seller: {
      name: "Mercy Naliaka",
      status: "last seen 5 min ago",
    },
    messages: [
      { id: "2a", sender: "seller", text: "Hello, I can meet near the main gate after 4pm.", time: "08:40" },
      { id: "2b", sender: "buyer", text: "Great, is it allowed for engineering exams?", time: "08:44" },
    ],
    image:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 3,
    title: "Men Sneakers",
    price: 1800,
    category: "Clothes & Shoes",
    location: "CBD Hostel",
    description: "Comfortable everyday pair, lightly worn and still in great shape.",
    tags: ["shoes", "fashion", "sneakers"],
    seller: {
      name: "Allan Mutiso",
      status: "online now",
    },
    messages: [
      { id: "3a", sender: "seller", text: "Size 42 and still very clean.", time: "10:03" },
    ],
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 4,
    title: "Bed and Mattress",
    price: 6500,
    category: "Beds & Bedding",
    location: "Near Campus",
    description: "Affordable room setup combo, ideal for a quick move-in.",
    tags: ["bed", "room", "hostel"],
    seller: {
      name: "Faith Chelimo",
      status: "last seen today",
    },
    messages: [
      { id: "4a", sender: "seller", text: "Bed and mattress go together at the listed price.", time: "07:28" },
      { id: "4b", sender: "buyer", text: "Can you help with transport within campus?", time: "07:31" },
    ],
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 5,
    title: 'Desk Chair',
    price: 3200,
    category: "Furniture",
    location: "Lecture Hall Block",
    description: "Supportive study chair with adjustable height and soft cushion.",
    tags: ["chair", "desk", "furniture"],
    seller: {
      name: "Diana Jepkoech",
      status: "online now",
    },
    messages: [
      { id: "5a", sender: "seller", text: "The chair wheels and height lever are working well.", time: "11:02" },
    ],
    image:
      "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 6,
    title: "Android Phone",
    price: 9500,
    category: "Electronics",
    location: "Admin Block",
    description: "Clean display, reliable battery, and enough storage for daily use.",
    tags: ["phone", "android", "mobile"],
    seller: {
      name: "Kevin Barasa",
      status: "last seen 12 min ago",
    },
    messages: [
      { id: "6a", sender: "seller", text: "Phone has no cracks and fingerprint works fine.", time: "12:11" },
      { id: "6b", sender: "buyer", text: "What's the storage size?", time: "12:13" },
      { id: "6c", sender: "seller", text: "128GB, plus it supports a memory card.", time: "12:14" },
    ],
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
  }
];

export default products;
