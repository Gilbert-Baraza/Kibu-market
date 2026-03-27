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
    gallery: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
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
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693536294-233fb141754c?auto=format&fit=crop&w=900&q=80",
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
  },
  {
    id: 7,
    title: "Table and Chair",
    price: 6500,
    category: "Furniture",
    location: "Near Campus",
    description: "A sturdy wooden table with matching chairs, perfect for dining or studying.",
    tags: ["table", "chair", "furniture"],
    seller: {
      name: "Engineer Jed",
      status: "last seen today",
    },
    messages: [
      { id: "7a", sender: "seller", text: "The table is in good condition with no cracks.", time: "07:28" },
      { id: "7b", sender: "buyer", text: "How many chairs come with the table?", time: "07:31" },
    ],
    image:
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 8,
    title: "Dell Latitude Laptop",
    price: 15000,
    category: "Electronics",
    location: "Near Library",
    description: "Reliable study laptop with a clean display, charger, and steady battery life.",
    tags: ["laptop", "electronics", "computer"],
    seller: {
      name: "Jane Doe",
      status: "last seen 1 hour ago",
    },
    messages: [
      { id: "8a", sender: "seller", text: "The laptop is in excellent condition with no scratches.", time: "08:45" },
      { id: "8b", sender: "buyer", text: "What's the storage capacity?", time: "08:47" },
      { id: "8c", sender: "seller", text: "256GB SSD and 8GB RAM.", time: "08:48" },
    ],
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 9,
    title: "Samsung Smartphone",
    price: 12000,
    category: "Electronics",
    location: "Near Hostel",
    description: "Clean smartphone with a sharp camera, fast processor, and dependable battery.",
    tags: ["smartphone", "electronics", "mobile"],
    seller: {
      name: "John Smith",
      status: "last seen 30 minutes ago",
    },
    messages: [
      { id: "9a", sender: "seller", text: "The phone is unlocked and comes with a charger.", time: "09:15" },
      { id: "9b", sender: "buyer", text: "What's the battery health?", time: "09:17" },
      { id: "9c", sender: "seller", text: "Battery health is 95%.", time: "09:18" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80",
    ],
    image:
      "https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 10,
    title: "Orthopedic Mattress",
    price: 6500,
    category: "Beds & Bedding",
    location: "Near Library",
    description: "Comfortable, durable mattress with good support and very clean fabric.",
    tags: ["mattress", "furniture", "bedding"],
    seller: {
      name: "Alice Johnson",
      status: "last seen 2 hours ago",
    },
    messages: [
      { id: "10a", sender: "seller", text: "The mattress is in like-new condition.", time: "10:30" },
      { id: "10b", sender: "buyer", text: "What's the size?", time: "10:32" },
      { id: "10c", sender: "seller", text: "It's a queen size.", time: "10:33" },
    ],
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 11,
    title: "Mini Fridge",
    price: 9800,
    category: "Electronics",
    location: "Hostel C",
    description: "Compact fridge that cools well and is perfect for snacks, milk, and drinks.",
    tags: ["fridge", "electronics", "hostel"],
    seller: {
      name: "Victor Otieno",
      status: "online now",
    },
    messages: [
      { id: "11a", sender: "seller", text: "Cooling is strong and it runs quietly.", time: "13:06" },
    ],
    image:
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 12,
    title: "Study Lamp",
    price: 1100,
    category: "Accessories",
    location: "Engineering Block",
    description: "Bright adjustable desk lamp that works well for night reading and revision.",
    tags: ["lamp", "study", "desk"],
    seller: {
      name: "Ruth Akinyi",
      status: "last seen today",
    },
    messages: [
      { id: "12a", sender: "seller", text: "The lamp has three brightness levels.", time: "18:10" },
    ],
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 13,
    title: "Accounting Textbook Set",
    price: 2300,
    category: "Books & Calculators",
    location: "School of Business",
    description: "Useful accounting and finance texts in neat condition with clean pages.",
    tags: ["books", "accounting", "school"],
    seller: {
      name: "Naomi Wanjiru",
      status: "online now",
    },
    messages: [
      { id: "13a", sender: "seller", text: "All books are original copies and lightly used.", time: "15:24" },
    ],
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 14,
    title: "Bluetooth Speaker",
    price: 2500,
    category: "Electronics",
    location: "Main Stage",
    description: "Portable speaker with strong bass, Bluetooth pairing, and long battery life.",
    tags: ["speaker", "music", "bluetooth"],
    seller: {
      name: "Peter Mwangi",
      status: "last seen 20 min ago",
    },
    messages: [
      { id: "14a", sender: "seller", text: "It charges with Type-C and lasts almost all day.", time: "16:02" },
    ],
    image:
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 15,
    title: "Men's Hoodie",
    price: 1400,
    category: "Clothes & Shoes",
    location: "Hostel D",
    description: "Warm oversized hoodie in very good condition, ideal for cold evening classes.",
    tags: ["hoodie", "fashion", "clothes"],
    seller: {
      name: "Dennis Kiptoo",
      status: "online now",
    },
    messages: [
      { id: "15a", sender: "seller", text: "It's a large size and the material is still soft.", time: "19:07" },
    ],
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 16,
    title: "Rice Cooker",
    price: 3600,
    category: "Electronics",
    location: "Near Cafeteria",
    description: "Working rice cooker with a clean inner pot and quick heating.",
    tags: ["cooker", "kitchen", "appliance"],
    seller: {
      name: "Sheila Jepchirchir",
      status: "last seen 45 min ago",
    },
    messages: [
      { id: "16a", sender: "seller", text: "Everything works, including keep-warm mode.", time: "14:42" },
    ],
    image:
      "https://images.unsplash.com/photo-1585515656703-ea5f98b0f8f2?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 17,
    title: "Backpack",
    price: 1700,
    category: "Accessories",
    location: "Library Entrance",
    description: "Spacious waterproof backpack with laptop compartment and strong zippers.",
    tags: ["bag", "backpack", "school"],
    seller: {
      name: "Linet Chebet",
      status: "online now",
    },
    messages: [
      { id: "17a", sender: "seller", text: "It fits a 15-inch laptop comfortably.", time: "11:51" },
    ],
    image:
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 18,
    title: "Office Shirt Pack",
    price: 2100,
    category: "Clothes & Shoes",
    location: "CBD Hostel",
    description: "Pack of clean office shirts suitable for presentations and attachment.",
    tags: ["shirt", "office", "clothes"],
    seller: {
      name: "Sam Kiplagat",
      status: "last seen today",
    },
    messages: [
      { id: "18a", sender: "seller", text: "Three shirts included and all are medium size.", time: "17:15" },
    ],
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80"
  }

];

export default products;
