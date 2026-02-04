import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Bot, Send, Upload, ArrowLeft, Sparkles, AlertTriangle, Package, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const steps = [
  {
    id: 'product_type',
    question: '🏷️ What type of product is it?',
    placeholder: 'e.g., Phone, Laptop, Wallet, Keys, etc.',
    type: 'text'
  },
  {
    id: 'description',
    question: '📝 Can you describe the item in detail?',
    placeholder: 'Color, brand, model, size, any specific features...',
    type: 'textarea'
  },
  {
    id: 'identification_marks',
    question: '🔍 What unique identification marks does it have?',
    placeholder: 'Scratches, stickers, custom case, serial number, etc.',
    type: 'textarea'
  },
  {
    id: 'lost_location',
    question: '📍 Where did you lose it?',
    placeholder: 'Library 2nd Floor, Cafeteria, Parking Lot B, etc.',
    type: 'text'
  },
  {
    id: 'approximate_date',
    question: '📅 When did you lose it (approximately)?',
    placeholder: 'Today, Yesterday, Last Week, 3 days ago, etc.',
    type: 'text'
  },
  {
    id: 'proof_image',
    question: '📸 Do you have any proof of ownership? (Optional)',
    placeholder: 'Upload a photo',
    type: 'file'
  }
];

/**
 * AIClaimChat - AI-powered claim submission for FOUND items only
 * 
 * BUG FIX: Now properly extracts itemId from useParams() instead of expecting it as a prop
 */
