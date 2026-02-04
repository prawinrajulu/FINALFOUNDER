import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { 
  Megaphone, Heart, MessageCircle, Send, Plus, Trash2, 
  Award, Bell, ArrowLeft, MoreVertical, Calendar, User,
  Image as ImageIcon, MessageSquareOff
} from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Campus Notice & Appreciation Feed
 * Phase 2 - Item 2: Replaces Common Lobby
 * 
 * - Admin/SuperAdmin: Create, Edit, Delete posts
 * - Students: Like, Comment
 * - Admin can moderate comments
 */
const CampusFeed = () => {
  const navigate = useNavigate();
  const { user, token, role, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Create post form
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    post_type: 'announcement',
    comments_enabled: true,
    image: null
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/feed/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', postForm.title);
      formData.append('description', postForm.description);
      formData.append('post_type', postForm.post_type);
      formData.append('comments_enabled', postForm.comments_enabled);
      if (postForm.image) {
        formData.append('image', postForm.image);
      }

      await axios.post(`${BACKEND_URL}/api/feed/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Post created successfully!');
      setShowCreateDialog(false);
      setPostForm({ title: '', description: '', post_type: 'announcement', comments_enabled: true, image: null });
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/feed/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: response.data.likes, is_liked_by_me: response.data.is_liked }
          : p
      ));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/feed/posts/${postId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Comment added!');
      setNewComment('');
      fetchPosts();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to add comment';
      toast.error(message);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await axios.delete(
        `${BACKEND_URL}/api/feed/posts/${postId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Comment deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/feed/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const getPostTypeIcon = (type) => {
    switch(type) {
      case 'appreciation': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'notice': return <Bell className="w-5 h-5 text-blue-500" />;
      default: return <Megaphone className="w-5 h-5 text-purple-500" />;
    }
  };

  const getPostTypeBadge = (type) => {
    switch(type) {
      case 'appreciation': return <Badge className="bg-yellow-100 text-yellow-700">Appreciation</Badge>;
      case 'notice': return <Badge className="bg-blue-100 text-blue-700">Notice</Badge>;
      default: return <Badge className="bg-purple-100 text-purple-700">Announcement</Badge>;
    }
  };

  const PostCard = ({ post }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getPostTypeIcon(post.post_type)}
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {post.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <User className="w-3 h-3" />
                <span>{post.created_by_name}</span>
                <span>•</span>
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPostTypeBadge(post.post_type)}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeletePost(post.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Image */}
        {post.image_url && (
          <img
            src={`${BACKEND_URL}${post.image_url}`}
            alt={post.title}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Post Content */}
        <p className="text-slate-700 whitespace-pre-wrap">{post.description}</p>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLikePost(post.id)}
            className={`flex items-center gap-2 ${post.is_liked_by_me ? 'text-red-500' : 'text-slate-600'}`}
          >
            <Heart className={`w-5 h-5 ${post.is_liked_by_me ? 'fill-current' : ''}`} />
            <span>{post.likes || 0}</span>
          </Button>
          <div className="flex items-center gap-2 text-slate-600">
            <MessageCircle className="w-5 h-5" />
            <span>{post.comment_count || 0} comments</span>
          </div>
          {!post.comments_enabled && (
            <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <MessageSquareOff className="w-4 h-4" />
              Comments disabled
            </div>
          )}
        </div>

        {/* Recent Comments */}
        {post.recent_comments?.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase">Recent Comments</p>
            {post.recent_comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-slate-600">
                    {comment.author?.full_name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-700">
                      {comment.author?.full_name || 'Anonymous'}
                    </p>
                    {(isAdmin || comment.author_id === user?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(post.id, comment.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment - Students Only */}
        {post.comments_enabled && role === 'student' && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <Input
              placeholder="Write a comment..."
              value={selectedPost === post.id ? newComment : ''}
              onChange={(e) => {
                setSelectedPost(post.id);
                setNewComment(e.target.value);
              }}
              onFocus={() => setSelectedPost(post.id)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => handleAddComment(post.id)}
              disabled={selectedPost !== post.id || !newComment.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(isAdmin ? '/admin' : '/student')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-purple-600" />
                <h1 className="font-outfit font-bold text-slate-900">Campus Feed</h1>
              </div>
            </div>
            
            {isAdmin && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Campus Notice & Appreciation Feed</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Official announcements, student appreciations for honest returns, and campus-wide notices.
                  {role === 'student' && " Like and comment on posts!"}
                  {isAdmin && " Create posts to communicate with students."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700">No posts yet</h3>
              <p className="text-slate-500 mt-2">
                {isAdmin 
                  ? "Create the first post to share with students!" 
                  : "Check back later for announcements and updates."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      {/* Create Post Dialog - Admin Only */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share announcements, appreciate students, or post notices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Post Type</Label>
              <Select 
                value={postForm.post_type} 
                onValueChange={(value) => setPostForm({ ...postForm, post_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-500" />
                      Announcement
                    </div>
                  </SelectItem>
                  <SelectItem value="appreciation">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      Appreciation
                    </div>
                  </SelectItem>
                  <SelectItem value="notice">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      Notice
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Enter post title"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Write your post content..."
                value={postForm.description}
                onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPostForm({ ...postForm, image: e.target.files[0] })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="comments_enabled"
                checked={postForm.comments_enabled}
                onChange={(e) => setPostForm({ ...postForm, comments_enabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="comments_enabled" className="text-sm">Allow comments</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePost} 
              disabled={submitting || !postForm.title.trim() || !postForm.description.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? 'Creating...' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampusFeed;
