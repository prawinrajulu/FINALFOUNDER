import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Bot, Send, ArrowLeft, Sparkles, AlertTriangle, MapPin, ImageOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Safe string formatter - FIX: Prevent "Objects are not valid as React child" error
 */
const safeString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return format(value, 'MMM d, yyyy');
  if (typeof value === 'object') {
    if (value.$date) return format(new Date(value.$date), 'MMM d, yyyy');
    if (value.msg) return String(value.msg);
    if (value.detail) return String(value.detail);
    return '';
  }
  return String(value);
};

/**
 * Calculate similarity between two strings
 */
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let matches = 0;
  words1.forEach(word => {
    if (words2.has(word)) matches++;
    // Partial match
    words2.forEach(w2 => {
      if (w2.includes(word) || word.includes(w2)) matches += 0.5;
    });
  });
  
  const similarity = (matches / Math.max(words1.size, words2.size)) * 100;
  return Math.min(Math.round(similarity), 100);
};

/**
 * AIClaimChat - Dynamic AI Verification for FOUND item claims
 * 
 * PHASE 2 UPDATES:
 * - Questions generated dynamically from item + secret message
 * - No hardcoded questions
 * - Support English/Tanglish
 * - Calculate match percentage
 */
const AIClaimChat = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { token, user } = useAuth();
  const chatEndRef = useRef(null);
  
  const [item, setItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [itemError, setItemError] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate dynamic questions based on item and secret message
  const generateDynamicQuestions = async (itemData) => {
    setGeneratingQuestions(true);
    
    const itemKeyword = safeString(itemData?.item_keyword) || 'item';
    const description = safeString(itemData?.description) || '';
    const location = safeString(itemData?.location) || '';
    const secretMessage = safeString(itemData?.secret_message) || '';
    
    try {
      // Try to generate AI-powered questions
      const authToken = token || localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/claims/generate-questions`,
        {
          item_keyword: itemKeyword,
          description: description,
          location: location,
          secret_message: secretMessage
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (response.data?.questions?.length === 3) {
        return response.data.questions;
      }
    } catch (error) {
      console.log('AI question generation unavailable, using smart fallback');
    }
    
    // Smart fallback: Generate questions based on available info
    const generatedQuestions = [];
    
    // Question 1: Based on item description
    if (description.length > 10) {
      const descWords = description.split(' ').slice(0, 5).join(' ');
      generatedQuestions.push(
        `This ${itemKeyword} was described as "${descWords}...". Can you describe specific features like color, brand, or any marks?`
      );
    } else {
      generatedQuestions.push(
        `Can you describe this ${itemKeyword} in detail? What color is it? Any brand or model?`
      );
    }
    
    // Question 2: Based on secret message hints
    if (secretMessage.length >= 20) {
      // Extract hints from secret message
      const hints = secretMessage.toLowerCase();
      if (hints.includes('scratch') || hints.includes('mark') || hints.includes('damage')) {
        generatedQuestions.push(
          `You mentioned it's yours - are there any specific marks, scratches, or damage on this item that only you would know about?`
        );
      } else if (hints.includes('sticker') || hints.includes('cover') || hints.includes('case')) {
        generatedQuestions.push(
          `Does this item have any stickers, case, cover, or accessories that you can describe?`
        );
      } else if (hints.includes('name') || hints.includes('written') || hints.includes('label')) {
        generatedQuestions.push(
          `Is there any name, label, or writing on this item? What does it say?`
        );
      } else {
        generatedQuestions.push(
          `What unique identifying feature does this ${itemKeyword} have that only the owner would know?`
        );
      }
    } else {
      generatedQuestions.push(
        `What makes this ${itemKeyword} uniquely yours? Describe any personal marks or customizations.`
      );
    }
    
    // Question 3: Based on location/time
    if (location) {
      generatedQuestions.push(
        `This was found at ${location}. When and where exactly did you lose this ${itemKeyword}? Be specific about date and location.`
      );
    } else {
      generatedQuestions.push(
        `When did you realize you lost this ${itemKeyword}? Where were you when you last had it?`
      );
    }
    
    return generatedQuestions;
  };

  // Load and validate item
  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) {
        setItemError('No item ID provided. Please select an item to claim.');
        setItemLoading(false);
        return;
      }

      try {
        const authToken = token || localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/api/items/public`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const foundItem = response.data.find(i => i.id === itemId);
        
        if (!foundItem) {
          setItemError('Item not found. It may have been deleted or claimed.');
          setItemLoading(false);
          return;
        }

        if (foundItem.item_type !== 'found') {
          setItemError('This is a LOST item. You cannot claim it. Use "I Found This Item" instead.');
          setItemLoading(false);
          return;
        }

        if (foundItem.status === 'claimed' || foundItem.status === 'returned') {
          setItemError(`This item is already ${foundItem.status}.`);
          setItemLoading(false);
          return;
        }

        if (foundItem.is_owner || foundItem.student_id === user?.id) {
          setItemError('You cannot claim your own item.');
          setItemLoading(false);
          return;
        }

        setItem(foundItem);
        
        // Generate dynamic questions
        const dynamicQuestions = await generateDynamicQuestions(foundItem);
        setQuestions(dynamicQuestions);
        
        // Start chat with first question
        setMessages([
          { 
            type: 'bot', 
            content: `Hi! I'll help verify your claim for this ${safeString(foundItem?.item_keyword || 'item')}. I have 3 verification questions for you.\n\n**Question 1 of 3:**\n${dynamicQuestions[0]}`
          }
        ]);
        
        setGeneratingQuestions(false);
        
      } catch (error) {
        console.error('Failed to load item:', error);
        setItemError('Failed to load item details. Please try again.');
      } finally {
        setItemLoading(false);
      }
    };

    if (token) {
      loadItem();
    }
  }, [itemId, token, user]);

  const handleSendMessage = () => {
    // FIX: Validate only user-typed string input
    const userInput = currentInput.trim();
    
    if (!userInput || userInput.length === 0) {
      toast.error('Please type an answer');
      return;
    }
    
    if (userInput.length < 5) {
      toast.error('Please provide a more detailed answer (at least 5 characters)');
      return;
    }

    if (!item || questions.length === 0) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userInput }]);
    
    // Store answer
    const newAnswers = [...answers, { question: questions[currentQuestion], answer: userInput }];
    setAnswers(newAnswers);
    
    setCurrentInput('');

    // Move to next question or submit
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        const nextQ = currentQuestion + 1;
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: `**Question ${nextQ + 1} of 3:**\n${questions[nextQ]}`
        }]);
        setCurrentQuestion(nextQ);
      }, 500);
    } else {
      // All questions answered - submit claim
      handleSubmitClaim(newAnswers);
    }
  };

  const handleSubmitClaim = async (finalAnswers) => {
    setSubmitting(true);
    
    setMessages(prev => [...prev, { 
      type: 'bot', 
      content: '⏳ Analyzing your answers and calculating match... Please wait.' 
    }]);

    try {
      // Calculate similarity with secret message
      const allAnswersText = finalAnswers.map(a => a.answer).join(' ');
      const secretMessage = safeString(item?.secret_message) || '';
      const matchPercentage = calculateSimilarity(allAnswersText, secretMessage + ' ' + safeString(item?.description));
      
      const authToken = token || localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('item_id', itemId);
      formData.append('product_type', safeString(item?.item_keyword) || 'Unknown');
      formData.append('description', finalAnswers[0]?.answer || '');
      formData.append('identification_marks', finalAnswers[1]?.answer || '');
      formData.append('lost_location', finalAnswers[2]?.answer || '');
      formData.append('approximate_date', 'Recently');
      formData.append('match_percentage', matchPercentage.toString());
      formData.append('qa_data', JSON.stringify(finalAnswers));

      const response = await axios.post(`${BACKEND_URL}/api/claims/ai-powered`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmitted(true);
      
      const confidenceBand = response.data.ai_analysis?.confidence_band || 
        (matchPercentage >= 70 ? 'HIGH' : matchPercentage >= 40 ? 'MEDIUM' : 'LOW');
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: `✅ **Claim Submitted Successfully!**\n\nYour claim has been sent to Admin for review.\n\n**Match Score:** ${matchPercentage}% (${confidenceBand} confidence)\n\nYou will be notified once a decision is made.`,
        isSuccess: true
      }]);

      toast.success('Claim submitted for admin review!');
      
    } catch (error) {
      console.error('Claim submission error:', error);
      const errorData = error.response?.data;
      let errorMsg = 'Failed to submit claim';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : 'Submission failed';
        } else if (errorData.msg) {
          errorMsg = errorData.msg;
        }
      }
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: `❌ **Error:** ${errorMsg}\n\nPlease try again.`,
        isError: true
      }]);
      
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Loading state
  if (itemLoading || generatingQuestions) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4" />
            <p className="text-slate-600">
              {generatingQuestions ? 'Generating verification questions...' : 'Loading item details...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (itemError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Cannot Submit Claim</h3>
              <p className="text-red-600 mb-6">{itemError}</p>
              <Button onClick={() => navigate('/student/found-items')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Found Items
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/found-items')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 text-sm sm:text-base">AI Claim Verification</h1>
            <p className="text-xs text-slate-500">Answer 3 questions to submit your claim</p>
          </div>
        </div>
      </div>

      {/* Item Preview Card */}
      {item && (
        <Card className="mb-4 border-purple-200 bg-purple-50/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex gap-3 sm:gap-4">
              {item.image_url ? (
                <img 
                  src={`${BACKEND_URL}${item.image_url}`}
                  alt="Item"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageOff className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Badge className="status-found mb-1 sm:mb-2 text-xs">FOUND ITEM</Badge>
                <p className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2">
                  {safeString(item.description)}
                </p>
                <div className="flex items-center gap-2 mt-1 sm:mt-2 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{safeString(item.location)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-72 sm:h-96 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] sm:max-w-[85%] rounded-lg p-2.5 sm:p-3 ${
                  msg.type === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : msg.isError 
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : msg.isSuccess
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                }`}>
                  {msg.type === 'bot' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">AI Assistant</span>
                    </div>
                  )}
                  <div className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          {!submitted && (
            <div className="border-t p-3 sm:p-4">
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  disabled={submitting}
                  className="flex-1 text-sm"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Question {currentQuestion + 1} of {questions.length || 3}
              </p>
            </div>
          )}

          {/* Done - Go back button */}
          {submitted && (
            <div className="border-t p-3 sm:p-4">
              <Button 
                onClick={() => navigate('/student/my-items')}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                View My Claims
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIClaimChat;
