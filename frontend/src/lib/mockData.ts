export const places = [
  {
    id: 1,
    name: "Phong Nha Cave",
    category: "Cave",
    address: "Phong Nha, Bo Trach",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    description:
      "A river cave journey through limestone chambers, emerald water, and quiet village edges.",
  },
  {
    id: 2,
    name: "Nhat Le Beach",
    category: "Beach",
    address: "Dong Hoi City",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    description:
      "Long sandy coastline near Dong Hoi with sunrise walks, seafood stalls, and gentle evening air.",
  },
  {
    id: 3,
    name: "Mooc Spring",
    category: "Nature",
    address: "Phong Nha - Ke Bang",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    description:
      "Clear blue spring water wrapped by forest paths, bamboo bridges, and slow outdoor lunches.",
  },
  {
    id: 4,
    name: "Quang Phu Sand Dunes",
    category: "Landscape",
    address: "Quang Phu, Dong Hoi",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=80",
    description:
      "Rolling pale dunes north of Dong Hoi, best visited in late afternoon light.",
  },
];

export const posts = [
  {
    id: 1,
    title: "Two quiet days around Phong Nha",
    author: "Mai Tran",
    place: "Phong Nha Cave",
    time: "18 min ago",
    likes: 128,
    comments: 24,
    saves: 41,
    image: places[0].image,
    content:
      "Started with a boat into the cave, then found a small family restaurant by the river. The whole trip felt slower in the best possible way.",
  },
  {
    id: 2,
    title: "Sunrise swim at Nhat Le",
    author: "An Nguyen",
    place: "Nhat Le Beach",
    time: "2 hours ago",
    likes: 86,
    comments: 13,
    saves: 22,
    image: places[1].image,
    content:
      "The beach was almost empty before 6am. Coffee after the swim was mandatory and absolutely correct.",
  },
  {
    id: 3,
    title: "Mooc Spring is made for slow afternoons",
    author: "Linh Pham",
    place: "Mooc Spring",
    time: "Yesterday",
    likes: 204,
    comments: 37,
    saves: 68,
    image: places[2].image,
    content:
      "Bring sandals, arrive early, and leave room for lunch. The water color is unreal.",
  },
];

export const stats = [
  { label: "Places", value: "128" },
  { label: "Reviews", value: "2.4k" },
  { label: "Travelers", value: "18k" },
  { label: "Saved trips", value: "9.7k" },
];