const AIClaimChat = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();  // FIX: Extract itemId from URL params
  const { token } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [proofImage, setProofImage] = useState(null);
  const [noProofChecked, setNoProofChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  // NEW: Item state for validation
  const [item, setItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [itemError, setItemError] = useState(null);

  // FIX: Validate item exists and is claimable on mount
  useEffect(() => {
    const validateItem = async () => {
      // Check if itemId is present
      if (!itemId) {
        setItemError('No item ID provided. Please select an item from the lobby.');
        setItemLoading(false);
        return;
      }

      try {
        setItemLoading(true);
        // Fetch item details to validate it exists and is claimable
        const response = await axios.get(`${BACKEND_URL}/api/lobby/items`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const foundItem = response.data.find(i => i.id === itemId);
        
        if (!foundItem) {
          setItemError('Item not found. It may have been deleted, returned, or archived.');
          setItemLoading(false);
          return;
        }
        
        // SEMANTIC CHECK: Only FOUND items can be claimed
        if (foundItem.item_type !== 'found') {
          setItemError('This is a LOST item. You cannot claim it. Use "I Found This" instead.');
          setItemLoading(false);
          return;
        }
        
        // Check item status - can't claim if already claimed/returned/archived
        if (foundItem.status === 'claimed' || foundItem.status === 'returned' || foundItem.status === 'archived') {
          setItemError(`This item is already ${foundItem.status}. It cannot be claimed.`);
          setItemLoading(false);
          return;
        }
        
        setItem(foundItem);
        setItemError(null);
      } catch (error) {
        console.error('Failed to validate item:', error);
        if (error.response?.status === 401) {
          setItemError('Session expired. Please login again.');
        } else {
          setItemError('Failed to load item details. Please try again.');
        }
      } finally {
        setItemLoading(false);
      }
    };

    if (token) {
      validateItem();
    }
  }, [itemId, token]);

  const currentQuestion = steps[currentStep];

  const handleNext = () => {
    if (!answers[currentQuestion.id] && currentQuestion.type !== 'file') {
      toast.error('Please answer the question before proceeding');
      return;
    }
    
    // Special validation for proof image step
    if (currentQuestion.type === 'file' && !proofImage && !noProofChecked) {
      toast.error('Please upload a proof image or check "I don\'t have any proof image"');
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setProofImage(file);
      setAnswers({...answers, proof_image: 'uploaded'});
    }
  };

  const handleSubmit = async () => {
    // FIX: Pre-submission validation
    if (!itemId) {
      toast.error('No item ID. Please go back and select an item.');
      return;
    }
    
    if (!item) {
      toast.error('Item data not loaded. Please refresh and try again.');
      return;
    }
    
    if (item.item_type !== 'found') {
      toast.error('This is a LOST item. Claims are only for FOUND items.');
      navigate('/lobby');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      
      // FIX: Explicit item_id validation before appending
      console.log('Submitting claim for item_id:', itemId);  // Debug log
      formData.append('item_id', itemId);
      formData.append('product_type', answers.product_type);
      formData.append('description', answers.description);
      formData.append('identification_marks', answers.identification_marks);
      formData.append('lost_location', answers.lost_location);
      formData.append('approximate_date', answers.approximate_date);
      
      if (proofImage) {
        formData.append('proof_image', proofImage);
      }

      const response = await axios.post(`${BACKEND_URL}/api/claims/ai-powered`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setAiResult(response.data.ai_analysis);
      toast.success('Claim submitted successfully!');
      
      // Show AI result before navigating
      setTimeout(() => {
        navigate('/student/my-items');
      }, 5000);
    } catch (error) {
      console.error('Claim submission error:', error);
      const message = error.response?.data?.detail || 'Failed to submit claim';
      toast.error(message);
      
      // If item not found, redirect back
      if (error.response?.status === 404) {
        setTimeout(() => navigate('/lobby'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // FIX: Show loading state while validating item
  if (itemLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="spinner mb-4" />
            <p className="text-slate-600">Loading item details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FIX: Show error state if item is invalid/unavailable
  if (itemError) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Cannot Submit Claim</h3>
              <p className="text-red-600 mb-6">{itemError}</p>
              <Button onClick={() => navigate('/lobby')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lobby
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (aiResult) {
    // Get confidence band display
    const getConfidenceBandDisplay = () => {
      const band = aiResult.confidence_band || 'LOW';
      switch (band.toUpperCase()) {
        case 'HIGH':
          return { color: 'text-green-600 bg-green-100', label: 'HIGH', icon: '✅' };
        case 'MEDIUM':
          return { color: 'text-amber-600 bg-amber-100', label: 'MEDIUM', icon: '⚠️' };
        case 'LOW':
        default:
          return { color: 'text-red-600 bg-red-100', label: 'LOW', icon: '❌' };
      }
    };
    
    const confidenceDisplay = getConfidenceBandDisplay();
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Claim Submitted for Review</CardTitle>
              <p className="text-sm text-slate-600 mt-1">AI analysis is advisory only</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* DESIGN FIX: Show confidence band instead of percentage */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-2xl font-bold ${confidenceDisplay.color}`}>
                <span>{confidenceDisplay.icon}</span>
                <span>{confidenceDisplay.label} CONFIDENCE</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                ⚠️ This is an AI advisory analysis only
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">AI Advisory Notes:</p>
                <p className="text-sm text-slate-600">{aiResult.reasoning}</p>
              </div>
              
              {aiResult.inconsistencies && aiResult.inconsistencies.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold text-amber-700 mb-2">⚠️ Detected Inconsistencies:</p>
                  <ul className="list-disc list-inside text-sm text-amber-600 space-y-1">
                    {aiResult.inconsistencies.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Important disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-2">
              ⚠️ Important: AI Does NOT Make Decisions
            </p>
            <p className="text-xs text-amber-700">
              The AI analysis is for advisory purposes only. An admin will review your claim 
              and make the final decision. The confidence band helps guide, but does not 
              determine, the outcome of your claim.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong><br />
              Your claim has been submitted to the admin team. They will review the AI analysis and your details before making a decision. You'll be notified once they respond.
            </p>
          </div>

          <Button onClick={() => navigate('/student/my-items')} className="w-full">
            Go to My Items
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button 
        onClick={onClose || (() => navigate(-1))}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="font-outfit">AI Student Care Assistant</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Answer step-by-step questions to claim this item
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Chat Bubble - Question */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 flex-1">
              <p className="text-slate-800 font-medium">{currentQuestion.question}</p>
            </div>
          </div>

          {/* Answer Input */}
          <div className="space-y-3">
            {currentQuestion.type === 'text' && (
              <Input
                placeholder={currentQuestion.placeholder}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            )}

            {currentQuestion.type === 'textarea' && (
              <Textarea
                placeholder={currentQuestion.placeholder}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                rows={4}
                autoFocus
              />
            )}

            {currentQuestion.type === 'file' && (
              <div className="space-y-3">
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                    noProofChecked ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed' : 'border-slate-300 hover:border-purple-400'
                  }`}
                  onClick={() => !noProofChecked && document.getElementById('proof-upload').click()}
                >
                  {proofImage ? (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <p className="text-sm text-green-600 font-medium">{proofImage.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">Click to upload proof (optional)</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="proof-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={noProofChecked}
                />
                
                {/* No Proof Checkbox - Highlighted */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noProofChecked}
                      onChange={(e) => {
                        setNoProofChecked(e.target.checked);
                        if (e.target.checked) {
                          setProofImage(null);
                          setAnswers({...answers, proof_image: 'no_proof'});
                        } else {
                          const newAnswers = {...answers};
                          delete newAnswers.proof_image;
                          setAnswers(newAnswers);
                        }
                      }}
                      className="w-5 h-5 text-yellow-600 border-yellow-400 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm font-semibold text-yellow-900">
                      ⚠️ I don't have any proof image
                    </span>
                  </label>
                  <p className="text-xs text-yellow-700 mt-2 ml-8">
                    Check this if you don't have any photo as proof
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {loading ? (
                'Processing...'
              ) : currentStep === steps.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit for AI Analysis
                </>
              ) : (
                <>
                  Next
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIClaimChat;
