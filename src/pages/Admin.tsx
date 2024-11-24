import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, onSnapshot, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Package, Shield, LogOut } from 'lucide-react';
import MapView from '@/components/MapView';
import { Container, User } from '@/types';

export default function Admin() {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<User[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'users' | 'containers'>('users');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    const checkAdmin = async () => {
      const userDoc = await doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDoc, (doc) => {
        if (!doc.exists() || doc.data()?.role !== 'admin') {
          navigate('/');
        }
      });

      return () => unsubscribe();
    };

    checkAdmin();

    // Subscribe to users collection
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ 
          id: doc.id, 
          name: doc.data().name,
          email: doc.data().email,
          role: doc.data().role,
          createdAt: doc.data().createdAt
        });
      });
      setUsers(usersData);
    });

    // Subscribe to containers collection
    const containersQuery = query(collection(db, 'containers'));
    const unsubscribeContainers = onSnapshot(containersQuery, (snapshot) => {
      const containersData: Container[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        containersData.push({
          id: doc.id,
          number: data.number,
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            address: data.location.address
          },
          timestamp: data.timestamp,
          userId: data.userId
        });
      });
      setContainers(containersData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeContainers();
    };
  }, [user, navigate]);

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('users')}
              className={`p-2 rounded-full transition-colors ${
                viewMode === 'users' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Users"
            >
              <Users size={24} />
            </button>
            <button
              onClick={() => setViewMode('containers')}
              className={`p-2 rounded-full transition-colors ${
                viewMode === 'containers' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Containers"
            >
              <Package size={24} />
            </button>
            <button
              onClick={() => auth.signOut()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Log out"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-4 px-4 max-w-7xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {viewMode === 'users' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((userData) => (
              <Card key={userData.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{userData.name}</h3>
                      <p className="text-sm text-gray-600">{userData.email}</p>
                    </div>
                    <button
                      onClick={() => toggleUserRole(userData.id, userData.role)}
                      className={`p-2 rounded-full ${
                        userData.role === 'admin'
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={`${userData.role === 'admin' ? 'Remove admin' : 'Make admin'}`}
                    >
                      <Shield size={20} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userData.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {userData.role}
                    </span>
                    <span className="text-sm text-gray-500">
                      Joined {new Date(userData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Containers</h2>
              <MapView containers={containers} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {containers.map((container) => {
                const owner = users.find(u => u.id === container.userId);
                return (
                  <Card key={container.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">#{container.number}</h3>
                          <p className="text-sm text-gray-600">
                            Owner: {owner?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600">
                          Location: {container.location.address || 
                            `${container.location.latitude.toFixed(6)}, ${container.location.longitude.toFixed(6)}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          Added: {new Date(container.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}