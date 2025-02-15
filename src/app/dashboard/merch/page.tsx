'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, where, deleteDoc, doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/firebase';
import { IconPlus, IconShoppingCart, IconTrash, IconX } from '@tabler/icons-react';
import Image from 'next/image';

const DEFAULT_IMAGE = '/images/nsalogo.png'; // Fallback image

interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sizes: string[];
  stock: number;
}

interface CartItem extends MerchItem {
  quantity: number;
  selectedSize: string;
}

export default function MerchPage() {
  const [merchItems, setMerchItems] = useState<MerchItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    sizes: [] as string[],
    stock: '',
  });

  const canManageMerch = userProfile?.role === 'Board Member' || userProfile?.role === 'President';

  useEffect(() => {
    const fetchUserProfileAndMerch = async () => {
      if (auth.currentUser) {
        // Fetch user profile
        const userDocSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
        if (!userDocSnap.empty) {
          setUserProfile(userDocSnap.docs[0].data() as UserProfile);
        }

        // Fetch merch items
        const merchQuery = query(collection(db, 'merch'));
        const querySnapshot = await getDocs(merchQuery);
        const fetchedItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MerchItem[];

        setMerchItems(fetchedItems);
      }
      setLoading(false);
    };

    fetchUserProfileAndMerch();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMerch) return;

    try {
      setError(null);
      const itemData = {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        imageUrl: newItem.imageUrl,
        sizes: newItem.sizes,
        stock: parseInt(newItem.stock),
      };

      const docRef = await addDoc(collection(db, 'merch'), itemData);
      const addedItem: MerchItem = {
        id: docRef.id,
        ...itemData,
      };

      setMerchItems(prev => [...prev, addedItem]);
      setIsAddingItem(false);
      setNewItem({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        sizes: [],
        stock: '',
      });
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!canManageMerch) return;

    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'merch', itemId));
      setMerchItems(prev => prev.filter(item => item.id !== itemId));
      // Remove item from cart if it exists
      setCart(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  const addToCart = (item: MerchItem, selectedSize: string) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.id === item.id && cartItem.selectedSize === selectedSize
      );

      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id && cartItem.selectedSize === selectedSize
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...prev, { ...item, quantity: 1, selectedSize }];
    });
    setShowCart(true);
  };

  const updateCartItemQuantity = (itemId: string, selectedSize: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setCart(prev => prev.filter(item => !(item.id === itemId && item.selectedSize === selectedSize)));
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === itemId && item.selectedSize === selectedSize
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    // Here you would typically integrate with a payment processor
    alert('Checkout functionality will be implemented with a payment processor');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">NSA ULM Merchandise</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCart(!showCart)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <IconShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </button>
              {canManageMerch && (
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                >
                  <IconPlus className="h-5 w-5" />
                  Add Item
                </button>
              )}
            </div>
          </div>

          {/* Shopping Cart Sidebar */}
          {showCart && (
            <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg p-6 transform transition-transform duration-300 z-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Shopping Cart</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                  <IconX className="h-6 w-6" />
                </button>
              </div>
              
              {cart.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.selectedSize}`} className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => updateCartItemQuantity(item.id, item.selectedSize, item.quantity - 1)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateCartItemQuantity(item.id, item.selectedSize, item.quantity + 1)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="font-medium">Subtotal</span>
                      <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-crimson-600 text-white py-2 rounded-md hover:bg-crimson-700"
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Merch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchItems.map((item) => (
              <div key={item.id} className="bg-white border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={item.imageUrl || DEFAULT_IMAGE}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_IMAGE;
                    }}
                  />
                  {canManageMerch && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Delete item"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className="text-lg font-bold text-crimson-600">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{item.description}</p>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Size</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-crimson-500 focus:ring-crimson-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          addToCart(item, e.target.value);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Select Size</option>
                      {item.sizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Stock: {item.stock}</p>
                  <button
                    onClick={() => {
                      const select = document.querySelector(`select[data-item-id="${item.id}"]`) as HTMLSelectElement;
                      const selectedSize = select?.value;
                      if (selectedSize) {
                        addToCart(item, selectedSize);
                      } else {
                        alert('Please select a size first');
                      }
                    }}
                    className="w-full mt-4 bg-crimson-600 text-white py-2 rounded-md hover:bg-crimson-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Modal */}
          {isAddingItem && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
                    <input
                      type="url"
                      value={newItem.imageUrl}
                      onChange={(e) => setNewItem(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Enter image URL (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sizes (comma-separated)</label>
                    <input
                      type="text"
                      value={newItem.sizes.join(', ')}
                      onChange={(e) => setNewItem(prev => ({ ...prev, sizes: e.target.value.split(',').map(s => s.trim()) }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="S, M, L, XL"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="number"
                      value={newItem.stock}
                      onChange={(e) => setNewItem(prev => ({ ...prev, stock: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                    >
                      Add Item
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingItem(false);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 