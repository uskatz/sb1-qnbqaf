import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, MapPin, Clock, Search, Calendar, X, Map, Edit2, Check, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MapView from '@/components/MapView';
import { formatDate, getDaysSince } from '@/lib/utils';
import { searchAddress, reverseGeocode } from '@/lib/geocoding';
import { auth, db } from '@/lib/firebase';
import { Container } from '@/types';

const ContainerTracker = () => {
  const navigate = useNavigate();
  const [containers, setContainers] = useState<Container[]>([]);
  const [newContainer, setNewContainer] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const q = query(
      collection(db, 'containers'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const containerData: Container[] = [];
      snapshot.forEach((doc) => {
        containerData.push({ id: doc.id, ...doc.data() } as Container);
      });
      setContainers(containerData);
    });

    return () => unsubscribe();
  }, [navigate]);

  const addContainer = async () => {
    if (!newContainer.trim()) {
      setError('Please enter a container number');
      return;
    }

    try {
      const position = await getCurrentLocation();
      const address = await reverseGeocode(position.latitude, position.longitude);
      
      const container = {
        number: newContainer.trim(),
        location: {
          latitude: position.latitude,
          longitude: position.longitude,
          address
        },
        timestamp: new Date().toISOString(),
        userId: auth.currentUser?.uid,
      };
      
      await addDoc(collection(db, 'containers'), container);
      setNewContainer('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add container');
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => reject(new Error('Unable to get location'))
      );
    });
  };

  const updateAddress = async (containerId: string) => {
    if (!newAddress.trim()) {
      setError('Please enter an address');
      return;
    }

    try {
      const geoData = await searchAddress(newAddress);
      await updateDoc(doc(db, 'containers', containerId), {
        location: {
          latitude: parseFloat(geoData.lat),
          longitude: parseFloat(geoData.lon),
          address: geoData.display_name
        }
      });
      setEditingAddress(null);
      setNewAddress('');
    } catch (err) {
      setError('Failed to update address');
    }
  };

  const removeContainer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'containers', id));
    } catch (err) {
      setError('Failed to remove container');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      setError('Failed to log out');
    }
  };

  const filteredContainers = containers.filter(container => {
    const matchesSearch = container.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || new Date(container.timestamp).toLocaleDateString().includes(dateFilter);
    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold tracking-tight">Container Tracker</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Search"
            >
              <Search size={24} />
            </button>
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title={viewMode === 'list' ? 'Show Map' : 'Show List'}
            >
              <Map size={24} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Log out"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>

        {isSearchVisible && (
          <div className="bg-white/10 backdrop-blur-lg p-4 shadow-lg">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search containers..."
                  className="flex-1 p-2 border rounded-lg bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="p-2 text-white/80 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Calendar size={20} className="text-white/80" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 p-2 border rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white/10 backdrop-blur-lg p-4 shadow-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newContainer}
              onChange={(e) => setNewContainer(e.target.value)}
              placeholder="Container #"
              className="flex-1 p-3 text-lg border rounded-lg bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              onClick={addContainer}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <Plus size={24} />
            </button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-2 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="pt-44 pb-4 px-4">
        {viewMode === 'list' ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {filteredContainers.map(container => (
              <Card key={container.id} className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                      #{container.number}
                    </span>
                    <button
                      onClick={() => removeContainer(container.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 text-base">
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin size={20} className="text-blue-500" />
                      <div className="flex-1">
                        {editingAddress === container.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              placeholder="Enter new address..."
                              className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button
                              onClick={() => updateAddress(container.id)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAddress(null);
                                setNewAddress('');
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              {container.location.address || (
                                <>
                                  <div>Lat: {container.location.latitude.toFixed(6)}</div>
                                  <div>Long: {container.location.longitude.toFixed(6)}</div>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingAddress(container.id);
                                setNewAddress(container.location.address || '');
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                            >
                              <Edit2 size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock size={20} className="text-blue-500" />
                      <span>{formatDate(container.timestamp)}</span>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-6 rounded-full text-center font-medium shadow-md">
                      {getDaysSince(container.timestamp)} days on site
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <MapView containers={filteredContainers} />
        )}
      </div>
    </div>
  );
};

export default ContainerTracker;