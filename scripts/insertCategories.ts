import { addDoc, collection } from 'firebase/firestore';

import { db } from '../src/lib/firebase';

const insertCategories = async () => {
  const categoriesCol = collection(db, 'categories');
  const categories = [
    { name: 'Utilities', icon: '🏠' },
    { name: 'Cleaning', icon: '🧹' },
    { name: 'Maintenance', icon: '🔧' },
    { name: 'CCTV', icon: '📹' },
    { name: 'Electricity', icon: '⚡' },
    { name: 'Supplies', icon: '📦' },
    { name: 'Repairs', icon: '🔧' },
    { name: 'Water Tank', icon: '💧' },
    { name: 'Security', icon: '🔒' },
    { name: 'Other', icon: '❓' },
  ];

  try {
    for (const category of categories) {
      await addDoc(categoriesCol, category);
      console.log(`Added category: ${category.name}`);
    }
    console.log('All categories added successfully!');
  } catch (error) {
    console.error('Error adding categories:', error);
  }
};

// Call the function to insert the data.
insertCategories();
