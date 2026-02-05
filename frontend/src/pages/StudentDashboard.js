import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, claimsAPI } from '../services/api';
import { ItemGrid } from '../components/ItemCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Search, Package, Plus, AlertCircle, CheckCircle2, Eye, MapPin, Clock, User, Sparkles, Link2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [foundSimilarItems, setFoundSimilarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Claim detail dialog state
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showClaimDetail, setShowClaimDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, claimsRes, foundSimilarRes] = await Promise.all([
        itemsAPI.getMyItems(),
        claimsAPI.getClaims(),
        itemsAPI.getFoundSimilarItems().catch(() => ({ data: { found_similar: [] } }))
      ]);
      setRecentItems(itemsRes.data.slice(0, 4));
      setMyClaims(claimsRes.data.slice(0, 3));
      setFoundSimilarItems(foundSimilarRes.data?.found_similar || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClaimStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'status-found';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'under_review': return 'status-claimed';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Open claim detail dialog
  const openClaimDetail = (claim) => {
    setSelectedClaim(claim);
    setShowClaimDetail(true);
  };

  return (
    <div className="space-y-8 animate-fade-in" data-testid="student-dashboard">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h1 className="font-outfit text-2xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-slate-500">
          {user?.department} • {user?.year} Year • {user?.roll_number}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/student/report-lost">
          <Card className="card-hover cursor-pointer border-orange-200 bg-orange-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Report Lost Item</h3>
                  <p className="text-sm text-slate-500">Lost something? Report it here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/student/report-found">
          <Card className="card-hover cursor-pointer border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Report Found Item</h3>
                  <p className="text-sm text-slate-500">Found something? Help return it</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-outfit text-xl">My Recent Reports</CardTitle>
          <Link to="/student/my-items">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">You have not reported any items yet</p>
              <Link to="/student/report-lost">
                <Button className="mt-4" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Report an Item
                </Button>
              </Link>
            </div>
          ) : (
            <ItemGrid items={recentItems} />
          )}
        </CardContent>
      </Card>

      {/* My Claims */}
      <Card>
        <CardHeader>
          <CardTitle className="font-outfit text-xl">My Claims Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : myClaims.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No claims yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myClaims.map((claim) => (
                <div 
                  key={claim.id} 
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                  data-testid={`claim-${claim.id}`}
                >
                  {claim.item?.image_url && (
                    <img 
                      src={`${BACKEND_URL}${claim.item.image_url}`}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&w=100';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {claim.item?.item_keyword || claim.item?.description || 'Item'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Claimed on {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={getClaimStatusColor(claim.status)}>
                      {claim.status.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openClaimDetail(claim)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Found Similar Items Section */}
      {foundSimilarItems.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="font-outfit text-xl flex items-center gap-2 text-green-800">
              <Sparkles className="w-5 h-5 text-green-600" />
              Found Similar Items
              <Badge className="bg-green-100 text-green-700 ml-2">{foundSimilarItems.length} new</Badge>
            </CardTitle>
            <p className="text-sm text-green-700 mt-1">
              Someone may have found items matching what you lost!
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {foundSimilarItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-4 p-4 bg-white rounded-lg border border-green-200"
                >
                  {item.image_url ? (
                    <img 
                      src={`${BACKEND_URL}${item.image_url}`}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-green-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="status-found text-xs">FOUND</Badge>
                      <span className="font-semibold text-slate-900">{item.item_keyword}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.finder && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Found by: {item.finder.full_name}
                        </span>
                      )}
                    </div>
                    {item.related_lost_item && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                        <Link2 className="w-3 h-3" />
                        Linked to your: {item.related_lost_item.item_keyword}
                      </div>
                    )}
                  </div>
                  <Link to={`/student/found-items`}>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-shrink-0">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim Detail Dialog */}
      <Dialog open={showClaimDetail} onOpenChange={setShowClaimDetail}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Claim Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-4">
              {/* Item Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-700 mb-2">Claimed Item</h4>
                <div className="flex items-start gap-3">
                  {selectedClaim.item?.image_url && (
                    <img 
                      src={`${BACKEND_URL}${selectedClaim.item.image_url}`}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{selectedClaim.item?.item_keyword || 'Item'}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{selectedClaim.item?.description}</p>
                    {selectedClaim.item?.location && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedClaim.item.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Claim Status */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-700 mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  <Badge className={`${getClaimStatusColor(selectedClaim.status)} text-sm`}>
                    {selectedClaim.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Submitted on {new Date(selectedClaim.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Your Submitted Answers */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Your Submitted Answers</h4>
                {selectedClaim.qa_data && selectedClaim.qa_data.length > 0 ? (
                  <ol className="space-y-3 list-decimal list-inside">
                    {selectedClaim.qa_data
                      .filter(qa => qa.answer && qa.answer.trim())
                      .map((qa, index) => (
                        <li key={index} className="text-sm text-slate-700">
                          <span className="text-slate-900 font-medium">{qa.answer}</span>
                        </li>
                      ))}
                  </ol>
                ) : selectedClaim.claim_data ? (
                  <div className="space-y-2 text-sm">
                    {selectedClaim.claim_data.description && (
                      <p><span className="font-medium">Description:</span> {selectedClaim.claim_data.description}</p>
                    )}
                    {selectedClaim.claim_data.identification_marks && (
                      <p><span className="font-medium">Identification:</span> {selectedClaim.claim_data.identification_marks}</p>
                    )}
                    {selectedClaim.claim_data.lost_location && (
                      <p><span className="font-medium">Lost Location:</span> {selectedClaim.claim_data.lost_location}</p>
                    )}
                    {selectedClaim.claim_data.approximate_date && (
                      <p><span className="font-medium">Approx. Date:</span> {selectedClaim.claim_data.approximate_date}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No details available</p>
                )}
              </div>

              {/* Admin Response */}
              <div className={`rounded-lg p-4 ${
                selectedClaim.status === 'approved' ? 'bg-green-50' :
                selectedClaim.status === 'rejected' ? 'bg-red-50' :
                'bg-yellow-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  selectedClaim.status === 'approved' ? 'text-green-800' :
                  selectedClaim.status === 'rejected' ? 'text-red-800' :
                  'text-yellow-800'
                }`}>
                  Admin Response
                </h4>
                {selectedClaim.admin_decision?.reason ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700">{selectedClaim.admin_decision.reason}</p>
                    {selectedClaim.admin_decision.decided_at && (
                      <p className="text-xs text-slate-500">
                        Decision made on {new Date(selectedClaim.admin_decision.decided_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-600">
                    Your claim is under review. We will notify you once a decision is made.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
