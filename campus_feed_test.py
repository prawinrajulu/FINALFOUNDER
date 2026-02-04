import requests
import sys
import json
from datetime import datetime

class CampusFeedTester:
    def __init__(self, base_url="https://git-inspector-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.sam_token = None
        self.raju_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_post_id = None

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append(f"{test_name}: {details}")
            print(f"❌ {test_name} - FAILED: {details}")
        if details:
            print(f"   Details: {details}")

    def make_request(self, method, endpoint, data=None, files=None, headers=None, token=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if token:
            default_headers['Authorization'] = f'Bearer {token}'
        
        if headers:
            default_headers.update(headers)
        
        # Remove Content-Type for file uploads
        if files:
            default_headers.pop('Content-Type', None)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=default_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)
            
            return response
        except requests.exceptions.Timeout:
            print(f"Request timeout for {method} {endpoint}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"Connection error for {method} {endpoint}")
            return None
        except Exception as e:
            print(f"Request error for {method} {endpoint}: {str(e)}")
            return None

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        print("\n🔐 Testing Admin Login...")
        
        response = self.make_request('POST', 'auth/admin/login', {
            "username": "superadmin",
            "password": "SuperAdmin@123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get('token')
            self.log_result("Admin Login", True, f"Token obtained, Role: {data.get('role')}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Admin Login", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def test_sam_login(self):
        """Test Sam student login"""
        print("\n👨‍🎓 Testing Sam Student Login...")
        
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205028",
            "dob": "17-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.sam_token = data.get('token')
            self.log_result("Sam Student Login", True, f"Logged in as Sam")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Sam Student Login", False, f"Error: {error_msg}")
            return False

    def test_raju_login(self):
        """Test RAJU student login"""
        print("\n👨‍🎓 Testing RAJU Student Login...")
        
        response = self.make_request('POST', 'auth/student/login', {
            "roll_number": "112723205047",
            "dob": "23-04-2006"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.raju_token = data.get('token')
            self.log_result("RAJU Student Login", True, f"Logged in as RAJU")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("RAJU Student Login", False, f"Error: {error_msg}")
            return False

    def test_create_feed_post_as_admin(self):
        """Test POST /api/feed/posts as admin"""
        print("\n📝 Testing Create Feed Post (Admin)...")
        
        # Use requests.post with form data for feed post creation
        url = f"{self.base_url}/feed/posts"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        form_data = {
            'title': 'Campus Notice - Library Hours Update',
            'description': 'The library will have extended hours during exam week. Open 24/7 from Monday to Friday.',
            'post_type': 'announcement'
        }
        
        try:
            response = requests.post(url, data=form_data, headers=headers, timeout=30)
        except Exception as e:
            self.log_result("Create Feed Post (Admin)", False, f"Request error: {str(e)}")
            return None
        
        if response and response.status_code == 200:
            data = response.json()
            self.test_post_id = data.get('post_id')
            success = 'created successfully' in data.get('message', '')
            
            self.log_result("Create Feed Post (Admin)", success,
                          f"Post ID: {self.test_post_id}, Message: {data.get('message')}")
            return self.test_post_id
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Create Feed Post (Admin)", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return None

    def test_get_feed_posts_enrichment(self):
        """Test GET /api/feed/posts with comment enrichment"""
        print("\n📋 Testing Get Feed Posts with Comment Enrichment...")
        
        response = self.make_request('GET', 'feed/posts', token=self.sam_token)
        
        if response and response.status_code == 200:
            posts = response.json()
            is_list = isinstance(posts, list)
            
            # Check post structure
            has_proper_structure = True
            comments_enriched = True
            
            if posts:
                sample_post = posts[0]
                required_fields = ['id', 'title', 'description', 'post_type', 'comments', 'comment_count']
                has_proper_structure = all(field in sample_post for field in required_fields)
                
                # Check comment structure if comments exist
                if sample_post.get('comments'):
                    sample_comment = sample_post['comments'][0]
                    comment_fields = ['id', 'content', 'author', 'likes', 'liked_by', 'is_admin_comment']
                    comments_enriched = all(field in sample_comment for field in comment_fields)
            
            success = is_list and has_proper_structure and comments_enriched
            self.log_result("Get Feed Posts with Enrichment", success,
                          f"Posts count: {len(posts)}, Proper structure: {has_proper_structure}, Comments enriched: {comments_enriched}")
            return True
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Get Feed Posts with Enrichment", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False

    def test_student_comment_on_post(self):
        """Test POST /api/feed/posts/{post_id}/comments as student"""
        if not self.test_post_id:
            self.log_result("Student Comment on Post", False, "No post ID available")
            return None
            
        print("\n💬 Testing Student Comment on Feed Post...")
        
        response = self.make_request('POST', f'feed/posts/{self.test_post_id}/comments', {
            "content": "Thank you for the update! This is very helpful for exam preparation."
        }, token=self.sam_token)
        
        if response and response.status_code == 200:
            data = response.json()
            comment_id = data.get('comment_id')
            success = 'Comment added' in data.get('message', '')
            
            self.log_result("Student Comment on Post", success,
                          f"Comment ID: {comment_id}, Message: {data.get('message')}")
            return comment_id
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Student Comment on Post", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return None

    def test_admin_comment_on_post(self):
        """Test POST /api/feed/posts/{post_id}/comments as admin"""
        if not self.test_post_id:
            self.log_result("Admin Comment on Post", False, "No post ID available")
            return None
            
        print("\n👨‍💼 Testing Admin Comment on Feed Post...")
        
        response = self.make_request('POST', f'feed/posts/{self.test_post_id}/comments', {
            "content": "Additional note: Please bring your student ID for 24/7 access verification."
        }, token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            comment_id = data.get('comment_id')
            success = 'Comment added' in data.get('message', '')
            
            self.log_result("Admin Comment on Post", success,
                          f"Comment ID: {comment_id}, Message: {data.get('message')}")
            return comment_id
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Admin Comment on Post", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return None

    def test_comment_likes_toggle(self, comment_id):
        """Test POST /api/feed/posts/{post_id}/comments/{comment_id}/like with toggle behavior"""
        if not self.test_post_id or not comment_id:
            self.log_result("Comment Likes Toggle", False, "Missing post ID or comment ID")
            return
            
        print("\n❤️ Testing Comment Likes Toggle...")
        
        # First like
        response1 = self.make_request('POST', f'feed/posts/{self.test_post_id}/comments/{comment_id}/like', 
                                    token=self.raju_token)
        
        if response1 and response1.status_code == 200:
            data1 = response1.json()
            is_liked_first = data1.get('is_liked', False)
            likes_count_first = data1.get('likes', 0)
            
            # Second like (should unlike)
            response2 = self.make_request('POST', f'feed/posts/{self.test_post_id}/comments/{comment_id}/like', 
                                        token=self.raju_token)
            
            if response2 and response2.status_code == 200:
                data2 = response2.json()
                is_liked_second = data2.get('is_liked', True)
                likes_count_second = data2.get('likes', 1)
                
                # Check toggle behavior
                toggle_works = (is_liked_first == True and is_liked_second == False and 
                              likes_count_first == 1 and likes_count_second == 0)
                
                self.log_result("Comment Likes Toggle", toggle_works,
                              f"First like: {is_liked_first} (count: {likes_count_first}), Second like: {is_liked_second} (count: {likes_count_second})")
            else:
                error_msg = response2.json().get('detail', 'Unknown error') if response2 else 'No response'
                self.log_result("Comment Likes Toggle", False,
                              f"Second request failed - Status: {response2.status_code if response2 else 'None'}, Error: {error_msg}")
        else:
            error_msg = response1.json().get('detail', 'Unknown error') if response1 else 'No response'
            self.log_result("Comment Likes Toggle", False,
                          f"First request failed - Status: {response1.status_code if response1 else 'None'}, Error: {error_msg}")

    def test_comment_author_enrichment(self):
        """Test that comments include proper author enrichment"""
        if not self.test_post_id:
            self.log_result("Comment Author Enrichment", False, "No post ID available")
            return
            
        print("\n👤 Testing Comment Author Enrichment...")
        
        # Get the specific post to check comment enrichment
        response = self.make_request('GET', f'feed/posts/{self.test_post_id}', token=self.sam_token)
        
        if response and response.status_code == 200:
            post = response.json()
            comments = post.get('comments', [])
            
            if not comments:
                self.log_result("Comment Author Enrichment", False, "No comments found to test")
                return
            
            # Check student comment enrichment
            student_comment = next((c for c in comments if not c.get('is_admin_comment')), None)
            admin_comment = next((c for c in comments if c.get('is_admin_comment')), None)
            
            student_enriched = False
            admin_enriched = False
            
            if student_comment:
                author = student_comment.get('author', {})
                student_enriched = all(field in author for field in ['full_name', 'department', 'year'])
            
            if admin_comment:
                author = admin_comment.get('author', {})
                admin_enriched = all(field in author for field in ['full_name', 'role'])
            
            success = (student_enriched or not student_comment) and (admin_enriched or not admin_comment)
            self.log_result("Comment Author Enrichment", success,
                          f"Student comment enriched: {student_enriched}, Admin comment enriched: {admin_enriched}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Comment Author Enrichment", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def test_admin_comment_flag(self):
        """Test that admin comments have is_admin_comment: true"""
        if not self.test_post_id:
            self.log_result("Admin Comment Flag", False, "No post ID available")
            return
            
        print("\n🏷️ Testing Admin Comment Flag...")
        
        # Get the post and check for admin comments
        response = self.make_request('GET', f'feed/posts/{self.test_post_id}', token=self.sam_token)
        
        if response and response.status_code == 200:
            post = response.json()
            comments = post.get('comments', [])
            
            admin_comments = [c for c in comments if c.get('is_admin_comment')]
            student_comments = [c for c in comments if not c.get('is_admin_comment')]
            
            # Check that admin comments are properly flagged
            admin_flags_correct = all(c.get('is_admin_comment') == True for c in admin_comments)
            student_flags_correct = all(c.get('is_admin_comment') == False for c in student_comments)
            
            success = admin_flags_correct and student_flags_correct
            self.log_result("Admin Comment Flag", success,
                          f"Admin comments: {len(admin_comments)}, Student comments: {len(student_comments)}, Flags correct: {success}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_result("Admin Comment Flag", False,
                          f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")

    def run_all_tests(self):
        """Run all Campus Feed tests"""
        print("🚀 Starting Campus Feed Backend Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("\n" + "="*70)
        print("🏫 TESTING CAMPUS FEED FEATURES - NEW IMPLEMENTATION")
        print("="*70)
        
        # Test 1: Admin Login
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Test 2: Student Logins
        if not self.test_sam_login():
            print("❌ Cannot proceed without Sam student authentication")
            return False
            
        if not self.test_raju_login():
            print("❌ Cannot proceed without RAJU student authentication")
            return False
        
        # Test 3: Admin creates feed post
        if not self.test_create_feed_post_as_admin():
            print("❌ Cannot proceed without test post")
            return False
        
        # Test 4: Get feed posts with enrichment
        self.test_get_feed_posts_enrichment()
        
        # Test 5: Student comments on post
        student_comment_id = self.test_student_comment_on_post()
        
        # Test 6: Admin comments on post
        admin_comment_id = self.test_admin_comment_on_post()
        
        # Test 7: Comment likes toggle behavior
        if student_comment_id:
            self.test_comment_likes_toggle(student_comment_id)
        
        # Test 8: Comment author enrichment
        self.test_comment_author_enrichment()
        
        # Test 9: Admin comment flag verification
        self.test_admin_comment_flag()
        
        # Print Summary
        print(f"\n📊 CAMPUS FEED TEST SUMMARY")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        else:
            print(f"\n🎉 ALL CAMPUS FEED TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CampusFeedTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())