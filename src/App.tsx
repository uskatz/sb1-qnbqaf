import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { useState, useEffect } from 'react';
import ContainerTracker from './ContainerTracker';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Admin from './pages/Admin';

function App() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        setIsAdmin(doc.data()?.role === 'admin');
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/welcome" element={user ? <Welcome /> : <Navigate to="/login" />} />
      <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
      <Route 
        path="/" 
        element={user ? <ContainerTracker /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}

export default App;