import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RepairList from './RepairList';
import AddClient from './AddClient';
import ClientList from './ClientList';
import ClientDetails from './ClientDetails';
import EditClient from './EditClient';
import AddDevice from './AddDevice';
import AddRepair from './AddRepair';
import RepairDetails from './RepairDetails';
import EditDevice from './EditDevice';
import EditRepair from './EditRepair';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute'; // Import the ProtectedRoute component
import Settings from './Settings';
import Docs from './Docs';
import Search from './Search';
import Signup from './Signup';
import DemoWatermark from './DemoWatermark';
import { LanguageProvider } from './LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          {/* Add the watermark */}
          <DemoWatermark />
          <div className="content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes */}
              <Route path="/clientlist" element={<ProtectedRoute element={<ClientList />} />} />
              <Route path="/clientdetails" element={<ProtectedRoute element={<ClientDetails />} />} />
              <Route path="/addclient" element={<ProtectedRoute element={<AddClient />} />} />
              <Route path="/editclient" element={<ProtectedRoute element={<EditClient />} />} />
              <Route path="/adddevice" element={<ProtectedRoute element={<AddDevice />} />} />
              <Route path="/editdevice" element={<ProtectedRoute element={<EditDevice />} />} />
              <Route path="/addrepair" element={<ProtectedRoute element={<AddRepair />} />} />
              <Route path="/editrepair" element={<ProtectedRoute element={<EditRepair />} />} />
              <Route path="/repairdetails" element={<ProtectedRoute element={<RepairDetails />} />} />
              <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
              <Route path="/search" element={<ProtectedRoute element={<Search />} />} />
              <Route path="/docs" element={<ProtectedRoute element={<Docs />} />} />
              <Route path="/repairlist" element={<ProtectedRoute element={<RepairList />} />} />

              {/* Redirect all other routes to /repairlist as a protected route */}
              <Route
                path="*" element={<ProtectedRoute element={<Navigate to="/repairlist" replace />} />}
              />
            </Routes>
          </div>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;