import { Link } from 'react-router-dom';
import { GraduationCap, Shield, Building2, Search, Package, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

/**
 * Landing Page - BEFORE LOGIN
 * 
 * DESIGN FIX: No public browsing before login.
 * Only shows:
 * - Student Login
 * - Admin Login
 * 
 * Common Lobby is accessible ONLY after authentication.
 */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="font-outfit text-sm font-bold text-slate-900 leading-tight">
                  ST. PETERS COLLEGE OF ENGINEERING
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  AND TECHNOLOGY (AN AUTONOMOUS)
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
            Campus Lost & Found
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto animate-fade-in">
            Helping our college community reconnect with their belongings. 
            Report lost items or help return found items.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <Search className="w-5 h-5" />
              <span className="text-sm">Report Lost Items</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <Package className="w-5 h-5" />
              <span className="text-sm">Report Found Items</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <Users className="w-5 h-5" />
              <span className="text-sm">Community Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Login Options */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-outfit font-bold text-center text-slate-900 mb-2">
          Login to Continue
        </h2>
        <p className="text-center text-slate-500 mb-8">
          Please login to access the Lost & Found system
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Login Card - PRIMARY */}
          <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="font-outfit text-xl">Student Login</CardTitle>
              <CardDescription>
                Access the system using your Roll Number and Date of Birth
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Report lost or found items
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Browse the Common Lobby
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Claim found items
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Help return lost items
                </li>
              </ul>
              <Link to="/student/login" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Student Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Login Card - SECONDARY */}
          <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="font-outfit text-xl">Admin Login</CardTitle>
              <CardDescription>
                Access the administrative dashboard for system management
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                  Manage student database
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                  Review and approve claims
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                  Monitor system activity
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                  Upload student records
                </li>
              </ul>
              <Link to="/admin/login" className="block">
                <Button variant="outline" className="w-full text-lg py-6 border-2">
                  <Shield className="w-5 h-5 mr-2" />
                  Admin Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Note about registration */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            New student? Contact your department admin to get registered in the system.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-outfit font-bold mb-1">
            ST. PETERS COLLEGE OF ENGINEERING AND TECHNOLOGY
          </p>
          <p className="text-sm text-slate-400">(AN AUTONOMOUS)</p>
          <p className="text-xs text-slate-500 mt-4">
            Lost & Found Management System © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
